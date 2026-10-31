// Provider adapter: Google Gemini via the official @google/genai SDK. All AI calls go through the backend.
export class LlmError extends Error {
  // kind: auth | model_not_found | quota | timeout | blocked | empty | config | unavailable
  constructor(message, { kind = 'unavailable', retryable = true, status } = {}) {
    super(message); this.name = 'LlmError'; this.kind = kind; this.retryable = retryable; this.status = status;
  }
}

const MAX_REPLY_CHARS = 20000; // matches messages.content check constraint

export function toLlmError(e) {
  const status = Number(e?.status ?? e?.code) || undefined;
  const msg = String(e?.message || '');
  if (e?.name === 'TimeoutError') return new LlmError('Gemini request timed out', { kind: 'timeout' });
  if (status === 401 || status === 403 || (status === 400 && /api key/i.test(msg))) return new LlmError('Gemini rejected the API key', { kind: 'auth', retryable: false, status });
  if (status === 404) return new LlmError('Gemini model not found', { kind: 'model_not_found', retryable: false, status });
  if (status === 429) return new LlmError('Gemini quota or rate limit reached', { kind: 'quota', status });
  return new LlmError(status ? `Gemini returned status ${status}` : 'Gemini request failed', { kind: 'unavailable', status, retryable: !status || status >= 500 });
}

export function createLlm({ apiKey, model, timeoutMs = 45000, maxOutputTokens = 1500, client }) {
  let clientPromise = client ? Promise.resolve(client) : null;
  const getClient = () => (clientPromise ??= import('@google/genai').then(({ GoogleGenAI }) => new GoogleGenAI({ apiKey })));

  return {
    async complete({ system, messages, maxTokens, timeoutMs: callTimeout, json }) {
      let ai;
      try { ai = await getClient(); }
      catch { throw new LlmError('Gemini SDK is not installed (run npm install)', { kind: 'config', retryable: false }); }
      const contents = messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      let timer;
      const timeout = new Promise((_, rej) => { timer = setTimeout(() => rej(Object.assign(new Error('timeout'), { name: 'TimeoutError' })), callTimeout ?? timeoutMs); });
      let res;
      try {
        res = await Promise.race([
          ai.models.generateContent({ model, contents, config: { systemInstruction: system, maxOutputTokens: maxTokens ?? maxOutputTokens, ...(json ? { responseMimeType: 'application/json' } : {}) } }),
          timeout,
        ]);
      } catch (e) { throw e instanceof LlmError ? e : toLlmError(e); }
      finally { clearTimeout(timer); }
      const text = typeof res?.text === 'string' ? res.text.trim() : '';
      if (!text) throw new LlmError('Gemini returned an empty or blocked response', { kind: res?.promptFeedback?.blockReason ? 'blocked' : 'empty', retryable: false });
      return text.slice(0, MAX_REPLY_CHARS);
    },
  };
}
