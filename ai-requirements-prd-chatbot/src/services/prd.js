import { HttpError } from '../errors.js';
import { LlmError } from '../llm.js';
import { SECTIONS, MAX_SECTION_CHARS, formatTranscript, neutralize, buildPrdGenerationPrompt, buildSectionPrompt } from '../prompts/prd.js';
import { parsePrdJson, applySection, prdToMarkdown } from './prdSchema.js';

const llmFailed = (e) => new HttpError(502, 'The AI service failed. Please retry.', 'LLM_FAILED', { retryable: e.retryable, reason: e.kind });

async function callLlm(llm, args) {
  try { return await llm.complete(args); }
  catch (e) { if (e instanceof LlmError) throw llmFailed(e); throw e; }
}
async function loadProject(prdRepo, id) {
  const p = await prdRepo.getProject(id);
  if (!p) throw new HttpError(404, 'Project not found');
  return p;
}
async function save(prdRepo, msgRepo, projectId, title, content) {
  const row = await prdRepo.createVersion(projectId, title, content);
  if (!row) throw new HttpError(404, 'Project not found');
  await msgRepo.touchProject(projectId);
  return row;
}
// Optimistic concurrency: edits must be based on the latest version the client saw.
async function loadLatest(prdRepo, projectId, baseVersion) {
  const latest = await prdRepo.getLatest(projectId);
  if (!latest) throw new HttpError(409, 'Generate a PRD first', 'NO_PRD');
  if (latest.version !== baseVersion) throw new HttpError(409, 'The PRD changed since you loaded it', 'STALE_VERSION', { latestVersion: latest.version });
  return latest;
}
const sectionOf = (key) => SECTIONS.find((s) => s.key === key);

export async function generatePrd({ prdRepo, msgRepo, llm, limits, projectId }) {
  const project = await loadProject(prdRepo, projectId);
  const history = await msgRepo.listRecent(projectId, 200);
  if (!history.some((m) => m.role === 'user')) throw new HttpError(422, 'Chat about your product first', 'NO_CONVERSATION');
  const { text } = formatTranscript(history, limits.transcriptCharBudget);
  const user = `<project>\nName: ${neutralize(project.name)}\nDescription: ${neutralize(project.description)}\n</project>\n\n<transcript>\n${text}\n</transcript>\n\nWrite the PRD JSON now.`;
  const raw = await callLlm(llm, { system: buildPrdGenerationPrompt(), messages: [{ role: 'user', content: user }], maxTokens: limits.maxOutputTokens, timeoutMs: limits.timeoutMs, json: true });
  const { title, content } = parsePrdJson(raw);
  return save(prdRepo, msgRepo, projectId, title, content);
}

export async function editSection({ prdRepo, msgRepo, projectId, key, body, baseVersion }) {
  if (!sectionOf(key)) throw new HttpError(400, 'Unknown section', 'VALIDATION');
  await loadProject(prdRepo, projectId);
  const latest = await loadLatest(prdRepo, projectId, baseVersion);
  return save(prdRepo, msgRepo, projectId, latest.title, applySection(latest.content, key, body));
}

export async function regenerateSection({ prdRepo, msgRepo, llm, limits, projectId, key, instruction, baseVersion }) {
  const section = sectionOf(key);
  if (!section) throw new HttpError(400, 'Unknown section', 'VALIDATION');
  await loadProject(prdRepo, projectId);
  const latest = await loadLatest(prdRepo, projectId, baseVersion);
  const history = await msgRepo.listRecent(projectId, 200);
  const { text } = formatTranscript(history, limits.transcriptCharBudget);
  const current = latest.content.sections.find((s) => s.key === key)?.body ?? '';
  const user = `<transcript>\n${text}\n</transcript>\n\n<current_prd>\n${neutralize(prdToMarkdown(latest.title, latest.content))}\n</current_prd>\n\n<target_section key="${key}">\n${neutralize(current)}\n</target_section>\n` +
    (instruction ? `\n<user_instruction>\n${neutralize(instruction)}\n</user_instruction>\n` : '') + `\nWrite the new "${section.title}" section body now.`;
  const raw = await callLlm(llm, { system: buildSectionPrompt(section), messages: [{ role: 'user', content: user }], maxTokens: 2500, timeoutMs: limits.timeoutMs });
  const body = raw.trim().replace(/^```(?:markdown|md)?\s*/i, '').replace(/\s*```$/, '').trim();
  if (!body || body.length > MAX_SECTION_CHARS) throw new HttpError(502, 'The AI returned an invalid section. Please retry.', 'PRD_INVALID_OUTPUT', { retryable: true });
  return save(prdRepo, msgRepo, projectId, latest.title, applySection(latest.content, key, body));
}
