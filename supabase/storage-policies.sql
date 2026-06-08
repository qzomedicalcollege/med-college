-- Перед выполнением создайте public bucket с именем college-files:
-- Dashboard → Storage → New bucket → Name: college-files → Public bucket: ON

-- Публичное чтение файлов из bucket college-files
create policy "Public can read college files"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'college-files');

-- Только админы могут загружать файлы
create policy "Admins can upload college files"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'college-files'
  and exists (select 1 from public.admin_users where user_id = auth.uid())
);

-- Только админы могут обновлять файлы
create policy "Admins can update college files"
on storage.objects for update
to authenticated
using (
  bucket_id = 'college-files'
  and exists (select 1 from public.admin_users where user_id = auth.uid())
)
with check (
  bucket_id = 'college-files'
  and exists (select 1 from public.admin_users where user_id = auth.uid())
);

-- Только админы могут удалять файлы
create policy "Admins can delete college files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'college-files'
  and exists (select 1 from public.admin_users where user_id = auth.uid())
);
