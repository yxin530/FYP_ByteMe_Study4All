create table if not exists public.audio_transcripts (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  request_text text not null,
  transcript text not null,
  transcript_status text not null default 'draft' check (transcript_status in ('draft', 'approved')),
  material_ids jsonb not null default '[]'::jsonb,
  material_version_hashes jsonb not null default '[]'::jsonb,
  source_references jsonb not null default '[]'::jsonb,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.audio_transcripts enable row level security;
create policy "audio transcript owner" on public.audio_transcripts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists audio_transcripts_user_updated_idx on public.audio_transcripts(user_id, updated_at desc);

create table if not exists public.audio_generations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  transcript_id uuid not null references public.audio_transcripts(id) on delete cascade,
  request_text text not null,
  transcript text not null,
  material_ids jsonb not null default '[]'::jsonb,
  material_version_hashes jsonb not null default '[]'::jsonb,
  voice_id text not null,
  language text not null,
  cache_key text not null,
  audio_status text not null default 'pending' check (audio_status in ('pending', 'completed', 'failed')),
  storage_path text,
  playback_url text,
  duration_seconds numeric,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, cache_key)
);

alter table public.audio_generations enable row level security;
create policy "audio generation owner" on public.audio_generations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists audio_generations_user_updated_idx on public.audio_generations(user_id, updated_at desc);

insert into storage.buckets (id, name, public)
values ('audio-generations', 'audio-generations', false)
on conflict (id) do nothing;

drop policy if exists "Users can upload their own generated audio" on storage.objects;
create policy "Users can upload their own generated audio" on storage.objects for insert to authenticated
with check (bucket_id = 'audio-generations' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can read their own generated audio" on storage.objects;
create policy "Users can read their own generated audio" on storage.objects for select to authenticated
using (bucket_id = 'audio-generations' and (storage.foldername(name))[1] = auth.uid()::text);
