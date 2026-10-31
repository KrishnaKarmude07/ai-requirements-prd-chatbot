import { HttpError } from '../errors.js';
import { LlmError } from '../llm.js';
import { buildContext } from './history.js';
import { buildElicitationPrompt } from '../prompts/index.js';

// Steps follow the spec: verify ownership -> validate size -> persist user msg -> build context -> LLM -> persist reply.
export async function sendMessage({ repo, llm, limits, userId, projectId, content, requestId }) {
  const project = await repo.getProject(projectId);
  if (!project) throw new HttpError(404, 'Project not found');

  let userMessage = await repo.findByRequest(projectId, requestId, 'user');
  let isNew = false;
  if (!userMessage) {
    if ((await repo.countMessages(projectId)) >= limits.maxMessagesPerProject) {
      throw new HttpError(422, 'Conversation is too long. Generate the PRD or start a new project.', 'CONVERSATION_TOO_LONG');
    }
    const ins = await repo.insertMessage({ project_id: projectId, user_id: userId, role: 'user', content, client_request_id: requestId });
    userMessage = ins.conflict ? await repo.findByRequest(projectId, requestId, 'user') : ins.row; // concurrent duplicate
    isNew = !ins.conflict;
  }

  const existing = await repo.findByRequest(projectId, requestId, 'assistant');
  if (existing) return { userMessage, assistantMessage: existing, replayed: true };

  const history = await repo.listRecent(projectId, limits.historyFetchLimit);
  const { messages } = buildContext(history, limits.historyCharBudget);

  let reply;
  try {
    reply = await llm.complete({ system: buildElicitationPrompt(), messages });
  } catch (e) {
    if (!(e instanceof LlmError)) throw e;
    // The user message stays saved; the client retries with the SAME requestId.
    throw new HttpError(502, 'The AI service failed. Your message was saved; please retry.', 'LLM_FAILED', { retryable: e.retryable, reason: e.kind, userMessage });
  }

  const ins = await repo.insertMessage({ project_id: projectId, user_id: userId, role: 'assistant', content: reply, client_request_id: requestId });
  const assistantMessage = ins.conflict ? await repo.findByRequest(projectId, requestId, 'assistant') : ins.row;
  await repo.touchProject(projectId);
  return { userMessage, assistantMessage, replayed: false, isNew };
}
