export class ApiError extends Error {
  constructor(status, message, code, data = {}) { super(message); this.name = 'ApiError'; this.status = status; this.code = code; this.data = data; }
}

const LLM_REASONS = {
  quota: 'The Gemini free-tier quota or rate limit was reached. Wait a minute and retry.',
  auth: 'The server rejected its Gemini API key. Check GEMINI_API_KEY in .env and restart the server.',
  model_not_found: 'The configured Gemini model was not found. Check GEMINI_MODEL in .env and restart the server.',
  timeout: 'The AI took too long to respond. Please retry.',
  blocked: 'The AI declined to answer this content. Try rephrasing.',
  empty: 'The AI returned an empty answer. Please retry.',
  config: 'The Gemini SDK is not installed on the server. Run npm install.',
};
const CODES = {
  NETWORK: 'Cannot reach the server. Check that it is running and try again.',
  STALE_VERSION: 'This PRD changed since you opened it. Reload the latest version and try again.',
  NO_CONVERSATION: 'Chat about your product first, then generate the PRD.',
  NO_PRD: 'Generate a PRD first.',
  PRD_INVALID_OUTPUT: 'The AI returned a malformed PRD. Please retry.',
  CONVERSATION_TOO_LONG: 'This conversation is too long. Generate the PRD or start a new project.',
  NO_SESSION: 'Your session expired. Please sign in again.',
};

export function friendlyMessage(e) {
  if (e instanceof ApiError) {
    if (e.code === 'LLM_FAILED') return LLM_REASONS[e.data?.reason] ?? 'The AI service is unavailable right now. Your message was saved; please retry.';
    if (e.code && CODES[e.code]) return CODES[e.code];
    if (e.status === 429) return 'Too many requests. Please wait a moment and try again.';
    return e.message;
  }
  return e instanceof Error ? e.message : 'Something went wrong.';
}

export function timeAgo(iso, now = Date.now()) {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d} d ago`;
  return new Date(iso).toLocaleDateString();
}

// Merge messages by id and keep chronological order.
export function mergeMessages(current, incoming) {
  const map = new Map();
  for (const m of [...current, ...incoming]) map.set(m.id, m);
  return [...map.values()].sort((a, b) => (a.created_at === b.created_at ? a.id.localeCompare(b.id) : a.created_at.localeCompare(b.created_at)));
}
