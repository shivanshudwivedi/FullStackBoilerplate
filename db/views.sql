-- ============================================================================
-- USEFUL VIEWS FOR THE INTERVIEW PLATFORM
-- ============================================================================

-- Run this AFTER schema.sql to create helpful views

-- ============================================================================
-- ASSESSMENT OVERVIEW
-- ============================================================================

create or replace view assessment_overview as
select 
  a.id,
  a.title,
  a.description,
  a.is_active,
  a.created_at,
  count(distinct ca.id) as total_candidates,
  count(distinct case when ca.status = 'invited' then ca.id end) as invited_count,
  count(distinct case when ca.status = 'started' then ca.id end) as started_count,
  count(distinct case when ca.status = 'submitted' then ca.id end) as submitted_count,
  count(distinct case when ca.status = 'expired' then ca.id end) as expired_count,
  avg(case when r.stack_rank_score is not null then r.stack_rank_score end) as avg_stack_rank,
  avg(case when r.auto_score is not null then r.auto_score end) as avg_auto_score
from assessments a
left join candidate_assessments ca on ca.assessment_id = a.id
left join reviews r on r.candidate_assessment_id = ca.id
group by a.id, a.title, a.description, a.is_active, a.created_at;

-- ============================================================================
-- CANDIDATE ASSESSMENT DETAILS
-- ============================================================================

create or replace view candidate_assessment_details as
select 
  ca.id as candidate_assessment_id,
  ca.status,
  ca.start_slug,
  ca.invitation_sent_at,
  ca.started_at,
  ca.submitted_at,
  ca.start_deadline_ts,
  ca.complete_deadline_ts,
  
  -- Candidate info
  c.id as candidate_id,
  c.name as candidate_name,
  c.email as candidate_email,
  c.github_username as candidate_github,
  
  -- Assessment info
  a.id as assessment_id,
  a.title as assessment_title,
  a.complete_within_hours,
  
  -- Repo info
  r.github_repo_full_name,
  r.repo_url,
  r.is_archived,
  
  -- Review info
  rev.stack_rank_score,
  rev.auto_score,
  rev.recommendation,
  rev.reviewed_at,
  
  -- Timing calculations
  case 
    when ca.submitted_at is not null and ca.started_at is not null
    then extract(epoch from (ca.submitted_at - ca.started_at)) / 3600
    else null
  end as hours_to_complete,
  
  case 
    when ca.status = 'started' and ca.complete_deadline_ts is not null
    then extract(epoch from (ca.complete_deadline_ts - now())) / 3600
    else null
  end as hours_remaining
  
from candidate_assessments ca
join candidates c on c.id = ca.candidate_id
join assessments a on a.id = ca.assessment_id
left join repos r on r.candidate_assessment_id = ca.id
left join reviews rev on rev.candidate_assessment_id = ca.id;

-- ============================================================================
-- LEADERBOARD VIEW
-- ============================================================================

create or replace view candidate_leaderboard as
select 
  row_number() over (partition by a.id order by rev.stack_rank_score desc nulls last) as rank,
  a.id as assessment_id,
  a.title as assessment_title,
  c.name as candidate_name,
  c.email as candidate_email,
  ca.status,
  ca.submitted_at,
  rev.stack_rank_score,
  rev.auto_score,
  rev.recommendation,
  extract(epoch from (ca.submitted_at - ca.started_at)) / 3600 as completion_hours
from assessments a
join candidate_assessments ca on ca.assessment_id = a.id
join candidates c on c.id = ca.candidate_id
left join reviews rev on rev.candidate_assessment_id = ca.id
where ca.status = 'submitted'
order by a.id, rank;

-- ============================================================================
-- ACTIVITY TIMELINE
-- ============================================================================

create or replace view activity_timeline as
select 
  e.id,
  e.type as event_type,
  e.created_at,
  e.payload,
  
  -- Candidate info
  c.name as candidate_name,
  c.email as candidate_email,
  
  -- Assessment info
  a.title as assessment_title,
  
  -- Actor info (who triggered the event)
  p.full_name as actor_name,
  p.role as actor_role
  
from events e
join candidate_assessments ca on ca.id = e.candidate_assessment_id
join candidates c on c.id = ca.candidate_id
join assessments a on a.id = ca.assessment_id
left join profiles p on p.user_id = e.actor_id
order by e.created_at desc;

-- ============================================================================
-- PENDING ACTIONS VIEW
-- ============================================================================

create or replace view pending_actions as
select 
  'Expired Assessment' as action_type,
  ca.id as candidate_assessment_id,
  c.name as candidate_name,
  c.email as candidate_email,
  a.title as assessment_title,
  ca.complete_deadline_ts as deadline,
  'Mark as expired' as suggested_action
