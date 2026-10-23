begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.admins(user_id uuid primary key references auth.users(id) on delete cascade);
create table private.admin_audit(id bigint generated always as identity primary key, actor uuid, action text not null, target uuid, created_at timestamptz not null default now());
alter table private.admins enable row level security;
alter table private.admin_audit enable row level security;
create table public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null default '' check(length(name)<=100),
 nickname text not null default '' check(length(nickname)<=50),
 email text not null, created_at timestamptz not null default now(),
 suspended boolean not null default false
);
create table public.user_progress(
 user_id uuid not null references public.profiles(id) on delete cascade,
 key text not null check(length(key) between 1 and 180),
 value jsonb not null check(octet_length(value::text)<=262144),
 revision bigint not null default 1, updated_at timestamptz not null default now(),
 primary key(user_id,key)
);
create table public.user_achievements(
 user_id uuid not null references public.profiles(id) on delete cascade,
 achievement_id text not null, earned_at timestamptz not null default now(),
 primary key(user_id,achievement_id)
);
create function public.account_active() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users u join public.profiles p on p.id=u.id where u.id=auth.uid() and u.email_confirmed_at is not null and not p.suspended)
$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select public.account_active() and exists(select 1 from private.admins where user_id=auth.uid())
$$;
create function private.sync_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,email,name,nickname,created_at) values(new.id,new.email,left(coalesce(new.raw_user_meta_data->>'name',''),100),left(coalesce(new.raw_user_meta_data->>'nickname',''),50),new.created_at)
 on conflict(id) do update set email=excluded.email;
 return new;
end $$;
create trigger account_profile after insert or update of email on auth.users for each row execute function private.sync_profile();
insert into public.profiles(id,email,name,nickname,created_at) select id,email,left(coalesce(raw_user_meta_data->>'name',''),100),left(coalesce(raw_user_meta_data->>'nickname',''),50),created_at from auth.users;
alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;
alter table public.user_achievements enable row level security;
revoke all on public.profiles,public.user_progress,public.user_achievements from anon,authenticated;
grant select on public.profiles,public.user_progress,public.user_achievements to authenticated;
grant update(name,nickname) on public.profiles to authenticated;
create policy own_profile on public.profiles for select to authenticated using(id=auth.uid());
create policy edit_own_profile on public.profiles for update to authenticated using(id=auth.uid() and public.account_active()) with check(id=auth.uid() and public.account_active());
create policy own_progress on public.user_progress for select to authenticated using(user_id=auth.uid() and public.account_active());
create policy own_achievements on public.user_achievements for select to authenticated using(user_id=auth.uid() and public.account_active());
-- No client INSERT/UPDATE grant on progress: checked RPC is the only write path.
create function public.save_progress(p_key text,p_value jsonb,p_revision bigint) returns bigint language plpgsql security definer set search_path='' as $$
declare v bigint;
begin
 if not public.account_active() then raise exception 'Account unavailable' using errcode='42501'; end if;
 if p_key !~ '^(adebiet-|asyk-|shyrak-)' or length(p_key)>180 or p_key ~ '(password|token|secret|adebiet-user)' or octet_length(p_value::text)>262144 then raise exception 'Invalid progress'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if p_revision=0 then
   if (select count(*) from public.user_progress where user_id=auth.uid())>=512 then raise exception 'Progress quota exceeded'; end if;
   insert into public.user_progress(user_id,key,value) values(auth.uid(),p_key,p_value) on conflict do nothing returning revision into v;
 else
   update public.user_progress set value=p_value,revision=revision+1,updated_at=now() where user_id=auth.uid() and key=p_key and revision=p_revision returning revision into v;
 end if;
 if v is null then raise exception 'Progress conflict: reload before saving' using errcode='40001'; end if;
 return v;
