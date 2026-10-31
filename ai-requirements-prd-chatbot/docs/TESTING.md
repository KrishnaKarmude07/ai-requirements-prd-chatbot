# Testing

## Automated (`npm test`)
Files in `test/`: `chat.test.js` (conversation flow, retry/idempotency, ownership, size cap, interview prompt), `prd.test.js` (PRD parsing/validation, generate, edit, regenerate, versions, stale edits, injection delimiters), `history.test.js` (context trimming), `llm.test.js` (Gemini adapter with a fake client: no quota used; error classification), `markdown.test.js` (safe rendering, error messages, helpers), `validation.test.js` (request validation, config), `api.test.js` (HTTP: security headers/CSP, public config, static frontend, 401 on every protected route, 413, 404).
Gemini is always mocked in tests.

**Status when this package was built:** see the "Verification report" in the delivery message. Tests that need `npm install` (`validation.test.js`, `api.test.js`) must be run by you.

## Manual end-to-end checklist (your Supabase + Gemini)
Tick each box.
**Accounts**
- [ ] Register a new user (confirm the email if required) and log in; Account page shows your email.
- [ ] Refresh the page: still logged in. Log out: Dashboard URL redirects to login.
**Projects**
- [ ] Create a project; it appears on the dashboard with status "draft".
- [ ] Rename it, change status, then delete a throw-away project (confirm dialog appears).
**Chat**
- [ ] Send a rough idea; an assistant reply with ONE question arrives.
- [ ] Answer; the next question builds on your answer (no repeated questions).
- [ ] Refresh, log out and in again: the whole conversation is restored; the sidebar lists your projects with "updated … ago".
- [ ] Open another project and back: its own history shows.
**Failure handling**
- [ ] Put a wrong name in `GEMINI_MODEL`, restart, send a message: a clear "model not found" error appears, your message is shown, and a Retry button is available. Fix the name, restart, press Retry (or send again): you get a reply and no duplicate of your message.
- [ ] Stop the server and send: "Cannot reach the server" with Retry; restart and Retry works.
**PRD**
- [ ] "View / generate PRD" → Generate: a PRD appears (can take up to a minute). Unknown details say TBD.
- [ ] Edit one section → Save: version increases; the old version is still selectable in the dropdown.
- [ ] Regenerate one section (with an instruction): only that section changes; version increases.
- [ ] Select an old version: it is read-only with a warning.
- [ ] Open the PRD in two tabs, save in tab 1, then save in tab 2 without reloading: tab 2 shows the "PRD changed" message.
- [ ] Copy Markdown works.
**Security**
- [ ] Run `supabase/tests/isolation.sql` (all PASS).
- [ ] Register a second user: their dashboard is empty; pasting user 1's project URL shows "Not found".
- [ ] In the browser developer tools (Network/Sources) search for your Gemini key: it must not appear anywhere.
