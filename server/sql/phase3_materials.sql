-- Phase 3: material metadata and user-scoped storage.
-- Run this in the Supabase SQL Editor after the Phase 2 profile query.

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text,
  title text not null,
  material_type text not null check (material_type in ('pdf', 'image', 'text', 'document')),
  processing_status text not null default 'pending'
    check (processing_status in ('pending', 'processing', 'ready', 'failed')),
  version_hash text,
  storage_path text,
  extracted_text text,
  processing_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists materials_user_id_idx on public.materials(user_id);
create index if not exists materials_status_idx on public.materials(processing_status);

alter table public.materials enable row level security;

drop policy if exists "Users can view their own materials" on public.materials;
create policy "Users can view their own materials"
on public.materials for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own materials" on public.materials;
create policy "Users can create their own materials"
on public.materials for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own materials" on public.materials;
create policy "Users can update their own materials"
on public.materials for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own materials" on public.materials;
create policy "Users can delete their own materials"
on public.materials for delete to authenticated
using (auth.uid() = user_id);

drop trigger if exists materials_updated_at on public.materials;
create trigger materials_updated_at
before update on public.materials
for each row execute procedure public.update_updated_at();

insert into storage.buckets (id, name, public)
values ('learning-materials', 'learning-materials', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload their own learning materials" on storage.objects;
create policy "Users can upload their own learning materials"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'learning-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can read their own learning materials" on storage.objects;
create policy "Users can read their own learning materials"
on storage.objects for select to authenticated
using (
  bucket_id = 'learning-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own learning materials" on storage.objects;
create policy "Users can delete their own learning materials"
on storage.objects for delete to authenticated
using (
  bucket_id = 'learning-materials'
  and (storage.foldername(name))[1] = auth.uid()::text
);
