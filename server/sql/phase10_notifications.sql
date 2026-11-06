create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  push_enabled boolean not null default true,
  daily_reminders_enabled boolean not null default true,
  reminder_time time,
  timezone text not null default 'Asia/Kuala_Lumpur',
  updated_at timestamptz not null default now()
);
create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  token text not null, platform text not null check (platform in ('ios','android','web')), provider text not null default 'fcm',
  active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(user_id, token)
);
create table if not exists public.study_reminders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, body text not null, scheduled_for timestamptz not null, timezone text not null default 'Asia/Kuala_Lumpur',
  status text not null default 'scheduled' check (status in ('scheduled','sent','cancelled','failed')), created_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security; alter table public.device_tokens enable row level security; alter table public.study_reminders enable row level security;
create policy "notification preferences owner" on public.notification_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "device tokens owner" on public.device_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "study reminders owner" on public.study_reminders for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists study_reminders_due_idx on public.study_reminders(status, scheduled_for);
