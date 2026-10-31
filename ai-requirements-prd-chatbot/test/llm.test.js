import test from 'node:test';
import assert from 'node:assert/strict';
import { createLlm, LlmError } from '../src/llm.js';

const fake = (impl) => ({ models: { generateContent: impl } });
const mk = (impl, extra = {}) => createLlm({ apiKey: 'AIza-secret', model: 'm', client: fake(impl), ...extra });

test('maps roles, passes system instruction and token limit, returns text', async () => {
  let seen;
  const llm = mk(async (req) => { seen = req; return { text: ' hi ' }; });
  const out = await llm.complete({ system: 'sys', messages: [{ role: 'user', content: 'q' }, { role: 'assistant', content: 'a' }], maxTokens: 77, json: true });
  assert.equal(out, 'hi');
  assert.deepEqual(seen.contents.map((c) => c.role), ['user', 'model']);
  assert.equal(seen.config.systemInstruction, 'sys');
  assert.equal(seen.config.maxOutputTokens, 77);
  assert.equal(seen.config.responseMimeType, 'application/json');
  assert.ok(!JSON.stringify(seen).includes('AIza-secret'));
});
test('error classification: auth, model, quota, server', async () => {
  const run = (err) => mk(async () => { throw err; }).complete({ system: 's', messages: [] });
  await assert.rejects(run({ status: 400, message: 'API key not valid' }), (e) => e.kind === 'auth' && !e.retryable);
  await assert.rejects(run({ status: 403 }), (e) => e.kind === 'auth');
  await assert.rejects(run({ status: 404 }), (e) => e.kind === 'model_not_found' && !e.retryable);
  await assert.rejects(run({ status: 429 }), (e) => e.kind === 'quota' && e.retryable);
  await assert.rejects(run({ status: 503 }), (e) => e.kind === 'unavailable' && e.retryable);
  await assert.rejects(run(new Error('network down')), (e) => e instanceof LlmError && e.retryable && !e.message.includes('AIza'));
});
test('empty or blocked response is rejected', async () => {
  await assert.rejects(mk(async () => ({ text: '' })).complete({ system: 's', messages: [] }), (e) => e.kind === 'empty');
  await assert.rejects(mk(async () => ({ promptFeedback: { blockReason: 'SAFETY' } })).complete({ system: 's', messages: [] }), (e) => e.kind === 'blocked');
});
test('times out', async () => {
  const llm = mk(() => new Promise(() => {}), { timeoutMs: 20 });
  await assert.rejects(llm.complete({ system: 's', messages: [] }), (e) => e.kind === 'timeout');
});
