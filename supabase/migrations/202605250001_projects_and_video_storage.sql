create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'uploaded', 'planned', 'rendering', 'completed', 'failed')),
  style_id text not null check (style_id in ('viral-saudi', 'premium-brand', 'podcast-cuts', 'product-drop', 'educational', 'restaurant-ad')),
  platform text not null check (platform in ('tiktok', 'instagram', 'shorts', 'snapchat')),
  aspect_ratio text not null check (aspect_ratio in ('9:16', '1:1', '16:9')),
  source_file_name text not null,
  source_file_size bigint not null default 0,
  source_mime_type text not null,
  source_duration_seconds integer not null default 0,
  storage_bucket text,
  storage_path text,
  edit_plan jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.render_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

drop trigger if exists render_jobs_set_updated_at on public.render_jobs;
create trigger render_jobs_set_updated_at
before update on public.render_jobs
for each row
execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.render_jobs enable row level security;

drop policy if exists "Service role manages projects" on public.projects;
create policy "Service role manages projects"
on public.projects
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "Service role manages render jobs" on public.render_jobs;
create policy "Service role manages render jobs"
on public.render_jobs
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mawj-source-videos',
  'mawj-source-videos',
  false,
  524288000,
  array['video/mp4', 'video/quicktime', 'video/x-m4v', 'video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Service role manages source videos" on storage.objects;
create policy "Service role manages source videos"
on storage.objects
for all
using (bucket_id = 'mawj-source-videos' and auth.role() = 'service_role')
with check (bucket_id = 'mawj-source-videos' and auth.role() = 'service_role');
