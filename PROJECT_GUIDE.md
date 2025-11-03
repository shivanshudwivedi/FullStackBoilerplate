# 🚀 Coding Assessment Platform - Complete Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Design System](#design-system)
- [Deployment](#deployment)
- [Testing Guide](#testing-guide)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

A production-ready, full-stack platform for creating, distributing, and reviewing coding assessments. Perfect for technical hiring, bootcamps, and code education.

### Key Features

**For Administrators:**
- 📝 Create assessments with custom instructions and deadlines
- 📧 Invite candidates via email with unique links
- 🔍 Review code submissions with in-platform diffs
- 🤖 Generate AI-powered code analysis
- 📊 Stack rank candidates with scoring
- 📅 Schedule follow-up interviews

**For Candidates:**
- 🎯 Start assessments with auto-created private repos
- ⏱️ Track deadlines in real-time
- 💻 Work naturally with Git workflow
- ✅ Submit with one click

## 🏗️ Architecture

```
Frontend (Next.js/Vercel)
    ↓ HTTPS
Backend (FastAPI/Railway)
    ↓ SQL
Database (Supabase/PostgreSQL)
    
External Services:
- GitHub API (repo management)
- Resend (email)
- OpenRouter (AI analysis)
- Relace (code search)
- Cal.com (scheduling)
```

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** CSS Variables + CSS Modules
- **State:** React Hooks
- **HTTP:** Axios
- **Markdown:** React Markdown
- **Deployment:** Vercel

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database ORM:** Supabase Client (PostgreSQL)
- **GitHub:** PyGithub
- **Email:** Resend API
- **AI:** OpenRouter API
- **Code Search:** Relace API
- **Scheduling:** Cal.com API
- **Deployment:** Railway

### Database
- **Type:** PostgreSQL 15+ on Supabase
- **Features:** RLS, Triggers, Views, Indexes
- **Auth:** Supabase Auth with JWT

## 📁 Project Structure

```
zChFS/
│
├── frontend/                    # Next.js Application
│   ├── app/
│   │   ├── admin/
│   │   │   ├── assessments/
│   │   │   │   ├── new/         # Create assessment form
│   │   │   │   └── [id]/        # Assessment detail page
│   │   │   ├── review/
│   │   │   │   └── [candidate_assessment_id]/  # Review page
│   │   │   └── page.tsx         # Admin dashboard
│   │   ├── start/
│   │   │   └── [slug]/          # Candidate start page
│   │   ├── globals.css          # Design system
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Home page
│   ├── lib/
│   │   ├── api.ts               # Axios client
│   │   ├── supabase.ts          # Supabase client
│   │   └── utils.ts             # Helper functions
│   ├── package.json
│   └── env.example
│
├── backend/                     # FastAPI Application
│   ├── app/
│   │   ├── routes/
│   │   │   ├── assessments.py   # Assessment CRUD
│   │   │   ├── candidate.py     # Candidate flow
│   │   │   ├── review.py        # Review endpoints
│   │   │   ├── followup.py      # Follow-up emails
│   │   │   └── example.py       # Example route
│   │   ├── services/
│   │   │   ├── github_service.py      # GitHub API
│   │   │   ├── database_service.py    # Database ops
│   │   │   ├── email_service.py       # Email sending
│   │   │   ├── ai_service.py          # AI analysis
│   │   │   └── calendar_service.py    # Scheduling
│   │   ├── database.py          # Supabase connection
│   │   └── main.py              # FastAPI app
│   ├── requirements.txt
│   ├── env.example
│   └── README.md
│
├── db/                          # Database Setup
│   ├── schema.sql               # Tables, RLS, triggers
│   ├── views.sql                # Analytical views
│   ├── seed_data.sql            # Sample data
│   ├── QUICKSTART.sql           # All-in-one setup
│   └── README.md
│
├── docker-compose.yml
├── FRONTEND_COMPLETE.md
├── DATABASE_SETUP_COMPLETE.md
└── PROJECT_GUIDE.md             # This file
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase account
- GitHub personal access token
- API keys (optional but recommended)

### Step 1: Database Setup

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and keys

2. **Run Database Scripts:**
   - Open Supabase SQL Editor
   - Copy/paste contents of `db/QUICKSTART.sql`
   - Execute script
   - Verify tables are created

3. **Enable Row Level Security:**
   - All tables should have RLS enabled automatically
   - Verify in Table Editor → RLS tab

### Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp env.example .env

# Edit .env with your credentials
# Required:
#   - SUPABASE_URL
#   - SUPABASE_SERVICE_ROLE_KEY
#   - GITHUB_MACHINE_USER_TOKEN
# Optional:
#   - RESEND_API_KEY
#   - OPENROUTER_API_KEY
#   - RELACE_API_KEY
#   - CALCOM_API_KEY

# Run server
uvicorn app.main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit .env with your credentials
# Required:
#   - NEXT_PUBLIC_SUPABASE_URL
#   - NEXT_PUBLIC_SUPABASE_ANON_KEY
#   - SUPABASE_SERVICE_ROLE_KEY
#   - NEXT_PUBLIC_API_BASE_URL (http://localhost:8000/api)

# Run development server
npm run dev
```

Frontend runs at `http://localhost:3000`

### Step 4: Verify Setup

1. Open `http://localhost:3000`
2. Go to Admin Dashboard
3. Try creating an assessment
4. Check backend logs for any errors

## 📡 API Documentation

### Base URL
- Local: `http://localhost:8000/api`
- Production: `https://your-railway-app.railway.app/api`

### Key Endpoints

#### Assessment Management
```
POST   /api/assessments              Create assessment
GET    /api/assessments              List all assessments
GET    /api/assessments/{id}         Get assessment details
POST   /api/assessments/{id}/invite  Invite candidate
```

#### Candidate Flow
```
GET    /api/start/{slug}              Get assessment details
POST   /api/start/{slug}/begin        Start assessment (create repo)
POST   /api/submit                    Submit assessment
```

#### Review & Analysis
```
GET    /api/review/{id}               Get review data
GET    /api/diff/{id}                 Get code diff
POST   /api/comment                   Add inline comment
POST   /api/ai/summary                Generate AI analysis
POST   /api/rank                      Save ranking
```

#### Follow-up
```
POST   /api/followup/send             Send follow-up email
```

### Example Requests

**Create Assessment:**
```bash
curl -X POST http://localhost:8000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Full Stack Challenge",
    "description": "Build a todo app",
    "instructions_md": "# Task\nCreate a CRUD app...",
    "seed_repo_url": "https://github.com/user/template",
    "start_by_hours": 72,
    "complete_within_hours": 48
  }'
```

**Invite Candidate:**
```bash
curl -X POST http://localhost:8000/api/assessments/{id}/invite \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate@example.com",
    "name": "Jane Doe",
    "github_username": "janedoe"
  }'
```

## 🗄️ Database Schema

### Core Tables

**profiles**
- Auto-created from Supabase Auth
- Stores user metadata

**assessments**
- Assessment definitions
- Instructions, deadlines, settings

**candidates**
- Candidate information
- Contact details, resume links

**candidate_assessments**
- Assessment invitations
- Unique slugs, deadlines, status

**repos**
- GitHub repository metadata
- Repo URLs, SHAs, commit history

**reviews**
- Code review data
- AI summaries, scores, rankings

**comments**
- Inline code comments
- File, line, thread support

**events**
- Audit log
- All platform activities

### Key Features

**Row Level Security:**
- Admins can see all data
- Candidates can only see their own data
- Guest access blocked

**Triggers:**
- Auto-update `updated_at` timestamps
- Auto-create profiles from auth users

**Views:**
- `assessment_overview` - Assessment stats
- `candidate_leaderboard` - Rankings
- `activity_timeline` - Recent events
- `platform_statistics` - Global metrics

**Indexes:**
- Optimized for common queries
- Foreign key indexes
- Status and email lookups

## 🎨 Design System

### CSS Variables (in `globals.css`)

**Colors:**
```css
--color-primary: #3b82f6
--color-success: #10b981
--color-warning: #f59e0b
--color-error: #ef4444
```

**Spacing:**
```css
--spacing-xs: 0.25rem (4px)
--spacing-sm: 0.5rem (8px)
--spacing-md: 1rem (16px)
--spacing-lg: 1.5rem (24px)
--spacing-xl: 2rem (32px)
--spacing-2xl: 3rem (48px)
--spacing-3xl: 4rem (64px)
```

**Typography:**
```css
--font-sans: system-ui, sans-serif
--font-mono: 'Monaco', monospace
```

### Component Classes

**Buttons:**
- `.btn` - Base button
- `.btn-primary` - Primary action
- `.btn-secondary` - Secondary action
- `.btn-success` - Success action
- `.btn-danger` - Destructive action
- `.btn-sm`, `.btn-lg` - Size variants

**Badges:**
- `.badge-info` - Blue (invited)
- `.badge-warning` - Yellow (in progress)
- `.badge-success` - Green (submitted)
- `.badge-error` - Red (expired)

**Cards:**
- `.card` - Container with shadow
- Automatically responsive

**Forms:**
- `.form-group` - Field wrapper
- `.form-label` - Label text
- `.form-input` - Text input
- `.form-textarea` - Textarea
- `.form-help` - Help text

## 🚢 Deployment

### Frontend (Vercel)

1. **Connect Repository:**
   - Go to [vercel.com](https://vercel.com)
   - Import Git repository
   - Select `frontend` as root directory

2. **Configure:**
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Environment Variables:**
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_API_BASE_URL
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

### Backend (Railway)

1. **Create Project:**
   - Go to [railway.app](https://railway.app)
   - Create new project from GitHub

2. **Configure:**
   - Root Directory: `backend`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Environment Variables:**
   ```
   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   GITHUB_MACHINE_USER_TOKEN
   RESEND_API_KEY
   OPENROUTER_API_KEY
   RELACE_API_KEY
   CALCOM_API_KEY
   EMAIL_FROM
   FRONTEND_URL
   ```

4. **Deploy:**
   - Railway auto-deploys on push
   - Note your Railway URL

5. **Update Frontend:**
   - Set `NEXT_PUBLIC_API_BASE_URL` to Railway URL
   - Redeploy frontend

## 🧪 Testing Guide

### Test Flow

1. **Create Assessment**
   - Navigate to Admin Dashboard
   - Click "Create Assessment"
   - Fill in all fields
   - Submit

2. **Invite Candidate**
   - Open assessment details
   - Click "Invite Candidate"
   - Enter email and info
   - Send invitation

3. **Start Assessment (as Candidate)**
   - Open invitation email
   - Click unique link
   - Review instructions
   - Click "Start Assessment"
   - Note: Private GitHub repo created

4. **Work on Assessment**
   - Clone repository
   - Make changes
   - Commit and push

5. **Submit Assessment**
   - Return to assessment page
   - Click "Submit Assessment"
   - Type "CONFIRM"
   - Submit

6. **Review Submission (as Admin)**
   - Go to assessment details
   - Click on candidate
   - View code diff
   - Generate AI summary
   - Add ranking
   - Save review

7. **Send Follow-up**
   - Click "Send Follow-Up"
   - Candidate receives interview booking link

### API Testing

Use the interactive docs at `/docs`:
```bash
open http://localhost:8000/docs
```

Or use curl/Postman to test endpoints directly.

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check Python version (need 3.10+)
- Verify all env vars are set
- Check Supabase URL and keys

**Frontend can't connect to backend:**
- Verify `NEXT_PUBLIC_API_BASE_URL`
- Check backend is running on correct port
- Look for CORS errors in console

**Database errors:**
- Ensure RLS policies are applied
- Check service role key has proper permissions
- Verify tables exist in Supabase

**GitHub repo creation fails:**
- Check GitHub token permissions
- Ensure machine user has access
- Verify seed repo exists and is accessible

**Emails not sending:**
- Verify Resend API key
- Check `EMAIL_FROM` domain is verified
- Look at backend logs for errors

**AI analysis not working:**
- Check OpenRouter API key
- Verify you have credits
- Check Relace API key

### Debug Mode

**Backend:**
```bash
# Run with debug logging
LOG_LEVEL=DEBUG uvicorn app.main:app --reload
```

**Frontend:**
```bash
# Check browser console
# Network tab for API calls
```

### Logs

**Backend Logs:**
- Check Railway logs in dashboard
- Or terminal if running locally

**Frontend Logs:**
- Browser DevTools Console
- Vercel deployment logs

## 📚 Additional Resources

- **FastAPI Docs:** [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Resend Docs:** [resend.com/docs](https://resend.com/docs)
- **OpenRouter:** [openrouter.ai/docs](https://openrouter.ai/docs)

## 🎉 Success!

You now have a fully functional coding assessment platform! 🚀

**Next Steps:**
1. Create your first assessment
2. Invite a test candidate
3. Review their submission
4. Customize the design to match your brand
5. Add custom features as needed

**Questions?**
- Check the documentation in each directory
- Review API docs at `/docs`
- Test with sample data first

---

**Happy Assessing! 🎯**

