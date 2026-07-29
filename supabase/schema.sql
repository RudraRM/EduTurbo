-- ─────────────────────────────────────────────────────────────────────────────
-- Lumen — database schema
-- Run this once in your Supabase project's SQL editor.
-- Sets up tables, row-level security, and the private storage bucket.
-- ─────────────────────────────────────────────────────────────────────────────

-- Folders ---------------------------------------------------------------------
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default 'violet',
  created_at timestamptz not null default now()
);

alter table public.folders enable row level security;

create policy "Folders are owner-only"
  on public.folders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists folders_user_idx on public.folders (user_id);

-- Documents -------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  folder_id uuid references public.folders (id) on delete set null,
  title text not null,
  source_type text not null check (
    source_type in ('pdf', 'docx', 'pptx', 'txt', 'image', 'audio', 'video', 'youtube')
  ),
  source_url text,
  file_path text,
  file_size bigint,
  status text not null default 'processing' check (status in ('processing', 'ready', 'error')),
  error_message text,
  extracted_text text,
  favorite boolean not null default false,
  tags text[] not null default '{}',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_opened_at timestamptz
);

alter table public.documents enable row level security;

create policy "Documents are owner-only"
  on public.documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public documents are readable by anyone"
  on public.documents for select
  using (is_public = true);

create index if not exists documents_user_idx on public.documents (user_id, updated_at desc);
create index if not exists documents_folder_idx on public.documents (folder_id);

-- Notes -----------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.documents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content_html text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "Notes are owner-writable"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Notes of public documents are readable by anyone"
  on public.notes for select
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.is_public = true
    )
  );

-- Chat messages ---------------------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "Chat messages are owner-only"
  on public.chat_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists chat_document_idx on public.chat_messages (document_id, created_at);

-- Flashcards ------------------------------------------------------------------
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  front text not null,
  back text not null,
  position integer not null default 0
);

alter table public.flashcards enable row level security;

create policy "Flashcards are owner-only"
  on public.flashcards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists flashcards_document_idx on public.flashcards (document_id, position);

-- Quizzes ---------------------------------------------------------------------
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('mcq', 'true_false', 'fill_blank', 'short_answer')),
  title text not null,
  questions jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.quizzes enable row level security;

create policy "Quizzes are owner-only"
  on public.quizzes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists quizzes_document_idx on public.quizzes (document_id, created_at desc);

-- Collections -----------------------------------------------------------------
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

alter table public.collections enable row level security;

create policy "Collections are owner-only"
  on public.collections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.collection_items (
  collection_id uuid not null references public.collections (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (collection_id, document_id)
);

alter table public.collection_items enable row level security;

create policy "Collection items follow their collection"
  on public.collection_items for all
  using (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.collections c
      where c.id = collection_id and c.user_id = auth.uid()
    )
  );

-- Storage ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "Users can upload to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read their own files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
