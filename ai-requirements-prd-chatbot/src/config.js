import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.string().default('development'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(10),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1),
  LLM_TIMEOUT_MS: z.coerce.number().default(45000),
  LLM_MAX_OUTPUT_TOKENS: z.coerce.number().default(1500),
  MAX_BODY_KB: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(60),
  CHAT_RATE_LIMIT_MAX: z.coerce.number().default(10),
  MAX_MESSAGES_PER_PROJECT: z.coerce.number().default(500),
  HISTORY_CHAR_BUDGET: z.coerce.number().default(24000),
  PRD_MAX_OUTPUT_TOKENS: z.coerce.number().default(8000),
  PRD_TIMEOUT_MS: z.coerce.number().default(120000),
  PRD_TRANSCRIPT_CHAR_BUDGET: z.coerce.number().default(60000),
  PRD_RATE_LIMIT_MAX: z.coerce.number().default(5),
});

export function loadConfig(env = process.env) {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const keys = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid environment configuration: ${keys}`); // names only, never values
  }
  return parsed.data;
}
