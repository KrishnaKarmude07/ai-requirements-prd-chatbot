# Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Invalid environment configuration: X` at start | variable missing/blank in `.env` | fill X (see `.env.example`); no quotes; restart |
| `EADDRINUSE` | port 3000 in use | set `PORT=3001` in `.env`; restart; browse to that port |
| Page says "Cannot reach the backend" | server not running / wrong port | `npm run dev`; open the same port |
| Page says Supabase library did not load | CDN blocked/offline | check internet/ad-blocker/firewall |
| "Invalid login credentials" | wrong password or unconfirmed email | confirm email, or disable "Confirm email" in Supabase for testing |
| Registration "email rate limit exceeded" | Supabase built-in email limit | wait, or create the user in Dashboard → Authentication → Users (auto-confirm) |
| 401 "Invalid or expired token" | session expired / wrong `SUPABASE_URL`/anon key | log out and in; recheck both values come from the same project |
| 500 "Database error" or errors mentioning relation/column | migration not applied | run `001_init.sql`, then `verify_schema.sql` |
| New row violates row-level security | RLS doing its job (not your project) or stale session | log in again; never disable RLS |
| "Gemini API key" error (reason `auth`) | key wrong/restricted | create a new key in AI Studio, update `.env`, restart |
| "model not found" (`model_not_found`) | wrong `GEMINI_MODEL` | list models (docs/GEMINI.md), update `.env`, restart |
| Quota / rate limit (`quota`, HTTP 429) | free-tier limits | wait and retry; reduce use; check your limits in AI Studio |
| "AI returned an invalid PRD" | model output not valid JSON or cut off | retry; raise `PRD_MAX_OUTPUT_TOKENS`; try a stronger model |
| PRD generation times out | slow model | raise `PRD_TIMEOUT_MS` |
| `npm install` fails | network/proxy/old Node | retry; `node -v` must be 22+; delete `node_modules` and retry |
| `npm test` "Cannot find package" | dependencies not installed | `npm install` in the project root |
| PowerShell: `curl` shows odd output | `curl` is an alias there | use `curl.exe` or `Invoke-RestMethod` |
| PowerShell: scripts disabled | execution policy (only affects `.ps1`) | not needed here; use `npm` commands directly |
| After an AI failure and a page refresh there is no Retry button | retry state is kept in memory | your message is saved; just send again |
