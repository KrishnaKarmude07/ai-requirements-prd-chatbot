# AI Requirements & PRD Generation Chatbot

Turn a rough product idea into a structured Product Requirements Document through an AI interview.

**Stack:** Node.js 22 + Express (backend, `src/server.js`) · Supabase Auth + PostgreSQL with Row Level Security · Google Gemini API (`@google/genai`, backend only) · plain HTML + Bootstrap + JavaScript frontend served by Express (no build step).

## What it does
Register/log in → create projects → chat (the AI asks one question at a time and flags ambiguous, contradictory, duplicate and missing requirements) → history is saved and restored → generate a PRD (12 sections incl. user stories, acceptance criteria, risks, constraints, priorities, success metrics) → edit a section by hand or regenerate one section with the AI → every change is a new, inspectable version.

## Quick start (Windows)
Full guide: **[docs/WINDOWS_SETUP.md](docs/WINDOWS_SETUP.md)**. Short version, in the project folder:
```
npm install
copy .env.example .env        (PowerShell: Copy-Item .env.example .env)
notepad .env                  (fill in Supabase + Gemini values)
npm test
npm run dev
```
Then open http://localhost:3000. Before that, run `supabase/migrations/001_init.sql` once ([docs/SUPABASE.md](docs/SUPABASE.md)) and create a Gemini key ([docs/GEMINI.md](docs/GEMINI.md)).

## Documentation
| File | Purpose |
|---|---|
| docs/WINDOWS_SETUP.md | Step-by-step install and run on Windows |
| docs/SUPABASE.md | Database, RLS, auth settings, verification SQL |
| docs/GEMINI.md | API key, choosing a model, quota notes |
| docs/TESTING.md | Automated tests (what was actually run) + manual checklist |
| docs/API.md | Every endpoint with request/response examples |
| docs/TROUBLESHOOTING.md | Common errors and fixes |
| MANIFEST.txt | Every file in the project |

## Project layout
```
src/server.js            entry point (loads .env, starts Express)
src/app.js               middleware, security headers/CSP, routes, static frontend
src/config.js            validated environment variables
src/middleware/auth.js   verifies the Supabase JWT, attaches an RLS-scoped DB client
src/routes/              projects.js, messages.js, prd.js
src/services/            chat.js (conversation flow), prd.js (generate/edit/regenerate), history.js, prdSchema.js
src/repo/                messages.js, prd.js (all database queries)
src/prompts/             index.js (interview prompt), prd.js (PRD prompts + section list)
src/llm.js               Gemini adapter (the only file that talks to Gemini)
src/validation.js        zod request validation
public/                  index.html, css/app.css, js/*.js (frontend)
supabase/                migrations/001_init.sql and tests/*.sql
test/                    automated tests
```

## How a chat message flows
Browser → `POST /api/projects/:id/messages` (JWT) → auth middleware → ownership check (RLS) → save user message → build bounded history → Gemini → validate reply → save assistant message → response. If Gemini fails, the user message is already saved and the UI shows Retry, which re-sends with the same `clientRequestId` so nothing is duplicated.

## What to edit when something changes
| Change | File |
|---|---|
| Gemini model | `GEMINI_MODEL` in `.env` (restart) |
| Interview behaviour | `src/prompts/index.js` |
| PRD sections / wording | `src/prompts/prd.js` |
| Database schema | new SQL migration in `supabase/migrations/` (never edit 001 after applying) |
| An endpoint | `src/routes/*.js` + `public/js/api.js` + docs/API.md |

## Security notes
The Gemini key lives only in the backend `.env`. The browser only receives the Supabase URL and anon key (public by design). The Supabase service-role key is not used. All queries run with the user's own token, so RLS enforces ownership in addition to the checks in code. Rate limits, body-size limits, input validation, prompt-injection delimiters and a Content-Security-Policy are enabled. Never commit `.env`.

## Known limitations
- PRD has a fixed set of 12 sections; no Markdown/PDF export and no editing of earlier chat messages in this version.
- Bootstrap CSS and the Supabase browser library load from the jsDelivr CDN (internet required, no integrity hashes).
- Gemini free-tier limits, model availability and data-handling terms are set by Google and can change.
