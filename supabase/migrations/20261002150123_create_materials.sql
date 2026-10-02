alter table public.notebooks add constraint notebooks_id_owner_unique unique (id, owner_id);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid not null,
  owner_id uuid not null,
  kind text not null check (kind in ('pdf', 'txt', 'md', 'note')),
  title text not null check (char_length(title) between 1 and 200),
  original_filename text,
  storage_path text,
  mime_type text,
  byte_size integer,
  content_text text,
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  constraint materials_notebook_owner_fk foreign key (notebook_id, owner_id)
    references public.notebooks (id, owner_id) on delete cascade,
  constraint materials_content_shape check (
    (kind = 'note' and content_text is not null and storage_path is null and original_filename is null)
    or (kind <> 'note' and content_text is null and storage_path is not null and original_filename is not null
      and byte_size between 1 and 20971520)
  )
);

create index materials_notebook_created_idx on public.materials (notebook_id, created_at desc);
alter table public.materials enable row level security;
revoke all on public.materials from anon, authenticated;
grant select, insert, update, delete on public.materials to authenticated;

create policy "Owners read materials" on public.materials
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners create materials" on public.materials
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners update materials" on public.materials
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Owners delete materials" on public.materials
  for delete to authenticated using ((select auth.uid()) = owner_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('study-materials', 'study-materials', false, 20971520,
  array['application/pdf', 'text/plain', 'text/markdown']);

create policy "Users upload own study materials" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'study-materials' and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.materials m
      where m.storage_path = name and m.owner_id = (select auth.uid()) and m.status = 'processing'
    )
  );
create policy "Users read own study materials" on storage.objects
  for select to authenticated using (
    bucket_id = 'study-materials' and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (select 1 from public.materials m where m.storage_path = name and m.owner_id = (select auth.uid()))
  );
create policy "Users delete own study materials" on storage.objects
  for delete to authenticated using (
    bucket_id = 'study-materials' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
