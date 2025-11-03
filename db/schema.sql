-- ============================================================================
-- AFTERQUERY INTERVIEW PLATFORM - DATABASE SCHEMA
-- ============================================================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- TABLES
-- ============================================================================

-- USERS come from Supabase auth; store role in a profile table
create table if not exists profiles (
  user_id uuid primary key references auth.users on delete cascade,
  role text check (role in ('admin','candidate')) not null default 'candidate',
  full_name text,
  email text unique,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index for faster email lookups
create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_profiles_role on profiles(role);

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  instructions_md text,
  seed_repo_url text not null,
  seed_main_sha text, -- pin at creation (for preview), actual start re-fetches latest
  start_by_hours int not null check (start_by_hours > 0),
  complete_within_hours int not null check (complete_within_hours > 0),
  email_template text,
  created_by uuid references profiles(user_id),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for assessments
create index if not exists idx_assessments_created_by on assessments(created_by);
create index if not exists idx_assessments_created_at on assessments(created_at desc);
create index if not exists idx_assessments_is_active on assessments(is_active);

create table if not exists candidates (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  github_username text,
  status text check (status in ('invited','started','submitted','expired')) default 'invited',
  phone text,
  linkedin_url text,
  resume_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for candidates
create index if not exists idx_candidates_email on candidates(email);
create index if not exists idx_candidates_github_username on candidates(github_username);
create index if not exists idx_candidates_status on candidates(status);
create index if not exists idx_candidates_created_at on candidates(created_at desc);

create table if not exists candidate_assessments (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  candidate_id uuid not null references candidates(id) on delete cascade,
  start_deadline_ts timestamptz not null,
  complete_deadline_ts timestamptz,
  start_token text, -- JWT for start link
  start_slug text unique not null, -- pretty link token
  pinned_seed_sha text, -- commit used to create candidate repo
  submitted_at timestamptz,
  expired_at timestamptz,
  status text check (status in ('invited','started','submitted','expired')) default 'invited',
  invitation_sent_at timestamptz default now(),
  started_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Ensure one candidate per assessment
  unique(assessment_id, candidate_id)
);

-- Indexes for candidate_assessments
create index if not exists idx_ca_assessment_id on candidate_assessments(assessment_id);
create index if not exists idx_ca_candidate_id on candidate_assessments(candidate_id);
create index if not exists idx_ca_status on candidate_assessments(status);
create index if not exists idx_ca_start_slug on candidate_assessments(start_slug);
create index if not exists idx_ca_created_at on candidate_assessments(created_at desc);

create table if not exists repos (
  id uuid primary key default gen_random_uuid(),
  candidate_assessment_id uuid unique not null references candidate_assessments(id) on delete cascade,
  github_repo_full_name text unique not null, -- org/repo
  latest_sha text,
  is_archived boolean default false,
  archived_at timestamptz,
  repo_url text, -- Full GitHub URL
  clone_url text, -- HTTPS clone URL
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for repos
create index if not exists idx_repos_ca_id on repos(candidate_assessment_id);
create index if not exists idx_repos_github_name on repos(github_repo_full_name);
create index if not exists idx_repos_is_archived on repos(is_archived);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  candidate_assessment_id uuid unique not null references candidate_assessments(id) on delete cascade,
  stack_rank_score int check (stack_rank_score >= 0 and stack_rank_score <= 100),
  auto_score int check (auto_score >= 0 and auto_score <= 100),
  ai_summary_md text,
  ai_raw_response jsonb, -- Store raw AI response for reference
  manual_notes_md text,
  recommendation text check (recommendation in ('hire', 'maybe', 'pass')),
  created_by uuid references profiles(user_id),
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for reviews
create index if not exists idx_reviews_ca_id on reviews(candidate_assessment_id);
create index if not exists idx_reviews_stack_rank on reviews(stack_rank_score desc nulls last);
create index if not exists idx_reviews_auto_score on reviews(auto_score desc nulls last);
create index if not exists idx_reviews_recommendation on reviews(recommendation);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  candidate_assessment_id uuid not null references candidate_assessments(id) on delete cascade,
  file_path text not null,
  line_start int not null check (line_start > 0),
  line_end int not null check (line_end >= line_start),
  body_md text not null,
  author_id uuid references profiles(user_id),
  is_resolved boolean default false,
  resolved_at timestamptz,
  resolved_by uuid references profiles(user_id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for comments
create index if not exists idx_comments_ca_id on comments(candidate_assessment_id);
create index if not exists idx_comments_file_path on comments(file_path);
create index if not exists idx_comments_author on comments(author_id);
create index if not exists idx_comments_is_resolved on comments(is_resolved);
create index if not exists idx_comments_created_at on comments(created_at desc);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  candidate_assessment_id uuid not null references candidate_assessments(id) on delete cascade,
  type text not null check (type in (
    'assessment_created',
    'invitation_sent',
    'assessment_started',
    'assessment_submitted',
    'assessment_expired',
    'comment_added',
    'comment_resolved',
    'ranked',
    'ai_analysis_generated',
    'follow_up_sent',
    'repo_created',
    'repo_archived',
    'collaborator_added',
    'collaborator_removed'
  )),
  payload jsonb,
  actor_id uuid references profiles(user_id), -- Who triggered this event
  created_at timestamptz default now()
);

-- Indexes for events
create index if not exists idx_events_ca_id on events(candidate_assessment_id);
create index if not exists idx_events_type on events(type);
create index if not exists idx_events_created_at on events(created_at desc);
create index if not exists idx_events_actor on events(actor_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at before update on profiles
  for each row execute function update_updated_at_column();

create trigger update_assessments_updated_at before update on assessments
  for each row execute function update_updated_at_column();

create trigger update_candidates_updated_at before update on candidates
  for each row execute function update_updated_at_column();

create trigger update_candidate_assessments_updated_at before update on candidate_assessments
  for each row execute function update_updated_at_column();

create trigger update_repos_updated_at before update on repos
  for each row execute function update_updated_at_column();

create trigger update_reviews_updated_at before update on reviews
  for each row execute function update_updated_at_column();

create trigger update_comments_updated_at before update on comments
  for each row execute function update_updated_at_column();

-- Function to automatically create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'candidate')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto-creating profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Helper function to check if user is admin
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles where user_id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Helper function to get candidate_id for current user
create or replace function get_current_candidate_id()
returns uuid as $$
begin
  return (
    select id from candidates 
    where email = (select email from auth.users where id = auth.uid())
    limit 1
  );
end;
$$ language plpgsql security definer;

-- ============================================================================
-- PROFILES TABLE RLS
-- ============================================================================
alter table profiles enable row level security;

-- Admins can see all profiles
create policy "admins_select_profiles" on profiles
  for select using (is_admin());

-- Users can see their own profile
create policy "users_select_own_profile" on profiles
  for select using (auth.uid() = user_id);

-- Users can update their own profile
create policy "users_update_own_profile" on profiles
  for update using (auth.uid() = user_id);

-- ============================================================================
-- ASSESSMENTS TABLE RLS
-- ============================================================================
alter table assessments enable row level security;

-- Admins have full access
create policy "admins_all_assessments" on assessments
  for all using (is_admin());

-- Candidates can see assessments they're assigned to
create policy "candidates_select_assigned_assessments" on assessments
  for select using (
    id in (
      select assessment_id from candidate_assessments 
      where candidate_id = get_current_candidate_id()
    )
  );

-- ============================================================================
-- CANDIDATES TABLE RLS
-- ============================================================================
alter table candidates enable row level security;

-- Admins have full access
create policy "admins_all_candidates" on candidates
  for all using (is_admin());

-- Candidates can see their own record
create policy "candidates_select_own_record" on candidates
  for select using (id = get_current_candidate_id());

-- ============================================================================
-- CANDIDATE_ASSESSMENTS TABLE RLS
-- ============================================================================
alter table candidate_assessments enable row level security;

-- Admins have full access
create policy "admins_all_candidate_assessments" on candidate_assessments
  for all using (is_admin());

-- Candidates can see their own assessments
create policy "candidates_select_own_assessments" on candidate_assessments
  for select using (candidate_id = get_current_candidate_id());

-- Candidates can update their own assessment status (for submission)
create policy "candidates_update_own_assessments" on candidate_assessments
  for update using (candidate_id = get_current_candidate_id());

-- ============================================================================
-- REPOS TABLE RLS
-- ============================================================================
alter table repos enable row level security;

-- Admins have full access
create policy "admins_all_repos" on repos
  for all using (is_admin());

-- Candidates can see their own repo
create policy "candidates_select_own_repo" on repos
  for select using (
    candidate_assessment_id in (
      select id from candidate_assessments 
      where candidate_id = get_current_candidate_id()
    )
  );

-- ============================================================================
-- REVIEWS TABLE RLS
-- ============================================================================
alter table reviews enable row level security;

-- Admins have full access
create policy "admins_all_reviews" on reviews
  for all using (is_admin());

-- Candidates cannot see reviews (admin only)

-- ============================================================================
-- COMMENTS TABLE RLS
-- ============================================================================
alter table comments enable row level security;

-- Admins have full access
create policy "admins_all_comments" on comments
  for all using (is_admin());

-- Optionally allow candidates to see comments on their code
-- Uncomment below to enable:
-- create policy "candidates_select_own_comments" on comments
--   for select using (
--     candidate_assessment_id in (
--       select id from candidate_assessments 
--       where candidate_id = get_current_candidate_id()
--     )
--   );

-- ============================================================================
-- EVENTS TABLE RLS
-- ============================================================================
alter table events enable row level security;

-- Admins have full access
create policy "admins_all_events" on events
  for all using (is_admin());

-- Candidates can see events for their assessments
create policy "candidates_select_own_events" on events
  for select using (
    candidate_assessment_id in (
      select id from candidate_assessments 
      where candidate_id = get_current_candidate_id()
    )
  );