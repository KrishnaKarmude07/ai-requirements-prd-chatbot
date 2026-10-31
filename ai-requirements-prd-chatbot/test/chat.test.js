import test from 'node:test';
import assert from 'node:assert/strict';
import { sendMessage } from '../src/services/chat.js';
import { HttpError } from '../src/errors.js';
import { LlmError } from '../src/llm.js';
import { buildElicitationPrompt } from '../src/prompts/index.js';

function fakeRepo({ project = true } = {}) {
  const msgs = []; let n = 0;
  return {
    msgs,
    getProject: async () => (project ? { id: 'p' } : null),
    countMessages: async () => msgs.length,
    insertMessage: async (r) => {
      if (r.client_request_id && msgs.some((m) => m.client_request_id === r.client_request_id && m.role === r.role)) return { conflict: true };
      const row = { id: 'm' + ++n, created_at: new Date(n * 1000).toISOString(), ...r }; msgs.push(row); return { row };
    },
    findByRequest: async (_p, id, role) => msgs.find((m) => m.client_request_id === id && m.role === role) || null,
    listRecent: async (_p, l) => msgs.slice(-l),
    touchProject: async () => {},
  };
}
const limits = { maxMessagesPerProject: 100, historyCharBudget: 10000, historyFetchLimit: 60 };
const base = { userId: 'u', projectId: 'p', limits };
const okLlm = () => { const calls = []; return { calls, complete: async (a) => { calls.push(a); return 'reply'; } }; };

test('happy path persists both messages and sends latest user message to LLM', async () => {
  const repo = fakeRepo(), llm = okLlm();
  const out = await sendMessage({ ...base, repo, llm, content: 'idea', requestId: 'r1' });
  assert.equal(repo.msgs.length, 2);
  assert.equal(out.assistantMessage.content, 'reply');
  assert.equal(llm.calls[0].messages.at(-1).content, 'idea');
  assert.match(llm.calls[0].system, /requirements analyst/);
});
test('LLM failure keeps user message; retry with same id does not duplicate it', async () => {
  const repo = fakeRepo();
  const bad = { complete: async () => { throw new LlmError('down'); } };
  await assert.rejects(sendMessage({ ...base, repo, llm: bad, content: 'idea', requestId: 'r1' }),
    (e) => e instanceof HttpError && e.status === 502 && e.code === 'LLM_FAILED' && e.data.userMessage.content === 'idea');
  assert.equal(repo.msgs.length, 1);
  const out = await sendMessage({ ...base, repo, llm: okLlm(), content: 'idea', requestId: 'r1' });
  assert.equal(repo.msgs.length, 2);
  assert.equal(out.replayed, false);
});
test('replaying a completed request does not call the LLM again', async () => {
  const repo = fakeRepo(), llm = okLlm();
  await sendMessage({ ...base, repo, llm, content: 'idea', requestId: 'r1' });
  const out = await sendMessage({ ...base, repo, llm, content: 'idea', requestId: 'r1' });
  assert.equal(out.replayed, true); assert.equal(llm.calls.length, 1); assert.equal(repo.msgs.length, 2);
});
test('missing/foreign project is 404 and nothing is written', async () => {
  const repo = fakeRepo({ project: false });
  await assert.rejects(sendMessage({ ...base, repo, llm: okLlm(), content: 'x', requestId: 'r1' }), (e) => e.status === 404);
  assert.equal(repo.msgs.length, 0);
});
test('conversation size cap is enforced for new requests', async () => {
  const repo = fakeRepo();
  await assert.rejects(sendMessage({ ...base, limits: { ...limits, maxMessagesPerProject: 0 }, repo, llm: okLlm(), content: 'x', requestId: 'r1' }), (e) => e.status === 422);
});
test('system prompt carries injection defenses', () => {
  assert.match(buildElicitationPrompt(), /untrusted data/);
});
