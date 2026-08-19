-- The admin policies call private.is_admin() while running as the invoking
-- role, so `authenticated` must be able to execute it. Migration 0001 revoked
-- that grant, which made every admin read and write fail with
-- "permission denied for function is_admin".
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- anon must still never reach it.
revoke all on schema private from anon;
revoke execute on function private.is_admin() from anon, public;

-- A callable wrapper so the admin shell can ask "am I an admin?" outright.
-- Probing for drafts cannot answer that: RLS hides them from a signed-in
-- non-admin without raising an error, so an empty result is ambiguous and a
-- non-admin would walk straight into the admin shell.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
