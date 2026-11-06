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
