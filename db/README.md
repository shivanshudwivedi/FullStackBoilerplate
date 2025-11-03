# Database Setup - AfterQuery Interview Platform

This directory contains all database schema, migrations, views, and seed data for the Interview Assessment Platform.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Database Schema](#database-schema)
3. [Setup Instructions](#setup-instructions)
4. [Row Level Security](#row-level-security)
5. [Useful Views](#useful-views)
6. [Maintenance](#maintenance)

## 🚀 Quick Start

### Prerequisites
- Supabase account (free tier works)
- Database created in Supabase

### Installation Steps

1. **Run the main schema** (creates all tables, indexes, triggers, RLS):
   ```sql
   -- Copy and paste schema.sql into Supabase SQL Editor
   -- Or use the Supabase CLI
   supabase db reset
   ```

2. **Create useful views** (optional but recommended):
   ```sql
   -- Copy and paste views.sql into Supabase SQL Editor
   ```

3. **Add seed data** (optional, for testing):
   ```sql
   -- Copy and paste seed_data.sql into Supabase SQL Editor
   ```

4. **Create your first admin user**:
   - Sign up via Supabase Auth UI
   - Update their profile:
     ```sql
     update profiles set role = 'admin' 
     where email = 'your-email@company.com';
     ```

## 📊 Database Schema

### Tables

#### 1. **profiles**
User profiles linked to Supabase auth.
- Links to `auth.users`
- Stores role (admin/candidate)
- Auto-created on user signup

#### 2. **assessments**
Coding assessments created by admins.
- Contains title, description, instructions
- References seed GitHub repository
- Configurable time limits
- Can be activated/deactivated

#### 3. **candidates**
Candidate information.
- Email, name, GitHub username
- Can have multiple assessments
- Tracks overall status
- Optional resume and LinkedIn

#### 4. **candidate_assessments**
Junction table linking candidates to assessments.
- Unique start slug for each candidate
- Tracks deadlines and status
- One candidate per assessment (enforced)
- Status: invited → started → submitted/expired

#### 5. **repos**
GitHub repository records.
- One repo per candidate assessment
- Stores GitHub URLs and SHAs
- Archive tracking
- Unique repository names

#### 6. **reviews**
Admin reviews of submissions.
- Stack ranking (0-100)
- AI auto-scoring (0-100)
- AI summary in markdown
- Manual notes
- Recommendation (hire/maybe/pass)

#### 7. **comments**
Inline code comments.
- File path and line numbers
- Markdown content
- Can be resolved
- Tracks author and resolution

#### 8. **events**
Audit log of all platform activity.
- 14 different event types
- JSON payload for details
- Tracks actor (who did it)
- Immutable history

### Relationships

```
assessments (1) ──── (N) candidate_assessments (N) ──── (1) candidates
                              │
                              ├──── (1) repos
                              ├──── (1) reviews
                              ├──── (N) comments
                              └──── (N) events
```

### Indexes

All tables have optimized indexes for:
- Primary lookups (by ID)
- Foreign key relationships
- Status filtering
- Date sorting
- Email searching

**Total indexes:** 30+

### Constraints

- Check constraints on scores (0-100)
- Check constraints on line numbers (positive)
- Unique constraints on slugs, emails, repo names
- Not null constraints on critical fields
- Foreign key cascades for data integrity

## 🛠 Setup Instructions

### Option 1: Supabase UI (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy contents of `schema.sql`
5. Click "Run"
6. Wait for completion (~30 seconds)
7. Verify tables in Table Editor

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Or reset database
supabase db reset
```

### Option 3: Direct PostgreSQL

```bash
# Connect to your database
psql postgresql://[CONNECTION_STRING]

# Run schema
\i schema.sql
\i views.sql
```

### Verify Installation

Run this query to check all tables were created:

```sql
select table_name 
from information_schema.tables 
where table_schema = 'public' 
order by table_name;
```

Expected tables:
- assessments
- candidate_assessments
- candidates
- comments
- events
- profiles
- repos
- reviews

## 🔒 Row Level Security (RLS)

All tables have RLS enabled with secure policies.

### Admin Access
Admins have full access to all tables via the `is_admin()` helper function.

### Candidate Access
Candidates can only see their own data:
- ✅ Their own profile
- ✅ Their assigned assessments
- ✅ Their candidate assessment records
- ✅ Their repository information
- ✅ Events for their assessments
- ❌ Reviews (admin only)
- ❌ Comments (admin only, can be enabled)

### Helper Functions

```sql
-- Check if current user is admin
is_admin() → boolean

-- Get current user's candidate ID
get_current_candidate_id() → uuid
```

### Testing RLS

```sql
-- As admin (should see all)
select * from candidate_assessments;

-- As candidate (should see only their own)
select * from candidate_assessments;

-- Test policies
set role authenticated;
select auth.uid(); -- Should return your user ID
```

## 📊 Useful Views

The `views.sql` file creates several helpful views:

### 1. **assessment_overview**
Summary statistics for each assessment.
```sql
select * from assessment_overview;
```

### 2. **candidate_assessment_details**
Complete candidate journey with all related data.
```sql
select * from candidate_assessment_details 
where candidate_email = 'test@example.com';
```

### 3. **candidate_leaderboard**
Rankings by assessment with scores.
```sql
select * from candidate_leaderboard 
where assessment_id = 'xxx';
```

### 4. **activity_timeline**
Recent platform activity feed.
```sql
select * from activity_timeline 
limit 50;
```

### 5. **pending_actions**
What needs attention right now.
```sql
select * from pending_actions;
```

### 6. **platform_statistics**
Overall platform metrics.
```sql
select * from platform_statistics;
```

## 🔧 Maintenance

### Backup

```sql
-- Export all data
pg_dump -h [host] -U [user] [database] > backup.sql

-- Or use Supabase dashboard backups
```

### Monitor Performance

```sql
-- Check slow queries
select * from pg_stat_statements 
order by total_time desc limit 10;

-- Check table sizes
select 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
from pg_tables 
where schemaname = 'public'
order by pg_total_relation_size(schemaname||'.'||tablename) desc;
```

### Cleanup Old Data

```sql
-- Archive old events (keep last 90 days)
delete from events 
where created_at < now() - interval '90 days';

-- Find expired assessments to clean up
select * from candidate_assessments 
where status = 'expired' 
  and created_at < now() - interval '180 days';
```

### Update Statistics

```sql
-- Refresh materialized views (if you create any)
-- analyze tables for query optimization
analyze;
```

## 🐛 Troubleshooting

### Issue: RLS blocks admin access

```sql
-- Check admin role
select * from profiles where user_id = auth.uid();

-- Should show role = 'admin'
-- If not, update:
update profiles set role = 'admin' 
where user_id = auth.uid();
```

### Issue: Functions not found

```sql
-- Check if functions exist
select routine_name 
from information_schema.routines 
where routine_schema = 'public';

-- Should include: is_admin, get_current_candidate_id, update_updated_at_column, handle_new_user
```

### Issue: Triggers not firing

```sql
-- Check triggers
select * from information_schema.triggers 
where trigger_schema = 'public';

-- Re-run schema.sql if triggers are missing
```

### Issue: Foreign key violations

```sql
-- Check orphaned records
select * from candidate_assessments ca
where not exists (select 1 from assessments a where a.id = ca.assessment_id);

-- Clean up if needed
```

## 📝 Migration Strategy

When updating schema:

1. **Create migration file** (`migrations/001_add_feature.sql`)
2. **Test on development** database first
3. **Backup production** before applying
4. **Apply migration** during low-traffic window
5. **Verify** all tables and data
6. **Monitor** for errors

### Migration Template

```sql
-- Migration: [Description]
-- Created: [Date]
-- Author: [Name]

-- ============================================================================
-- UP
-- ============================================================================

-- Add your changes here
alter table assessments add column new_field text;

-- ============================================================================
-- DOWN (for rollback)
-- ============================================================================

-- How to undo the changes
-- alter table assessments drop column new_field;
```

## 🎯 Best Practices

1. **Always use transactions** for multi-statement operations
2. **Test RLS policies** with different user roles
3. **Monitor index usage** and add more as needed
4. **Regular backups** (Supabase does this automatically)
5. **Keep audit logs** (events table) for compliance
6. **Use prepared statements** in application code
7. **Validate data** before inserting (use constraints)
8. **Document changes** in migration files

## 📚 References

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Design Best Practices](https://supabase.com/docs/guides/database/design)

## ✅ Checklist

After setup, verify:

- [ ] All 8 tables created
- [ ] All indexes created
- [ ] All triggers working (updated_at auto-updates)
- [ ] RLS enabled on all tables
- [ ] Helper functions exist
- [ ] Views created (optional)
- [ ] At least one admin user created
- [ ] Backend can connect successfully
- [ ] Sample queries work

---

**Need help?** Check the troubleshooting section or review the Supabase logs.