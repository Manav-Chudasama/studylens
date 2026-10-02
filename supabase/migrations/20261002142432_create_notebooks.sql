create table public.notebooks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  description text not null default '' check (char_length(description) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notebooks_owner_updated_idx on public.notebooks (owner_id, updated_at desc);

alter table public.notebooks enable row level security;
revoke all on public.notebooks from anon, authenticated;
grant select, insert, update, delete on public.notebooks to authenticated;

create policy "Owners read notebooks" on public.notebooks
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners create notebooks" on public.notebooks
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners update notebooks" on public.notebooks
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Owners delete notebooks" on public.notebooks
  for delete to authenticated using ((select auth.uid()) = owner_id);
