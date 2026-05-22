-- After running this SQL, go to Supabase Dashboard → Authentication → URL Configuration
-- Set Site URL to your domain (e.g. https://yourdomain.com)
-- Add /auth/callback to Redirect URLs

-- Profiles table for admin separation and role management
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'client' check (role in ('client', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Admins can manage all profiles" on profiles;
drop policy if exists "Service role full access" on profiles;

-- RLS Policies for profiles
create policy "Users can view own profile"
  on profiles for select
  using (
    auth.role() = 'authenticated' AND
    id = auth.uid()
  );

create policy "Admins can manage all profiles"
  on profiles for all
  using (
    auth.role() = 'authenticated' AND
    EXISTS (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "Service role full access"
  on profiles for all to service_role
  using (true) with check (true);

-- Function to handle new user signup and create a profile
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql as $$
declare
  default_role text := 'client';
begin
  -- Check if the email matches admin@example.com to assign admin role
  if new.email = 'admin@example.com' then
    default_role := 'admin';
  else
    -- Also check if they are set up as admin in lancerlink_projects table
    if exists (
      select 1 from public.lancerlink_projects
      where client_email = new.email and role = 'admin'
    ) then
      default_role := 'admin';
    end if;
  end if;

  insert into public.profiles (id, email, role)
  values (new.id, new.email, default_role)
  on conflict (id) do update
  set email = excluded.email,
      role = excluded.role;
  return new;
end;
$$;

-- Trigger to call handle_new_user on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- LancerLink — lancerlink_projects table (run in Supabase SQL Editor)

create table if not exists lancerlink_projects (
  id uuid primary key default gen_random_uuid(),
  client_email text unique not null,
  project_name text,
  progress_percent integer default 0 check (progress_percent >= 0 and progress_percent <= 100),
  invoice_status text default 'Pending' check (invoice_status in ('Pending', 'Paid')),
  invoice_amount numeric,
  github_url text,
  updated_at timestamptz default now(),
  role text default 'client' check (role in ('client', 'admin'))
);

-- Add role column when upgrading an existing table
alter table lancerlink_projects add column if not exists role text default 'client';

alter table lancerlink_projects enable row level security;

-- Drop existing policies
drop policy if exists "Service role full access" on lancerlink_projects;
drop policy if exists "Clients can view own project" on lancerlink_projects;
drop policy if exists "Admins can view all projects" on lancerlink_projects;
drop policy if exists "Clients can insert own project" on lancerlink_projects;
drop policy if exists "Admins can insert any project" on lancerlink_projects;
drop policy if exists "Clients can update own project" on lancerlink_projects;
drop policy if exists "Admins can update any project" on lancerlink_projects;
drop policy if exists "Clients can delete own project" on lancerlink_projects;
drop policy if exists "Admins can delete any project" on lancerlink_projects;

-- RLS Policies for lancerlink_projects
-- Clients can view their own project
create policy "Clients can view own project"
  on lancerlink_projects for select
  using (
    auth.role() = 'authenticated' AND
    client_email IN (
      select email from profiles where id = auth.uid()
    )
  );

-- Admins can view all projects
create policy "Admins can view all projects"
  on lancerlink_projects for select
  using (
    auth.role() = 'authenticated' AND
    EXISTS (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Clients can insert their own project
create policy "Clients can insert own project"
  on lancerlink_projects for insert
  with check (
    auth.role() = 'authenticated' AND
    client_email IN (
      select email from profiles where id = auth.uid()
    )
  );

-- Admins can insert any project
create policy "Admins can insert any project"
  on lancerlink_projects for insert
  with check (
    auth.role() = 'authenticated' AND
    EXISTS (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Clients can update their own project
create policy "Clients can update own project"
  on lancerlink_projects for update
  using (
    auth.role() = 'authenticated' AND
    client_email IN (
      select email from profiles where id = auth.uid()
    )
  )
  with check (
    auth.role() = 'authenticated' AND
    client_email IN (
      select email from profiles where id = auth.uid()
    )
  );

-- Admins can update any project
create policy "Admins can update any project"
  on lancerlink_projects for update
  using (
    auth.role() = 'authenticated' AND
    EXISTS (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    auth.role() = 'authenticated' AND
    EXISTS (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Clients can delete their own project
create policy "Clients can delete own project"
  on lancerlink_projects for delete
  using (
    auth.role() = 'authenticated' AND
    client_email IN (
      select email from profiles where id = auth.uid()
    )
  );

-- Admins can delete any project
create policy "Admins can delete any project"
  on lancerlink_projects for delete
  using (
    auth.role() = 'authenticated' AND
    EXISTS (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Keep service role policy for backend operations (if needed)
create policy "Service role full access"
  on lancerlink_projects
  for all
  to service_role
  using (true)
  with check (true);

insert into lancerlink_projects (client_email, project_name, progress_percent, invoice_status, invoice_amount, role)
select
  'client@example.com',
  'Demo Project',
  65,
  'Pending',
  1200.00,
  'client'
where not exists (
  select 1 from lancerlink_projects p where p.client_email = 'client@example.com'
);

insert into lancerlink_projects (client_email, project_name, progress_percent, invoice_status, role)
select
  'admin@example.com',
  'Internal',
  0,
  'Pending',
  'admin'
where not exists (
  select 1 from lancerlink_projects p where p.client_email = 'admin@example.com'
);

-- ============================================================
-- Migration: Add new columns to lancerlink_projects
-- ============================================================
alter table lancerlink_projects add column if not exists start_date date;
alter table lancerlink_projects add column if not exists delivery_date date;
alter table lancerlink_projects add column if not exists invoice_due_date date;
alter table lancerlink_projects add column if not exists figma_url text;
alter table lancerlink_projects add column if not exists created_at timestamptz default now();
alter table lancerlink_projects add column if not exists invoice_currency text default 'USD' check (invoice_currency in ('USD', 'INR'));

-- ============================================================
-- Messages table
-- ============================================================
create table if not exists lancerlink_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references lancerlink_projects(id) on delete cascade,
  sender_email text not null,
  sender_role text default 'client' check (sender_role in ('client', 'admin')),
  content text not null,
  created_at timestamptz default now()
);

alter table lancerlink_messages enable row level security;

-- Drop existing policies
drop policy if exists "Service role full access" on lancerlink_messages;
drop policy if exists "Users can view messages for their projects" on lancerlink_messages;
drop policy if exists "Admins can view all messages" on lancerlink_messages;
drop policy if exists "Users can insert messages for their projects" on lancerlink_messages;
drop policy if exists "Admins can insert any message" on lancerlink_messages;

-- RLS Policies for lancerlink_messages
-- Users can view messages for their projects (through project ownership)
create policy "Users can view messages for their projects"
  on lancerlink_messages for select
  using (
    auth.role() = 'authenticated' AND
    EXISTS (
      select 1 from lancerlink_projects lp
      join profiles p on lp.client_email = p.email
      where lp.id = project_id and p.id = auth.uid()
    )
  );

-- Admins can view all messages
create policy "Admins can view all messages"
  on lancerlink_messages for select
  using (
    auth.role() = 'authenticated' AND
    EXISTS (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Users can insert messages for their projects
create policy "Users can insert messages for their projects"
  on lancerlink_messages for insert
  with check (
    auth.role() = 'authenticated' AND
    EXISTS (
      select 1 from lancerlink_projects lp
      join profiles p on lp.client_email = p.email
      where lp.id = project_id and p.id = auth.uid()
    )
  );

-- Admins can insert any message
create policy "Admins can insert any message"
  on lancerlink_messages for insert
  with check (
    auth.role() = 'authenticated' AND
    EXISTS (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Keep service role policy for backend operations
create policy "Service role full access"
  on lancerlink_messages for all to service_role
  using (true) with check (true);

-- ============================================================
-- Files table
-- ============================================================
create table if not exists lancerlink_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references lancerlink_projects(id) on delete cascade,
  uploaded_by text not null,
  file_name text not null,
  file_size bigint,
  storage_path text not null,
  created_at timestamptz default now()
);

alter table lancerlink_files enable row level security;

-- Drop existing policies
drop policy if exists "Service role full access" on lancerlink_files;
drop policy if exists "Users can view files for their projects" on lancerlink_files;
drop policy if exists "Admins can view all files" on lancerlink_files;
drop policy if exists "Users can upload files for their projects" on lancerlink_files;
drop policy if exists "Admins can upload any file" on lancerlink_files;

-- RLS Policies for lancerlink_files
-- Users can view files for their projects
create policy "Users can view files for their projects"
  on lancerlink_files for select
  using (
    auth.role() = 'authenticated' AND
    EXISTS (
      select 1 from lancerlink_projects lp
      join profiles p on lp.client_email = p.email
      where lp.id = project_id and p.id = auth.uid()
    )
  );

-- Admins can view all files
create policy "Admins can view all files"
  on lancerlink_files for select
  using (
    auth.role() = 'authenticated' AND
    EXISTS (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Users can upload files for their projects
create policy "Users can upload files for their projects"
  on lancerlink_files for insert
  with check (
    auth.role() = 'authenticated' AND
    uploaded_by IN (
      select email from profiles where id = auth.uid()
    ) AND
    EXISTS (
      select 1 from lancerlink_projects lp
      join profiles p on lp.client_email = p.email
      where lp.id = project_id and p.id = auth.uid()
    )
  );

-- Admins can upload any file
create policy "Admins can upload any file"
  on lancerlink_files for insert
  with check (
    auth.role() = 'authenticated' AND
    EXISTS (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Keep service role policy for backend operations
create policy "Service role full access"
  on lancerlink_files for all to service_role
  using (true) with check (true);

-- ============================================================
-- Storage bucket policies
-- ============================================================
-- Create a storage bucket for project files if it doesn't exist
-- Note: In Supabase, buckets are typically created via the dashboard or API
-- This SQL assumes you have the storage extension enabled and uses the insert method
-- For production, you might want to create the bucket via Supabase dashboard first

-- Insert a bucket record if it doesn't exist (for development/setup)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-files', 'project-files', false, 52428800, '{application/pdf,image/jpeg,image/png,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation}')
on conflict (id) do nothing;

-- Set up storage object policies
-- Users can view files from their own projects
create policy "Users can view own project files"
  on storage.objects for select
  using (
    auth.role() = 'authenticated' AND
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      select lp.id::text from lancerlink_projects lp
      join profiles p on lp.client_email = p.email
      where p.id = auth.uid()
    )
  );

-- Admins can view all files
create policy "Admins can view all files"
  on storage.objects for select
  using (
    auth.role() = 'authenticated' AND
    bucket_id = 'project-files' AND
    EXISTS (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Users can upload files to their own project folder
create policy "Users can upload own project files"
  on storage.objects for insert
  with check (
    auth.role() = 'authenticated' AND
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      select lp.id::text from lancerlink_projects lp
      join profiles p on lp.client_email = p.email
      where p.id = auth.uid()
    ) AND
    -- Check file type (optional additional layer)
    (LOWER(storage.extension(name)) IN ('pdf', 'jpg', 'jpeg', 'png', 'txt', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'))
  );

-- Admins can upload files anywhere
create policy "Admins can upload any files"
  on storage.objects for insert
  with check (
    auth.role() = 'authenticated' AND
    bucket_id = 'project-files' AND
    EXISTS (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Users can update their own files
create policy "Users can update own project files"
  on storage.objects for update
  using (
    auth.role() = 'authenticated' AND
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      select lp.id::text from lancerlink_projects lp
      join profiles p on lp.client_email = p.email
      where p.id = auth.uid()
    )
  )
  with check (
    auth.role() = 'authenticated' AND
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      select lp.id::text from lancerlink_projects lp
      join profiles p on lp.client_email = p.email
      where p.id = auth.uid()
    )
  );

-- Admins can update any files
create policy "Admins can update any files"
  on storage.objects for update
  using (
    auth.role() = 'authenticated' AND
    bucket_id = 'project-files' AND
    EXISTS (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    auth.role() = 'authenticated' AND
    bucket_id = 'project-files' AND
    EXISTS (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Users can delete their own files
create policy "Users can delete own project files"
  on storage.objects for delete
  using (
    auth.role() = 'authenticated' AND
    bucket_id = 'project-files' AND
    (storage.foldername(name))[1] IN (
      select lp.id::text from lancerlink_projects lp
      join profiles p on lp.client_email = p.email
      where p.id = auth.uid()
    )
  );

-- Admins can delete any files
create policy "Admins can delete any files"
  on storage.objects for delete
  using (
    auth.role() = 'authenticated' AND
    bucket_id = 'project-files' AND
    EXISTS (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- Storage bucket policies
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-files', 'project-files', false, 52428800, '{application/pdf,image/jpeg,image/png,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation}')
on conflict (id) do nothing;

-- Drop ALL existing storage object policies first
drop policy if exists "Service role full access" on storage.objects;
drop policy if exists "Users can view own project files" on storage.objects;
drop policy if exists "Admins can view all files" on storage.objects;
drop policy if exists "Users can upload own project files" on storage.objects;
drop policy if exists "Admins can upload any files" on storage.objects;
drop policy if exists "Users can update own project files" on storage.objects;
drop policy if exists "Admins can update any files" on storage.objects;
drop policy if exists "Users can delete own project files" on storage.objects;
drop policy if exists "Admins can delete any files" on storage.objects;

-- Then recreate all policies...
create policy "Users can view own project files" ...
-- (rest of your policies unchanged)

-- ============================================================
-- Contact Messages table  (portfolio contact form → same DB)
-- ============================================================
create table if not exists contact_messages (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  email      text        not null,
  message    text        not null,
  created_at timestamptz default now(),
  read       boolean     default false   -- lets you mark messages as read in future
);

-- No RLS needed for inserts — the API route uses the service-role key.
-- Enable RLS so anonymous users cannot SELECT directly via the anon key.
alter table contact_messages enable row level security;

-- Service role (server-side) gets full access
drop policy if exists "Service role full access" on contact_messages;
create policy "Service role full access"
  on contact_messages for all
  to service_role
  using (true)
  with check (true);
