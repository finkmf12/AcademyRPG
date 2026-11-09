-- Execute em Supabase > SQL Editor > New query > Run.
create table if not exists public.study_files (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 subject text not null check (subject in ('programacao','banco','modelagem')),
 file_name text not null, object_path text not null unique, size bigint not null default 0,
 mime_type text, created_at timestamptz not null default now()
);
alter table public.study_files enable row level security;
drop policy if exists "Read own study file metadata" on public.study_files;
create policy "Read own study file metadata" on public.study_files for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists "Insert own study file metadata" on public.study_files;
create policy "Insert own study file metadata" on public.study_files for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists "Delete own study file metadata" on public.study_files;
create policy "Delete own study file metadata" on public.study_files for delete to authenticated using (owner_id = (select auth.uid()));
insert into storage.buckets (id,name,public,file_size_limit) values ('study-files','study-files',false,52428800) on conflict (id) do update set public=false,file_size_limit=52428800;
drop policy if exists "Upload own study files" on storage.objects;
create policy "Upload own study files" on storage.objects for insert to authenticated with check (bucket_id='study-files' and (storage.foldername(name))[1]=(select auth.uid()::text));
drop policy if exists "Read own study files" on storage.objects;
create policy "Read own study files" on storage.objects for select to authenticated using (bucket_id='study-files' and (storage.foldername(name))[1]=(select auth.uid()::text));
drop policy if exists "Delete own study files" on storage.objects;
create policy "Delete own study files" on storage.objects for delete to authenticated using (bucket_id='study-files' and (storage.foldername(name))[1]=(select auth.uid()::text));
