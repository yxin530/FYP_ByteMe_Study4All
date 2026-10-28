create table if not exists public.learning_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  strengths jsonb not null default '[]'::jsonb,
  weak_topics jsonb not null default '[]'::jsonb,
  progress jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  evidence_references jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.learning_profiles enable row level security;
create policy "learning profile owner" on public.learning_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
