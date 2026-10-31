-- Stage 1 schema: projects, messages, prd_documents + RLS

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  status      text not null default 'draft'
              check (status in ('draft','in_progress','review','completed','archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index projects_user_updated_idx on public.projects (user_id, updated_at desc);
create trigger projects_updated before update on public.projects
  for each row execute function public.set_updated_at();

create table public.messages (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  role              text not null check (role in ('user','assistant','system')),
  content           text not null check (char_length(content) between 1 and 20000),
  client_request_id uuid,  -- idempotency key for retries
  created_at        timestamptz not null default now()
);
create index messages_project_created_idx on public.messages (project_id, created_at, id);
-- A retry with the same request id cannot create a second user (or assistant) message
create unique index messages_idempotency_idx
  on public.messages (project_id, client_request_id, role) where client_request_id is not null;

create table public.prd_documents (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  version     integer not null check (version > 0),
  title       text not null check (char_length(title) between 1 and 200),
  content     jsonb not null,
  created_at  timestamptz not null default now(),
  unique (project_id, version)
);
create index prd_documents_project_idx on public.prd_documents (project_id, version desc);

-- Row Level Security
alter table public.projects      enable row level security;
alter table public.messages      enable row level security;
alter table public.prd_documents enable row level security;

create policy projects_select on public.projects for select using (user_id = auth.uid());
create policy projects_insert on public.projects for insert with check (user_id = auth.uid());
create policy projects_update on public.projects for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy projects_delete on public.projects for delete using (user_id = auth.uid());

create policy messages_select on public.messages for select using (user_id = auth.uid());
create policy messages_insert on public.messages for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
-- messages are immutable: no update/delete policies (deleted via project cascade only)

create policy prd_select on public.prd_documents for select using (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
create policy prd_insert on public.prd_documents for insert with check (
  exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

-- Atomic, race-free PRD versioning (SECURITY INVOKER: RLS still applies)
create or replace function public.create_prd_version(p_project_id uuid, p_title text, p_content jsonb)
returns public.prd_documents
language plpgsql security invoker as $$
declare next_v integer; doc public.prd_documents;
begin
  perform 1 from public.projects where id = p_project_id and user_id = auth.uid() for update;
  if not found then raise exception 'project not found' using errcode = 'P0002'; end if;
  select coalesce(max(version), 0) + 1 into next_v from public.prd_documents where project_id = p_project_id;
  insert into public.prd_documents (project_id, version, title, content)
    values (p_project_id, next_v, p_title, p_content) returning * into doc;
  return doc;
end $$;
revoke execute on function public.create_prd_version(uuid, text, jsonb) from public, anon;
grant  execute on function public.create_prd_version(uuid, text, jsonb) to authenticated;
