// Integration test. Needs `npm install` (express, zod, helmet...). No Supabase or Gemini network calls are made.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

const config = loadConfig({ SUPABASE_URL: 'http://localhost:54321', SUPABASE_ANON_KEY: 'anon-key-placeholder', GEMINI_API_KEY: 'secret-gemini-key', GEMINI_MODEL: 'm' });

async function withServer(fn) {
  const server = createApp(config, { llm: { complete: async () => 'x' } }).listen(0);
  try { await fn(`http://127.0.0.1:${server.address().port}`); } finally { server.close(); }
}

test('health is public and sets security headers incl. CSP', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('x-content-type-options'));
    assert.match(res.headers.get('content-security-policy'), /script-src 'self' https:\/\/cdn\.jsdelivr\.net/);
  });
});
test('/api/config exposes only public Supabase values, never the Gemini key', async () => {
  await withServer(async (base) => {
    const text = await (await fetch(`${base}/api/config`)).text();
    assert.deepEqual(Object.keys(JSON.parse(text)).sort(), ['supabaseAnonKey', 'supabaseUrl']);
    assert.ok(!text.includes('secret-gemini-key'));
  });
});
test('frontend is served from the same origin', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
    assert.match(await res.text(), /PRD Pilot/);
    assert.equal((await fetch(`${base}/js/app.js`)).status, 200);
  });
});
test('every protected route rejects requests without a token (401)', async () => {
  await withServer(async (base) => {
    const id = '00000000-0000-4000-8000-000000000000';
    const routes = [['GET', '/api/projects'], ['POST', '/api/projects'], ['GET', `/api/projects/${id}`], ['PATCH', `/api/projects/${id}`], ['DELETE', `/api/projects/${id}`],
      ['GET', `/api/projects/${id}/messages`], ['POST', `/api/projects/${id}/messages`], ['GET', `/api/projects/${id}/prd`], ['POST', `/api/projects/${id}/prd/generate`],
      ['PUT', `/api/projects/${id}/prd/sections/risks`], ['POST', `/api/projects/${id}/prd/sections/risks/regenerate`], ['GET', `/api/projects/${id}/prd/versions/1`]];
    for (const [method, path] of routes) {
      const res = await fetch(`${base}${path}`, { method, headers: { 'content-type': 'application/json' }, body: method === 'GET' || method === 'DELETE' ? undefined : '{}' });
      assert.equal(res.status, 401, `${method} ${path}`);
    }
  });
});
test('oversized bodies and unknown API routes are handled safely', async () => {
  await withServer(async (base) => {
    const big = await fetch(`${base}/api/projects`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer x' }, body: JSON.stringify({ name: 'x'.repeat(200000) }) });
    assert.equal(big.status, 413);
    assert.equal((await fetch(`${base}/api/nope`)).status, 404);
  });
});
