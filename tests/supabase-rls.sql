-- Run in staging SQL Editor AFTER migration. Entire fixture is rolled back.
-- Does not exercise GoTrue email/password flows; complements supabase-live.cjs.
begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data,created_at) values
 ('f0f0f0f0-0000-4000-8000-000000000001','rls-a@example.test',now(),'{}',now()),
 ('f0f0f0f0-0000-4000-8000-000000000002','rls-b@example.test',now(),'{}',now()),
 ('f0f0f0f0-0000-4000-8000-000000000003','rls-admin@example.test',now(),'{}',now());
insert into private.admins values('f0f0f0f0-0000-4000-8000-000000000003');
set local role authenticated;
select set_config('request.jwt.claim.sub','f0f0f0f0-0000-4000-8000-000000000001',true);
select public.save_progress('adebiet-xp','30'::jsonb,0);
do $$ begin
 if public.is_admin() then raise exception 'FAIL: user became admin'; end if;
 if exists(select 1 from public.profiles where id='f0f0f0f0-0000-4000-8000-000000000002') then raise exception 'FAIL: other profile visible'; end if;
 begin perform public.admin_accounts(); raise exception 'FAIL: admin list allowed'; exception when insufficient_privilege then null; end;
 begin perform public.admin_export(); raise exception 'FAIL: export allowed'; exception when insufficient_privilege then null; end;
 begin update public.profiles set suspended=false; raise exception 'FAIL: protected column writable'; exception when insufficient_privilege then null; end;
 begin insert into public.user_achievements values(auth.uid(),'fake',now()); raise exception 'FAIL: badge writable'; exception when insufficient_privilege then null; end;
 begin perform public.save_progress('adebiet-xp','40'::jsonb,0); raise exception 'FAIL: stale revision accepted'; exception when serialization_failure then null; end;
end $$;
select set_config('request.jwt.claim.sub','f0f0f0f0-0000-4000-8000-000000000002',true);
do $$ begin
 if exists(select 1 from public.user_progress where user_id='f0f0f0f0-0000-4000-8000-000000000001') then raise exception 'FAIL: other progress visible'; end if;
 begin insert into public.user_progress(user_id,key,value) values('f0f0f0f0-0000-4000-8000-000000000001','adebiet-xp','999'); raise exception 'FAIL: cross-user insert'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','f0f0f0f0-0000-4000-8000-000000000003',true);
select public.admin_accounts();
select public.admin_statistics();
select public.admin_suspend('f0f0f0f0-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claim.sub','f0f0f0f0-0000-4000-8000-000000000001',true);
do $$ begin
 if exists(select 1 from public.user_progress) then raise exception 'FAIL: suspended user reads progress'; end if;
 begin perform public.save_progress('adebiet-xp','40',1); raise exception 'FAIL: suspended user writes'; exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
-- Successful completion without a FAIL exception means fixture assertions passed.
