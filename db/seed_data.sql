-- ============================================================================
-- SEED DATA & INITIAL SETUP
-- ============================================================================

-- This script creates initial data for the platform
-- Run this AFTER running schema.sql

-- ============================================================================
-- CREATE ADMIN USER
-- ============================================================================

-- First, you need to create an admin user in Supabase Auth UI or via API
-- Then update their profile to be an admin:

-- Example (replace with your actual admin user_id):
-- update profiles set role = 'admin' where email = 'admin@yourcompany.com';

-- ============================================================================
-- SAMPLE ASSESSMENT (Optional - for testing)
-- ============================================================================

-- Uncomment below to create a sample assessment for testing

/*
insert into assessments (
  title,
  description,
  instructions_md,
  seed_repo_url,
  start_by_hours,
  complete_within_hours,
  email_template,
  is_active
) values (
  'Full Stack Developer Assessment',
  'Build a simple CRUD application with authentication',
  '# Instructions

## Objective
Create a full-stack application with the following features:

1. User authentication (signup/login)
2. CRUD operations for a resource of your choice
3. RESTful API
4. Responsive UI

## Requirements
- Use React for frontend
- Use Node.js/Express or Python/FastAPI for backend
- Include tests
- Deploy to a hosting service

## Deliverables
- Working application
- README with setup instructions
- Tests

## Evaluation Criteria
- Code quality and organization
- Functionality
- UI/UX
- Tests
- Documentation

Good luck!',
  'https://github.com/yourusername/assessment-template',
  72,
  48,
  'We''re excited to see what you build! Take your time and showcase your skills.',
  true
);
*/

-- ============================================================================
-- HELPFUL QUERIES FOR ADMINS
-- ============================================================================

-- View all active assessments with candidate counts
/*
select 
  a.id,
  a.title,
  a.created_at,
  count(ca.id) as total_candidates,
  count(case when ca.status = 'submitted' then 1 end) as submitted,
  count(case when ca.status = 'started' then 1 end) as in_progress,
  count(case when ca.status = 'invited' then 1 end) as invited
from assessments a
left join candidate_assessments ca on ca.assessment_id = a.id
where a.is_active = true
group by a.id, a.title, a.created_at
order by a.created_at desc;
*/

-- View all candidates with their latest assessment status
/*
select 
  c.name,
  c.email,
  c.github_username,
  ca.status,
  a.title as assessment_title,
  ca.submitted_at,
  r.stack_rank_score,
  r.auto_score
from candidates c
join candidate_assessments ca on ca.candidate_id = c.id
join assessments a on a.id = ca.assessment_id
left join reviews r on r.candidate_assessment_id = ca.id
order by ca.created_at desc;
*/

-- Find candidates ready for follow-up
/*
select 
  c.name,
  c.email,
  a.title as assessment_title,
  ca.submitted_at,
  r.stack_rank_score,
  r.recommendation
from candidates c
join candidate_assessments ca on ca.candidate_id = c.id
join assessments a on a.id = ca.assessment_id
left join reviews r on r.candidate_assessment_id = ca.id
where ca.status = 'submitted'
  and r.stack_rank_score >= 70
  and not exists (
    select 1 from events e 
    where e.candidate_assessment_id = ca.id 
    and e.type = 'follow_up_sent'
  )
order by r.stack_rank_score desc;
*/

