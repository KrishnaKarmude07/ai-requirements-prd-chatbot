import { HttpError } from '../errors.js';
import { SECTIONS, SECTION_KEYS, MAX_SECTION_CHARS } from '../prompts/prd.js';

const invalid = () => new HttpError(502, 'The AI returned an invalid PRD. Please retry.', 'PRD_INVALID_OUTPUT', { retryable: true });

// Parse the model's JSON, validate every section, and build the stored structure (server controls order/titles).
export function parsePrdJson(raw) {
  let text = String(raw).trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b <= a) throw invalid();
  let obj;
  try { obj = JSON.parse(text.slice(a, b + 1)); } catch { throw invalid(); }
  const title = typeof obj?.title === 'string' ? obj.title.trim().slice(0, 200) : '';
  if (!title || typeof obj.sections !== 'object' || obj.sections === null) throw invalid();
  const sections = [];
  for (const s of SECTIONS) {
    const body = obj.sections[s.key];
    if (typeof body !== 'string' || !body.trim() || body.length > MAX_SECTION_CHARS) throw invalid();
    sections.push({ key: s.key, title: s.title, body: body.trim() });
  }
  return { title, content: { sections } };
}

export function applySection(content, key, body) {
  if (!SECTION_KEYS.includes(key)) throw new HttpError(400, 'Unknown section', 'VALIDATION');
  return { sections: content.sections.map((s) => (s.key === key ? { ...s, body } : s)) };
}

export function prdToMarkdown(title, content) {
  return `# ${title}\n\n` + content.sections.map((s) => `## ${s.title}\n\n${s.body}`).join('\n\n') + '\n';
}
