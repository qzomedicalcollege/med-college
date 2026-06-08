-- 1) Таблица записей сайта
create table if not exists public.site_posts (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('news', 'about', 'students')),
  title text not null,
  body text not null,
  image_url text,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_posts_section_created_at_idx
on public.site_posts (section, created_at desc);

-- 2) Таблица администраторов. Сюда добавляется user_id из Supabase Auth.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.site_posts enable row level security;
alter table public.admin_users enable row level security;



-- Extra API grants. Required when “Automatically expose new tables” is disabled.
grant usage on schema public to anon, authenticated;
grant select on public.site_posts to anon, authenticated;
grant insert, update, delete on public.site_posts to authenticated;
grant select on public.admin_users to authenticated;

-- Non-recursive admin checker for RLS policies.
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

-- 3) Политики для публичного чтения и админской записи
create policy "Public can read site posts"
on public.site_posts for select
to anon, authenticated
using (true);

create policy "Admins can insert site posts"
on public.site_posts for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update site posts"
on public.site_posts for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete site posts"
on public.site_posts for delete
to authenticated
using (public.is_admin());

create policy "Users can read own admin row"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

-- 4) После создания пользователя в Authentication вставьте его в admin_users.
-- Замените email на свой email администратора и выполните отдельно:
-- insert into public.admin_users (user_id)
-- select id from auth.users where email = 'admin@example.com'
-- on conflict (user_id) do nothing;
