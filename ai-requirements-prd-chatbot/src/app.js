import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { requireAuth } from './middleware/auth.js';
import { projectsRouter } from './routes/projects.js';
import { messagesRouter } from './routes/messages.js';
import { prdRouter } from './routes/prd.js';
import { createLlm } from './llm.js';
import { errorHandler } from './errors.js';

// fileURLToPath (not URL.pathname) so the path is valid on Windows too.
const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

export function createApp(config, deps = {}) {
  const llm = deps.llm ?? createLlm({
    apiKey: config.GEMINI_API_KEY, model: config.GEMINI_MODEL,
    timeoutMs: config.LLM_TIMEOUT_MS, maxOutputTokens: config.LLM_MAX_OUTPUT_TOKENS,
  });
  const supabaseOrigin = new URL(config.SUPABASE_URL).origin;

  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'script-src': ["'self'", 'https://cdn.jsdelivr.net'],
        'style-src': ["'self'", 'https://cdn.jsdelivr.net'],
        'connect-src': ["'self'", supabaseOrigin],
        'img-src': ["'self'", 'data:'],
        'upgrade-insecure-requests': null, // would break http://localhost
      },
    },
  }));
  app.use(express.json({ limit: `${config.MAX_BODY_KB}kb` }));
  app.use('/api', rateLimit({ windowMs: config.RATE_LIMIT_WINDOW_MS, limit: config.RATE_LIMIT_MAX, standardHeaders: true, legacyHeaders: false }));

  const auth = requireAuth(config);
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  // Public values only (the anon key is designed to be public; RLS protects the data). Lets the browser sign in without a build step.
  app.get('/api/config', (_req, res) => res.json({ supabaseUrl: config.SUPABASE_URL, supabaseAnonKey: config.SUPABASE_ANON_KEY }));
  app.use('/api/projects/:id/messages', auth, messagesRouter({ llm, config }));
  app.use('/api/projects/:id/prd', auth, prdRouter({ llm, config }));
  app.use('/api/projects', auth, projectsRouter());
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use(express.static(PUBLIC_DIR));
  app.use(errorHandler);
  return app;
}
