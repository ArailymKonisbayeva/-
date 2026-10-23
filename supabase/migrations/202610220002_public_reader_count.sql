begin;
-- The sole public aggregate: no identifiers, profiles or email addresses.
-- Includes all Auth registrations, including unconfirmed/suspended accounts.
create or replace function public.public_reader_count()
returns bigint language sql stable security definer set search_path=''
as $$ select count(*) from auth.users $$;
revoke all on function public.public_reader_count() from public,anon,authenticated;
grant execute on function public.public_reader_count() to anon,authenticated;
commit;
