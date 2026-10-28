create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  topic text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  question_count integer not null check (question_count between 1 and 20),
  material_ids jsonb not null default '[]'::jsonb,
  material_version_hashes jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'submitted')),
  score integer,
  total integer,
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quiz_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_text text not null,
  options jsonb not null,
  correct_answer text not null,
  explanation text,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  material_id text not null,
  material_version_hash text not null,
  source_references jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quiz_sessions(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  answer text not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  unique (quiz_id, question_id)
);

alter table public.quiz_sessions enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_answers enable row level security;

create policy "quiz sessions owner" on public.quiz_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quiz questions owner" on public.quiz_questions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quiz answers owner" on public.quiz_answers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
