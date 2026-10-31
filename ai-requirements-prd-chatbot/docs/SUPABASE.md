# Supabase configuration

## 1. Schema: what to apply
`supabase/migrations/001_init.sql` creates `projects`, `messages`, `prd_documents`, indexes, `updated_at` triggers, RLS policies, and the `create_prd_version()` function. **Status: unchanged from the version you already ran** - no schema or policy changes were needed to integrate the three stages, so if the first migration already succeeded you do **not** run anything again (re-running it would fail on "already exists", which is harmless).
Fresh project? Dashboard → **SQL Editor → New query** → paste the whole file → **Run**. Expected: "Success. No rows returned".

## 2. Verify (SQL Editor)
Run `supabase/tests/verify_schema.sql`. Expected: 3 tables; `rowsecurity = true` ×3; 8 policies (`projects_*` ×4, `messages_select/insert`, `prd_select/insert`); function `create_prd_version`; index `messages_idempotency_idx`.

## 3. Authentication settings
Dashboard → **Authentication**:
- **Providers → Email**: enabled.
- **Sign In / Providers → Confirm email**: for quick local testing you may turn it off. If it stays on, new users must click the emailed link before logging in (built-in email sending is rate-limited by Supabase; check their current limits).
- **URL Configuration**: Site URL `http://localhost:3000`; add `http://localhost:3000` to Redirect URLs. (If you change `PORT`, use that port.)

## 4. Keys (Project Settings → API)
- `SUPABASE_URL` → project URL.
- `SUPABASE_ANON_KEY` → the **anon / publishable** key. This is the only key used. It is sent to the browser by design.
- Do **not** use the `service_role` / secret key anywhere in this project.

## 5. Test data isolation
Create two users (Authentication → Users → Add user, tick auto-confirm, or register in the app). Copy their User UIDs. Paste them over `USER_A_UUID` / `USER_B_UUID` in `supabase/tests/isolation.sql`, run it. Expected: four NOTICE lines, each starting with `PASS`. The script rolls back, so no data remains. Also repeat the check in the UI (docs/TESTING.md).
