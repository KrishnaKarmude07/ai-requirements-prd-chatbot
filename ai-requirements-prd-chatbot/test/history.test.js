import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContext } from '../src/services/history.js';

const m = (role, content) => ({ role, content });

test('keeps newest messages within budget, in order', () => {
  const msgs = [m('user', 'a'.repeat(50)), m('assistant', 'b'.repeat(50)), m('user', 'c'.repeat(50))];
  const { messages, truncated } = buildContext(msgs, 120);
  assert.equal(truncated, true);
  assert.equal(messages[0].role, 'user'); // leading assistant dropped
  assert.equal(messages.at(-1).content[0], 'c');
});
test('always keeps the newest message even if over budget', () => {
  const { messages } = buildContext([m('user', 'x'.repeat(500))], 10);
  assert.equal(messages.length, 1);
});
test('merges consecutive same-role messages and drops system', () => {
  const { messages } = buildContext([m('user', 'one'), m('system', 'ignore'), m('user', 'two')], 1000);
  assert.deepEqual(messages, [{ role: 'user', content: 'one\n\ntwo' }]);
});
