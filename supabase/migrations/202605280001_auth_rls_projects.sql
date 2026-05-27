alter table public.projects
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists projects_user_id_updated_at_idx
  on public.projects (user_id, updated_at desc);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.render_jobs to authenticated;

alter table public.projects enable row level security;
alter table public.render_jobs enable row level security;

drop policy if exists "Users can view their own projects" on public.projects;
create policy "Users can view their own projects"
on public.projects
for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "Users can create their own projects" on public.projects;
create policy "Users can create their own projects"
on public.projects
for insert
to authenticated
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "Users can update their own projects" on public.projects;
create policy "Users can update their own projects"
on public.projects
for update
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "Users can delete their own projects" on public.projects;
create policy "Users can delete their own projects"
on public.projects
for delete
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "Users can view render jobs for their projects" on public.render_jobs;
create policy "Users can view render jobs for their projects"
on public.render_jobs
for select
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = render_jobs.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can create render jobs for their projects" on public.render_jobs;
create policy "Users can create render jobs for their projects"
on public.render_jobs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects
    where projects.id = render_jobs.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update render jobs for their projects" on public.render_jobs;
create policy "Users can update render jobs for their projects"
on public.render_jobs
for update
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = render_jobs.project_id
      and projects.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = render_jobs.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can delete render jobs for their projects" on public.render_jobs;
create policy "Users can delete render jobs for their projects"
on public.render_jobs
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = render_jobs.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can read their source videos" on storage.objects;
create policy "Users can read their source videos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'mawj-source-videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can upload their source videos" on storage.objects;
create policy "Users can upload their source videos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'mawj-source-videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update their source videos" on storage.objects;
create policy "Users can update their source videos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'mawj-source-videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'mawj-source-videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete their source videos" on storage.objects;
create policy "Users can delete their source videos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'mawj-source-videos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
