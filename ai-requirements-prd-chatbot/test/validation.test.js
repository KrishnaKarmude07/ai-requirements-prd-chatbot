import test from 'node:test';
import assert from 'node:assert/strict';
import { parse, projectCreate, projectUpdate, idParam } from '../src/validation.js';
import { loadConfig } from '../src/config.js';

test('project create trims and defaults description', () => {
  assert.deepEqual(parse(projectCreate, { name: '  App  ' }), { name: 'App', description: '' });
});
test('project create rejects empty name and unknown fields', () => {
  assert.throws(() => parse(projectCreate, { name: '' }));
  assert.throws(() => parse(projectCreate, { name: 'x', user_id: 'evil' }));
});
test('project update rejects invalid status and empty body', () => {
  assert.throws(() => parse(projectUpdate, { status: 'hacked' }));
  assert.throws(() => parse(projectUpdate, {}));
  assert.equal(parse(projectUpdate, { status: 'review' }).status, 'review');
});
test('id param must be uuid', () => {
  assert.throws(() => parse(idParam, '1; drop table projects'));
});
test('config error does not leak values', () => {
  assert.throws(() => loadConfig({ SUPABASE_URL: 'nope', SUPABASE_ANON_KEY: 'secret' }), (e) => !e.message.includes('secret'));
});
