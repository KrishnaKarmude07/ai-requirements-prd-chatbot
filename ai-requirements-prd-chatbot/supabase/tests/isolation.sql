-- Data-isolation test. Replace USER_A_UUID and USER_B_UUID (each appears several times) with two real user ids from
-- Authentication > Users (user ids are not secrets). Runs inside a transaction that is ROLLED BACK: nothing is kept.
-- Read the NOTICE lines in the results/messages panel: every line must start with PASS.
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', '{"sub":"USER_A_UUID","role":"authenticated"}', true);
  insert into public.projects (id, user_id, name) values ('11111111-1111-4111-8111-111111111111', 'USER_A_UUID', 'isolation-test');
  do $$ declare n int; begin
    select count(*) into n from public.projects where id='11111111-1111-4111-8111-111111111111';
    raise notice '% A sees own project (%)', case when n=1 then 'PASS' else 'FAIL' end, n;
  end $$;

  select set_config('request.jwt.claims', '{"sub":"USER_B_UUID","role":"authenticated"}', true);
  do $$ declare n int; begin
    select count(*) into n from public.projects where id='11111111-1111-4111-8111-111111111111';
    raise notice '% B cannot see A''s project (%)', case when n=0 then 'PASS' else 'FAIL' end, n;
  end $$;
  do $$ begin
    begin
      insert into public.messages (project_id, user_id, role, content) values ('11111111-1111-4111-8111-111111111111','USER_B_UUID','user','intrusion');
      raise notice 'FAIL B inserted a message into A''s project';
    exception when insufficient_privilege then raise notice 'PASS B cannot insert messages into A''s project (RLS)';
    end;
  end $$;
  do $$ declare n int; begin
    update public.projects set name='hacked' where id='11111111-1111-4111-8111-111111111111';
    get diagnostics n = row_count;
    raise notice '% B cannot update A''s project (% rows)', case when n=0 then 'PASS' else 'FAIL' end, n;
  end $$;
rollback;
