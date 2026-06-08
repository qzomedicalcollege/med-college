-- FIX: Supabase API grants + safer RLS policies for the college site
-- Run this in Supabase Dashboard -> SQL Editor.

-- 1) Give API roles database privileges.
-- This is required if "Automatically expose new tables" was disabled during project creation.
grant usage on schema public to anon, authenticated;
grant select on public.site_posts to anon, authenticated;
grant insert, update, delete on public.site_posts to authenticated;
grant select on public.admin_users to authenticated;

-- 2) Replace recursive admin check with a SECURITY DEFINER helper.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 3) Rebuild policies for site_posts.
alter table public.site_posts enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Public can read site posts" on public.site_posts;
drop policy if exists "Admins can insert site posts" on public.site_posts;
drop policy if exists "Admins can update site posts" on public.site_posts;
drop policy if exists "Admins can delete site posts" on public.site_posts;

create policy "Public can read site posts"
on public.site_posts
for select
to anon, authenticated
using (true);

create policy "Admins can insert site posts"
on public.site_posts
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update site posts"
on public.site_posts
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete site posts"
on public.site_posts
for delete
to authenticated
using (public.is_admin());

-- 4) Rebuild admin_users read policy without recursion.
drop policy if exists "Admins can read admin_users" on public.admin_users;
drop policy if exists "Users can read own admin row" on public.admin_users;

create policy "Users can read own admin row"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

-- 5) Make sure your current admin user is registered as admin.
-- Replace the email if you use another admin account.
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('qzomedcollad@gmail.com')
on conflict (user_id) do nothing;

-- 6) Optional verification.
-- You should see your admin user_id here.
select au.user_id, u.email
from public.admin_users au
join auth.users u on u.id = au.user_id;
