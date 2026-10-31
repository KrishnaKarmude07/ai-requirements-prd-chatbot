-- Run in Supabase Dashboard > SQL Editor. Read-only checks for the existing schema (migration 001_init.sql).
-- 1) Tables exist -> expect 3 rows: messages, prd_documents, projects
select table_name from information_schema.tables where table_schema='public' and table_name in ('projects','messages','prd_documents') order by 1;
-- 2) RLS enabled -> expect rowsecurity = true on all three
select tablename, rowsecurity from pg_tables where schemaname='public' and tablename in ('projects','messages','prd_documents') order by 1;
-- 3) Policies -> expect: messages_insert, messages_select, prd_insert, prd_select, projects_delete, projects_insert, projects_select, projects_update
select tablename, policyname, cmd from pg_policies where schemaname='public' order by 1,2;
-- 4) Versioning function -> expect 1 row: create_prd_version
select proname from pg_proc where proname='create_prd_version';
-- 5) Idempotency index -> expect messages_idempotency_idx
select indexname from pg_indexes where schemaname='public' and indexname='messages_idempotency_idx';
