create extension if not exists vector with schema extensions;

alter table public.materials
  add column index_status text not null default 'pending'
    check (index_status in ('pending', 'indexing', 'ready', 'failed', 'unsupported')),
  add column index_error text,
  add column indexed_at timestamptz;

alter table public.materials add constraint materials_identity_owner_unique unique (id, notebook_id, owner_id);

create table public.material_chunks (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null,
  notebook_id uuid not null,
  owner_id uuid not null,
  chunk_index integer not null check (chunk_index >= 0),
  page_number integer check (page_number > 0),
  content text not null check (char_length(content) between 1 and 4000),
  embedding extensions.vector(1536) not null,
  created_at timestamptz not null default now(),
  unique (material_id, chunk_index),
  foreign key (material_id, notebook_id, owner_id)
    references public.materials (id, notebook_id, owner_id) on delete cascade
);

create index material_chunks_notebook_idx on public.material_chunks (notebook_id, material_id);
create index material_chunks_embedding_idx on public.material_chunks
  using hnsw (embedding vector_cosine_ops);

alter table public.material_chunks enable row level security;
revoke all on public.material_chunks from anon, authenticated;
grant select, insert, update, delete on public.material_chunks to authenticated;
create policy "Owners read chunks" on public.material_chunks
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners create chunks" on public.material_chunks
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners update chunks" on public.material_chunks
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Owners delete chunks" on public.material_chunks
  for delete to authenticated using ((select auth.uid()) = owner_id);

create function public.search_material_chunks(
  p_notebook_id uuid,
  p_query_embedding extensions.vector(1536),
  p_limit integer default 8
)
returns table (
  chunk_id uuid,
  material_id uuid,
  material_title text,
  page_number integer,
  content text,
  similarity double precision
)
language sql stable security invoker set search_path = '' as $$
  select c.id, c.material_id, m.title, c.page_number, c.content,
    (1 - (c.embedding operator(extensions.<=>) p_query_embedding))::double precision
  from public.material_chunks c
  join public.materials m on m.id = c.material_id
  where c.notebook_id = p_notebook_id
    and c.owner_id = (select auth.uid())
    and m.index_status = 'ready' and m.status = 'ready'
  order by c.embedding operator(extensions.<=>) p_query_embedding
  limit least(greatest(p_limit, 1), 12);
$$;
revoke all on function public.search_material_chunks(uuid, extensions.vector, integer) from public, anon;
grant execute on function public.search_material_chunks(uuid, extensions.vector, integer) to authenticated;

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid not null,
  owner_id uuid not null,
  title text not null check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, notebook_id, owner_id),
  foreign key (notebook_id, owner_id)
    references public.notebooks (id, owner_id) on delete cascade
);
create index conversations_notebook_updated_idx on public.conversations (notebook_id, updated_at desc);
alter table public.conversations enable row level security;
revoke all on public.conversations from anon, authenticated;
grant select, insert, update, delete on public.conversations to authenticated;
create policy "Owners read conversations" on public.conversations
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners create conversations" on public.conversations
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners update conversations" on public.conversations
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Owners delete conversations" on public.conversations
  for delete to authenticated using ((select auth.uid()) = owner_id);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  notebook_id uuid not null,
  owner_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 20000),
  citations jsonb not null default '[]'::jsonb check (jsonb_typeof(citations) = 'array'),
  created_at timestamptz not null default now(),
  foreign key (conversation_id, notebook_id, owner_id)
    references public.conversations (id, notebook_id, owner_id) on delete cascade
);
create index chat_messages_conversation_created_idx on public.chat_messages (conversation_id, created_at);
alter table public.chat_messages enable row level security;
revoke all on public.chat_messages from anon, authenticated;
grant select, insert, update, delete on public.chat_messages to authenticated;
create policy "Owners read messages" on public.chat_messages
  for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners create messages" on public.chat_messages
  for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners update messages" on public.chat_messages
  for update to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Owners delete messages" on public.chat_messages
  for delete to authenticated using ((select auth.uid()) = owner_id);
