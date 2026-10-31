import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, escapeHtml, prdToMarkdown } from '../public/js/markdown.js';
import { ApiError, friendlyMessage, mergeMessages, timeAgo } from '../public/js/errors.js';

test('raw HTML and script tags are escaped, never rendered', () => {
  const html = renderMarkdown('<script>alert(1)</script> <img src=x onerror=alert(1)>');
  assert.ok(!html.includes('<script>') && !html.includes('<img'));
  assert.match(html, /&lt;script&gt;/);
});
test('headings, bold, code, lists and tables render', () => {
  const html = renderMarkdown('## Title\n\n**bold** and `code`\n\n- a\n- b\n\n1. one\n2. two\n\n| Metric | Target |\n|---|---|\n| DAU | 100 |');
  assert.match(html, /<h4>Title<\/h4>/); assert.match(html, /<strong>bold<\/strong>/); assert.match(html, /<code>code<\/code>/);
  assert.match(html, /<ul><li>a<\/li><li>b<\/li><\/ul>/); assert.match(html, /<ol><li>one<\/li><li>two<\/li><\/ol>/);
  assert.match(html, /<th>Metric<\/th>/); assert.match(html, /<td>100<\/td>/);
});
test('only http(s) links become anchors; javascript: is not linked', () => {
  assert.match(renderMarkdown('[ok](https://example.com)'), /<a href="https:\/\/example.com" target="_blank" rel="noopener noreferrer">ok<\/a>/);
  assert.ok(!renderMarkdown('[bad](javascript:alert(1))').includes('<a '));
});
test('escapeHtml handles quotes; empty input is safe', () => {
  assert.equal(escapeHtml(`"'<&>`), '&quot;&#39;&lt;&amp;&gt;');
  assert.equal(renderMarkdown(undefined), '');
});
test('prdToMarkdown builds a document with version', () => {
  const md = prdToMarkdown({ title: 'T', version: 2, content: { sections: [{ key: 'risks', title: 'Risks', body: 'x' }] } });
  assert.match(md, /^# T/); assert.match(md, /_Version 2_/); assert.match(md, /## Risks/);
});
test('friendly error messages cover Gemini failure reasons and network errors', () => {
  const llm = (reason) => new ApiError(502, 'x', 'LLM_FAILED', { reason });
  assert.match(friendlyMessage(llm('quota')), /quota/i);
  assert.match(friendlyMessage(llm('auth')), /GEMINI_API_KEY/);
  assert.match(friendlyMessage(llm('model_not_found')), /GEMINI_MODEL/);
  assert.match(friendlyMessage(new ApiError(0, 'x', 'NETWORK')), /Cannot reach/);
  assert.match(friendlyMessage(new ApiError(409, 'x', 'STALE_VERSION')), /changed/);
});
test('mergeMessages dedupes by id and sorts chronologically; timeAgo formats', () => {
  const a = { id: 'a', created_at: '2026-01-01T00:00:01Z' }, b = { id: 'b', created_at: '2026-01-01T00:00:02Z' };
  assert.deepEqual(mergeMessages([b], [a, b]).map((m) => m.id), ['a', 'b']);
  assert.equal(timeAgo('2026-01-01T00:00:00Z', Date.parse('2026-01-01T00:05:00Z')), '5 min ago');
});