end $$;
-- Achievements are derived from saved educational activity, not a monetary/competitive score.
create function private.derive_achievements() returns trigger language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if jsonb_typeof(new.value) <> 'array' then return new; end if;
 n:=jsonb_array_length(new.value);
 if new.key='adebiet-completed-works' then
  if n>=1 then insert into public.user_achievements values(new.user_id,'first-work',now()) on conflict do nothing; end if;
  if n>=3 then insert into public.user_achievements values(new.user_id,'three-works',now()) on conflict do nothing; end if;
 elsif new.key='adebiet-game-results' then
  if n>=1 then insert into public.user_achievements values(new.user_id,'first-game',now()) on conflict do nothing; end if;
  if exists(select 1 from jsonb_array_elements(new.value) x where jsonb_typeof(x->'percent')='number' and (x->>'percent')::numeric>=80) then insert into public.user_achievements values(new.user_id,'high-score',now()) on conflict do nothing; end if;
 elsif new.key='adebiet-visited-regions' then
  if n>=5 then insert into public.user_achievements values(new.user_id,'five-regions',now()) on conflict do nothing; end if;
  if n>=20 then insert into public.user_achievements values(new.user_id,'twenty-regions',now()) on conflict do nothing; end if;
 end if;
 return new;
end $$;
create trigger progress_achievements after insert or update on public.user_progress for each row execute function private.derive_achievements();
create function public.admin_accounts(p_search text default '',p_ascending boolean default false,p_offset integer default 0,p_limit integer default 50)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 select jsonb_build_object('total',(select count(*) from public.profiles),'filtered',(select count(*) from public.profiles where name ilike '%'||left(p_search,100)||'%' or email ilike '%'||left(p_search,100)||'%'),'rows',coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb)) into result from
 (select id,name,nickname,email,created_at,suspended from public.profiles where name ilike '%'||left(p_search,100)||'%' or email ilike '%'||left(p_search,100)||'%'
 order by case when p_ascending then created_at end asc,case when not p_ascending then created_at end desc,id limit least(greatest(p_limit,1),1000) offset greatest(p_offset,0)) t;
 return result;
end $$;
create function public.admin_progress(p_user uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 return jsonb_build_object('progress',coalesce((select jsonb_agg(to_jsonb(t)) from public.user_progress t where user_id=p_user),'[]'::jsonb),'achievements',coalesce((select jsonb_agg(to_jsonb(t)) from public.user_achievements t where user_id=p_user),'[]'::jsonb));
end $$;
create function public.admin_statistics() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 return jsonb_build_object(
  'active_learners',(select count(distinct user_id) from public.user_progress),
  'completed_works',(select coalesce(sum(jsonb_array_length(value)),0) from public.user_progress where key='adebiet-completed-works' and jsonb_typeof(value)='array'),
  'game_results',(select coalesce(sum(jsonb_array_length(value)),0) from public.user_progress where key='adebiet-game-results' and jsonb_typeof(value)='array'),
  'achievements',(select count(*) from public.user_achievements));
end $$;
create function public.admin_suspend(p_user uuid,p_suspended boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() or p_user=auth.uid() then raise exception 'Operation denied' using errcode='42501'; end if;
 update public.profiles set suspended=p_suspended where id=p_user;
 if not found then raise exception 'User not found'; end if;
 insert into private.admin_audit(actor,action,target) values(auth.uid(),case when p_suspended then 'suspend' else 'restore' end,p_user);
end $$;
create function public.admin_export(p_search text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 if not public.is_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 result:=public.admin_accounts(p_search,false,0,1000);
 insert into private.admin_audit(actor,action) values(auth.uid(),'export <=1000 profiles');
 return result;
end $$;
revoke all on all functions in schema private from public,anon,authenticated;
revoke all on function public.admin_statistics() from public,anon,authenticated;
grant execute on function public.admin_statistics() to authenticated;
revoke all on function public.account_active(),public.is_admin(),public.save_progress(text,jsonb,bigint),public.admin_accounts(text,boolean,integer,integer),public.admin_progress(uuid),public.admin_suspend(uuid,boolean),public.admin_export(text) from public,anon,authenticated;
grant execute on function public.account_active(),public.is_admin(),public.save_progress(text,jsonb,bigint),public.admin_accounts(text,boolean,integer,integer),public.admin_progress(uuid),public.admin_suspend(uuid,boolean),public.admin_export(text) to authenticated;
commit;
