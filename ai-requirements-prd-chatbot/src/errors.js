export class HttpError extends Error {
  constructor(status, message, code, data) { super(message); this.status = status; this.code = code; this.data = data; }
}
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function errorHandler(err, _req, res, _next) {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, code: err.code, ...(err.data || {}) });
  console.error('Unhandled error:', err?.message); // message only; no bodies/secrets
  res.status(500).json({ error: 'Internal server error' });
}