from candidate_assessments ca
join candidates c on c.id = ca.candidate_id
join assessments a on a.id = ca.assessment_id
where ca.status = 'started' 
  and ca.complete_deadline_ts < now()

union all

select 
  'Ready for Review' as action_type,
  ca.id as candidate_assessment_id,
  c.name as candidate_name,
  c.email as candidate_email,
  a.title as assessment_title,
  ca.submitted_at as deadline,
  'Review and rank submission' as suggested_action
from candidate_assessments ca
join candidates c on c.id = ca.candidate_id
join assessments a on a.id = ca.assessment_id
where ca.status = 'submitted'
  and not exists (select 1 from reviews r where r.candidate_assessment_id = ca.id)

union all

select 
  'Follow-up Candidate' as action_type,
  ca.id as candidate_assessment_id,
  c.name as candidate_name,
  c.email as candidate_email,
  a.title as assessment_title,
  rev.reviewed_at as deadline,
  'Send interview scheduling link' as suggested_action
from candidate_assessments ca
join candidates c on c.id = ca.candidate_id
join assessments a on a.id = ca.assessment_id
join reviews rev on rev.candidate_assessment_id = ca.id
where ca.status = 'submitted'
  and rev.stack_rank_score >= 70
  and not exists (
    select 1 from events e 
    where e.candidate_assessment_id = ca.id 
    and e.type = 'follow_up_sent'
  )
order by deadline asc;

-- ============================================================================
-- STATISTICS VIEW
-- ============================================================================

create or replace view platform_statistics as
select
  (select count(*) from assessments where is_active = true) as active_assessments,
  (select count(*) from candidates) as total_candidates,
  (select count(*) from candidate_assessments where status = 'invited') as pending_invitations,
  (select count(*) from candidate_assessments where status = 'started') as active_assessments_count,
  (select count(*) from candidate_assessments where status = 'submitted') as submissions_to_review,
  (select count(*) from candidate_assessments where status = 'submitted' and exists (
    select 1 from reviews r where r.candidate_assessment_id = candidate_assessments.id
  )) as reviewed_submissions,
  (select avg(stack_rank_score) from reviews where stack_rank_score is not null) as avg_score,
  (select count(*) from events where created_at >= now() - interval '24 hours') as events_last_24h;

-- Dashboard Analytics Views

DROP VIEW IF EXISTS dashboard_stats;
CREATE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM assessments) AS total_assessments,
    (SELECT COUNT(*) FROM candidates) AS total_candidates,
    COALESCE(AVG(r.stack_rank_score), 0) AS average_score,
    COALESCE(
        (COUNT(CASE WHEN r.stack_rank_score >= 70 THEN 1 END) * 100.0) / NULLIF(COUNT(r.id), 0),
        0
    ) AS pass_rate
FROM reviews r;

DROP VIEW IF EXISTS candidate_funnel;
CREATE VIEW candidate_funnel AS
SELECT 'Invited' AS stage, COUNT(*) AS count FROM candidate_assessments
UNION ALL
SELECT 'Started' AS stage, COUNT(*) AS count FROM candidate_assessments WHERE status = 'started' OR status = 'submitted'
UNION ALL
SELECT 'Submitted' AS stage, COUNT(*) AS count FROM candidate_assessments WHERE status = 'submitted'
UNION ALL
SELECT 'Passed' AS stage, COUNT(ca.id) AS count
FROM candidate_assessments ca
JOIN reviews r ON ca.id = r.candidate_assessment_id
WHERE r.stack_rank_score >= 70;

DROP VIEW IF EXISTS assessment_performance;
CREATE VIEW assessment_performance AS
SELECT
    a.title,
    COALESCE(AVG(r.stack_rank_score), 0) AS average_score
FROM assessments a
LEFT JOIN candidate_assessments ca ON a.id = ca.assessment_id
LEFT JOIN reviews r ON ca.id = r.candidate_assessment_id
GROUP BY a.title;

DROP VIEW IF EXISTS candidate_leaderboard;
CREATE VIEW candidate_leaderboard AS
SELECT
    c.name,
    c.email,
    a.title AS assessment_title,
    r.stack_rank_score,
    ca.status,
    RANK() OVER (ORDER BY r.stack_rank_score DESC) as rank
FROM candidates c
JOIN candidate_assessments ca ON c.id = ca.candidate_id
JOIN assessments a ON ca.assessment_id = a.id
JOIN reviews r ON ca.id = r.candidate_assessment_id
WHERE ca.status = 'submitted'
ORDER BY r.stack_rank_score DESC;

