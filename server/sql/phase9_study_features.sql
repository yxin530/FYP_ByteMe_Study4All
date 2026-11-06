-- Phase 9: consent-aware matching, study groups, rescue plans, and quests.
create table if not exists public.study_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  learning_subjects jsonb not null default '[]'::jsonb,
  teaching_subjects jsonb not null default '[]'::jsonb,
  availability jsonb not null default '[]'::jsonb,
  discoverable boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(), name text not null,
  subject text not null, created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.study_group_members (
  group_id uuid references public.study_groups(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(), primary key (group_id, user_id)
);
create table if not exists public.study_group_messages (
  id uuid primary key default gen_random_uuid(), group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create table if not exists public.study_group_materials (
  group_id uuid references public.study_groups(id) on delete cascade,
  material_id uuid references public.materials(id) on delete cascade,
  shared_by uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (group_id, material_id)
);
create table if not exists public.study_matches (
  id uuid primary key default gen_random_uuid(), requester_id uuid not null references auth.users(id) on delete cascade,
  candidate_id uuid not null references auth.users(id) on delete cascade, subject text not null,
  status text not null default 'pending' check (status in ('pending','accepted','declined')), created_at timestamptz not null default now(),
  unique(requester_id, candidate_id, subject)
);
create table if not exists public.study_rescue_plans (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  exam_date date not null, subjects jsonb not null, available_minutes integer not null, assumptions jsonb not null default '[]'::jsonb,
  plan jsonb not null, evidence_references jsonb not null default '[]'::jsonb, created_at timestamptz not null default now()
);
create table if not exists public.learning_quests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null, title text not null, description text not null, material_ids jsonb not null default '[]'::jsonb,
  evidence_references jsonb not null default '[]'::jsonb, status text not null default 'available' check (status in ('available','completed')), created_at timestamptz not null default now()
);

alter table public.study_profiles enable row level security; alter table public.study_groups enable row level security; alter table public.study_group_members enable row level security; alter table public.study_group_messages enable row level security; alter table public.study_group_materials enable row level security; alter table public.study_matches enable row level security; alter table public.study_rescue_plans enable row level security; alter table public.learning_quests enable row level security;
create policy "study profile owner or discoverable" on public.study_profiles for select using (auth.uid() = user_id or discoverable = true); create policy "study profile owner write" on public.study_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "group members access" on public.study_groups for select using (exists (select 1 from public.study_group_members m where m.group_id = id and m.user_id = auth.uid())); create policy "group creator writes" on public.study_groups for all using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy "membership owner access" on public.study_group_members for select using (user_id = auth.uid() or exists (select 1 from public.study_group_members m where m.group_id = group_id and m.user_id = auth.uid())); create policy "membership owner writes" on public.study_group_members for all using (user_id = auth.uid() or exists (select 1 from public.study_groups g where g.id = group_id and g.created_by = auth.uid()));
create policy "group message members" on public.study_group_messages for select using (exists (select 1 from public.study_group_members m where m.group_id = group_id and m.user_id = auth.uid())); create policy "group message sender" on public.study_group_messages for insert with check (user_id = auth.uid() and exists (select 1 from public.study_group_members m where m.group_id = group_id and m.user_id = auth.uid()));
create policy "shared material members" on public.study_group_materials for select using (exists (select 1 from public.study_group_members m where m.group_id = group_id and m.user_id = auth.uid())); create policy "shared material owner" on public.study_group_materials for insert with check (shared_by = auth.uid() and exists (select 1 from public.study_group_members m where m.group_id = group_id and m.user_id = auth.uid()));
create policy "match participants" on public.study_matches for all using (requester_id = auth.uid() or candidate_id = auth.uid()) with check (requester_id = auth.uid() or candidate_id = auth.uid());
create policy "rescue owner" on public.study_rescue_plans for all using (user_id = auth.uid()) with check (user_id = auth.uid()); create policy "quest owner" on public.learning_quests for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter publication supabase_realtime add table public.study_group_messages;
