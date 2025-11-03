# FastAPI Backend - Interview Assessment Platform

## Overview

This is the backend API for the AfterQuery Interview Assessment Platform. It provides endpoints for:
- Creating and managing coding assessments
- Inviting candidates and tracking their progress
- Managing GitHub repositories for assessments
- AI-powered code analysis
- Calendar scheduling integration
- Email notifications

## Architecture

### Services Layer
- `github_service.py` - GitHub API integration for repo management
- `database_service.py` - Supabase database operations
- `email_service.py` - Resend email service
- `ai_service.py` - OpenRouter and Relace AI integration
- `calendar_service.py` - Cal.com calendar integration

### Routes
- `assessments.py` - Assessment creation and management
- `candidate.py` - Candidate start and submission flow
- `review.py` - Admin review, diffs, comments, AI analysis
- `followup.py` - Interview scheduling and follow-ups

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `env.example` to `.env` and fill in your credentials:

```bash
cp env.example .env
```

Required variables:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `GITHUB_MACHINE_USER_TOKEN` - GitHub personal access token with repo admin rights
- `RESEND_API_KEY` - Resend API key for emails
- `OPENROUTER_API_KEY` - OpenRouter API key for AI analysis
- `CALCOM_API_KEY` - Cal.com API key
- `CALCOM_USERNAME` - Your Cal.com username
- `EMAIL_FROM` - From email address (must be verified in Resend)
- `FRONTEND_URL` - URL of your frontend (for generating links)

Optional:
- `RELACE_API_KEY` - Relace API key for semantic code search
- `CALCOM_DEFAULT_EVENT_TYPE_ID` - Default event type for scheduling

### 3. Run the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Key Endpoints

### Assessments
- `POST /api/assessments` - Create new assessment
- `GET /api/assessments` - List all assessments
- `GET /api/assessments/{id}` - Get assessment details
- `POST /api/assessments/{id}/invite` - Invite candidate

### Candidate Flow
- `GET /api/start/{slug}` - Get start page details
- `POST /api/start/{slug}/begin` - Start assessment (creates repo)
- `POST /api/submit` - Submit assessment (requires "CONFIRM")

### Admin Review
- `GET /api/review/{candidate_assessment_id}` - Get review data
- `GET /api/diff` - Get diff between commits
- `POST /api/comments` - Add inline comment
- `POST /api/rank` - Save stack rank score
- `POST /api/ai/summary` - Generate AI analysis

### Follow-up
- `POST /api/followup/send` - Send interview scheduling email

## GitHub Integration

The platform uses a machine user token to:
1. Create private candidate repositories
2. Add/remove collaborators
3. Fetch diffs and commit history
4. Manage repository access

Make sure your GitHub token has:
- `repo` - Full control of private repositories
- `admin:repo_hook` - Full control of repository hooks (optional)
- `delete_repo` - Delete repositories (optional)

## Email Templates

The system sends automated emails for:
- **Assessment invitation** - When candidate is invited
- **Start confirmation** - When candidate starts assessment
- **Submission received** - When candidate submits
- **Follow-up** - Interview scheduling invitation

All emails are sent via Resend and use HTML templates defined in `email_service.py`.

## AI Analysis

The AI analysis feature:
1. Fetches code diffs from GitHub
2. Optionally uses Relace for semantic code search
3. Sends context to OpenRouter (GPT-4o-mini)
4. Generates structured evaluation with scores
5. Stores results in database

The AI evaluates:
- Code quality
- Functionality
- Best practices
- Documentation
- Creativity

## Error Handling

All endpoints include comprehensive error handling:
- Input validation via Pydantic models
- HTTP exceptions with descriptive messages
- Service-level error wrapping
- Database transaction safety

## Security

- All database operations use Row Level Security (RLS)
- Service role key used for admin operations
- Candidate access limited by RLS policies
- GitHub tokens stored securely in environment
- Email addresses validated before sending

## Deployment

### Railway

1. Create new project on Railway
2. Add FastAPI service
3. Set environment variables
4. Deploy from GitHub
5. Note the generated URL for frontend configuration

The service will automatically:
- Install dependencies from `requirements.txt`
- Start with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Scale based on traffic

## Development

### Adding New Endpoints

1. Create/update route file in `app/routes/`
2. Import and use service classes
3. Define Pydantic models for request/response
4. Include router in `app/main.py`
5. Test via Swagger UI

### Database Changes

1. Update schema in `/db/schema.sql`
2. Run migration in Supabase
3. Update `database_service.py` methods
4. Update RLS policies as needed

## Testing

```bash
# Run with test environment
TESTING=true uvicorn app.main:app --reload

# Or use pytest (if configured)
pytest
```

## Troubleshooting

### GitHub API Rate Limiting
- Use authenticated requests (token)
- Monitor rate limit headers
- Implement caching if needed

### Email Delivery Issues
- Verify domain in Resend
- Check SPF/DKIM records
- Test with real addresses

### Database Connection
- Verify Supabase URL and key
- Check network connectivity
- Ensure RLS policies are correct

### AI Analysis Fails
- Check OpenRouter API key
- Verify model availability
- Monitor token usage/costs

## License

Proprietary - AfterQuery Interview Platform