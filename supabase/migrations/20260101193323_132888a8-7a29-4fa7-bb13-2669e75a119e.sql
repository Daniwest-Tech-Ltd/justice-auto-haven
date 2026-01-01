-- 1) Enforce max 5MB per uploaded document record
alter table public.application_documents
  drop constraint if exists application_documents_file_size_max_5mb;

alter table public.application_documents
  add constraint application_documents_file_size_max_5mb
  check (file_size is null or file_size <= 5242880);


-- 2) Storage RLS: allow authenticated users to upload/view their own finance documents
-- Files will be stored as: {user_id}/{application_id}/{docType}_{timestamp}.ext

drop policy if exists "Users can upload own finance documents" on storage.objects;
create policy "Users can upload own finance documents"
on storage.objects
for insert
to public
with check (
  bucket_id = 'finance-documents'
  and auth.role() = 'authenticated'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can view own finance documents" on storage.objects;
create policy "Users can view own finance documents"
on storage.objects
for select
to public
using (
  bucket_id = 'finance-documents'
  and (
    has_role(auth.uid(), 'admin'::public.app_role)
    or auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- Optional: allow users to delete their own uploads (keeps bucket tidy)
drop policy if exists "Users can delete own finance documents" on storage.objects;
create policy "Users can delete own finance documents"
on storage.objects
for delete
to public
using (
  bucket_id = 'finance-documents'
  and auth.role() = 'authenticated'
  and auth.uid()::text = (storage.foldername(name))[1]
);
