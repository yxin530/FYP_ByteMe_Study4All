-- Phase 13: dedicated collaboration groups, chat, and shared notes.
create table if not exists public.whiteboard_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 100),
  created_by uuid not null references auth.users(id) on delete cascade,
  study_group_id uuid unique references public.study_groups(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.whiteboard_group_members (
  group_id uuid not null references public.whiteboard_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key(group_id, user_id)
);

create table if not exists public.whiteboard_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.whiteboard_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.whiteboard_documents (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null unique references public.whiteboard_groups(id) on delete cascade,
  title text not null check (length(title) between 1 and 160),
  content text not null default '',
  source_references jsonb not null default '[]'::jsonb,
  revision integer not null default 0 check (revision >= 0),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.whiteboard_revisions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.whiteboard_documents(id) on delete cascade,
  revision integer not null check (revision > 0),
  content text not null,
  source_references jsonb not null default '[]'::jsonb,
  edited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(document_id, revision)
);

create index if not exists whiteboard_messages_group_idx on public.whiteboard_messages(group_id, created_at desc);
create index if not exists whiteboard_revisions_document_idx on public.whiteboard_revisions(document_id, revision desc);

alter table public.whiteboard_groups enable row level security;
alter table public.whiteboard_group_members enable row level security;
alter table public.whiteboard_messages enable row level security;
alter table public.whiteboard_documents enable row level security;
alter table public.whiteboard_revisions enable row level security;

create or replace function public.is_whiteboard_group_member(target_group uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.whiteboard_group_members where group_id = target_group and user_id = auth.uid()) $$;
create or replace function public.is_whiteboard_group_owner(target_group uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.whiteboard_groups where id = target_group and created_by = auth.uid()) $$;

-- The existing study-group member SELECT policy queries its own table. Replace
-- that recursive check with a narrow security-definer membership predicate so
-- existing groups can be safely listed and their current members copied.
create or replace function public.is_study_group_member(target_group uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.study_group_members where group_id = target_group and user_id = auth.uid()) $$;
drop policy if exists "group members access" on public.study_groups;
create policy "group members access" on public.study_groups for select to authenticated
using (public.is_study_group_member(id));
drop policy if exists "membership owner access" on public.study_group_members;
create policy "membership owner access" on public.study_group_members for select to authenticated
using (user_id = auth.uid() or public.is_study_group_member(group_id));

drop policy if exists "whiteboard groups member access" on public.whiteboard_groups;
create policy "whiteboard groups member access" on public.whiteboard_groups for select to authenticated
using (created_by = auth.uid() or public.is_whiteboard_group_member(id));
drop policy if exists "whiteboard group owner creates" on public.whiteboard_groups;
create policy "whiteboard group owner creates" on public.whiteboard_groups for insert to authenticated
with check (created_by = auth.uid());
drop policy if exists "whiteboard group owner updates" on public.whiteboard_groups;
create policy "whiteboard group owner updates" on public.whiteboard_groups for update to authenticated
using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists "whiteboard group owner deletes" on public.whiteboard_groups;
create policy "whiteboard group owner deletes" on public.whiteboard_groups for delete to authenticated
using (created_by = auth.uid());
drop policy if exists "whiteboard members visible to members" on public.whiteboard_group_members;
create policy "whiteboard members visible to members" on public.whiteboard_group_members for select to authenticated
using (public.is_whiteboard_group_member(group_id));
drop policy if exists "whiteboard owner manages members" on public.whiteboard_group_members;
create policy "whiteboard owner manages members" on public.whiteboard_group_members for all to authenticated
using (public.is_whiteboard_group_owner(group_id))
with check (public.is_whiteboard_group_owner(group_id));
drop policy if exists "whiteboard members read chat" on public.whiteboard_messages;
create policy "whiteboard members read chat" on public.whiteboard_messages for select to authenticated
using (public.is_whiteboard_group_member(group_id));
drop policy if exists "whiteboard members send chat" on public.whiteboard_messages;
create policy "whiteboard members send chat" on public.whiteboard_messages for insert to authenticated
with check (user_id = auth.uid() and public.is_whiteboard_group_member(group_id));
drop policy if exists "whiteboard members access documents" on public.whiteboard_documents;
create policy "whiteboard members read documents" on public.whiteboard_documents for select to authenticated
using (public.is_whiteboard_group_member(group_id));
drop policy if exists "whiteboard members create documents" on public.whiteboard_documents;
create policy "whiteboard members create documents" on public.whiteboard_documents for insert to authenticated
with check (public.is_whiteboard_group_member(group_id));
drop policy if exists "whiteboard members read revisions" on public.whiteboard_revisions;
create policy "whiteboard members read revisions" on public.whiteboard_revisions for select to authenticated
using (exists (select 1 from public.whiteboard_documents d where d.id = document_id and public.is_whiteboard_group_member(d.group_id)));

do $$ begin alter publication supabase_realtime add table public.whiteboard_messages; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.whiteboard_documents; exception when duplicate_object then null; end $$;

create or replace function public.save_whiteboard_revision(target_document uuid, expected_revision integer, new_title text, new_content text, editor uuid, new_sources jsonb default '[]'::jsonb)
returns jsonb language plpgsql security definer set search_path = public
as $$
declare saved public.whiteboard_documents;
begin
  if editor <> auth.uid() then raise exception 'editor does not match authenticated user' using errcode = '42501'; end if;
  if not public.is_whiteboard_group_member((select group_id from public.whiteboard_documents where id = target_document)) then
    raise exception 'whiteboard membership required' using errcode = '42501';
  end if;
  update public.whiteboard_documents
    set title = new_title, content = new_content, source_references = new_sources, revision = expected_revision + 1,
        updated_by = editor, updated_at = now()
    where id = target_document and revision = expected_revision
    returning * into saved;
  if not found then return jsonb_build_object('saved', false); end if;
  insert into public.whiteboard_revisions(document_id, revision, content, source_references, edited_by)
    values(saved.id, saved.revision, saved.content, saved.source_references, editor);
  return jsonb_build_object('saved', true, 'document', to_jsonb(saved));
end;
$$;
