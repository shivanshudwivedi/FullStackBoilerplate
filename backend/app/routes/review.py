from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from ..services.github_service import github_service
from ..services.database_service import database_service
from ..services.ai_service import ai_service

router = APIRouter()

class CommentRequest(BaseModel):
    candidate_assessment_id: str
    file_path: str
    line_start: int
    line_end: int
    body_md: str

class RankRequest(BaseModel):
    candidate_assessment_id: str
    stack_rank_score: int = Field(..., ge=0, le=100)
    manual_notes_md: Optional[str] = None

class AISummaryRequest(BaseModel):
    candidate_assessment_id: str
    prompt: Optional[str] = None

class AICommentRequest(BaseModel):
    code_block: str
    prompt: str

@router.get("/review/{candidate_assessment_id}")
def get_review_details(candidate_assessment_id: str):
    """
    Fetches the data needed for the admin review page.
    """
    try:
        # Get candidate assessment with related data
        ca = database_service.get_candidate_assessment(candidate_assessment_id)
        if not ca:
            raise HTTPException(status_code=404, detail="Candidate assessment not found")
        
        # Get repo
        repo = database_service.get_repo_by_candidate_assessment(candidate_assessment_id)
        if not repo:
            raise HTTPException(status_code=404, detail="Repository not found")
        
        print(f"DEBUG review endpoint:")
        print(f"  Candidate Assessment ID: {candidate_assessment_id}")
        print(f"  Repo full name: {repo.get('github_repo_full_name')}")
        print(f"  Pinned seed SHA: {ca.get('pinned_seed_sha')}")
        print(f"  Latest SHA: {repo.get('latest_sha')}")
        
        # Get diff data
        diff_data = None
        if ca.get('pinned_seed_sha') and repo.get('latest_sha'):
            try:
                diff_data = github_service.compare_commits(
                    repo_full_name=repo['github_repo_full_name'],
                    base_sha=ca['pinned_seed_sha'],
                    head_sha=repo['latest_sha']
                )
            except Exception as diff_error:
                print(f"Warning: Could not fetch diff: {str(diff_error)}")
                # Continue without diff data
        
        # Get existing review (may be None if not created yet)
        review = database_service.get_review(candidate_assessment_id)
        
        # Get comments (empty list if none)
        try:
            comments = database_service.list_comments(candidate_assessment_id) or []
        except Exception as e:
            print(f"Warning: Could not fetch comments: {str(e)}")
            comments = []
        
        # Get events (empty list if none)
        try:
            events = database_service.list_events(candidate_assessment_id) or []
        except Exception as e:
            print(f"Warning: Could not fetch events: {str(e)}")
            events = []
        
        return {
            "candidate": ca['candidates'],
            "assessment": ca['assessments'],
            "candidate_assessment": {
                "id": ca['id'],
                "status": ca['status'],
                "started_at": ca.get('created_at'),
                "submitted_at": ca.get('submitted_at'),
                "pinned_seed_sha": ca.get('pinned_seed_sha'),
                "start_deadline_ts": ca.get('start_deadline_ts'),
                "complete_deadline_ts": ca.get('complete_deadline_ts')
            },
            "repo": {
                "full_name": repo['github_repo_full_name'],
                "url": f"https://github.com/{repo['github_repo_full_name']}",
                "latest_sha": repo['latest_sha'],
                "is_archived": repo.get('is_archived', False)
            },
            "diff": diff_data,
            "review": review,
            "comments": comments,
            "events": events
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"ERROR in get_review_details: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/diff")
def get_diff(repo_full_name: str, base_sha: str, head_sha: str):
    """
    Fetches the unified diff between two commits.
    """
    try:
        diff_data = github_service.compare_commits(
            repo_full_name=repo_full_name,
            base_sha=base_sha,
            head_sha=head_sha
        )
        return diff_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/comments")
def post_comment(req: CommentRequest):
    """
    Saves a comment on a diff.
    """
    try:
        comment_id = database_service.create_comment({
            "candidate_assessment_id": req.candidate_assessment_id,
            "file_path": req.file_path,
            "line_start": req.line_start,
            "line_end": req.line_end,
            "body_md": req.body_md
        })
        
        # Log event
        database_service.create_event({
            "candidate_assessment_id": req.candidate_assessment_id,
            "type": "comment_added",
            "payload": {
                "file_path": req.file_path,
                "line_range": f"{req.line_start}-{req.line_end}"
            }
        })
        
        return {
            "comment_id": comment_id,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rank")
def rank_submission(req: RankRequest):
    """
    Saves a stack rank score and notes for a submission.
    """
    try:
        review_id = database_service.create_or_update_review({
            "candidate_assessment_id": req.candidate_assessment_id,
            "stack_rank_score": req.stack_rank_score,
            "manual_notes_md": req.manual_notes_md
        })
        
        # Log event
        database_service.create_event({
            "candidate_assessment_id": req.candidate_assessment_id,
            "type": "ranked",
            "payload": {
                "stack_rank_score": req.stack_rank_score
            }
        })
        
        return {
            "review_id": review_id,
            "stack_rank_score": req.stack_rank_score,
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/summary")
async def get_ai_summary(req: AISummaryRequest):
    """
    Generates and saves an AI-powered summary of the candidate's code.
    """
    try:
        # Get candidate assessment and repo
        ca = database_service.get_candidate_assessment(req.candidate_assessment_id)
        if not ca:
            raise HTTPException(status_code=404, detail="Candidate assessment not found")
        
        repo = database_service.get_repo_by_candidate_assessment(req.candidate_assessment_id)
        if not repo:
            raise HTTPException(status_code=404, detail="Repository not found")
        
        # Get diff data
        if not ca.get('pinned_seed_sha') or not repo.get('latest_sha'):
            raise HTTPException(status_code=400, detail="Cannot analyze: missing commit information")
        
        diff_data = github_service.compare_commits(
            repo_full_name=repo['github_repo_full_name'],
            base_sha=ca['pinned_seed_sha'],
            head_sha=repo['latest_sha']
        )
        
        # Generate AI analysis
        analysis = await ai_service.analyze_code(
            repo_full_name=repo['github_repo_full_name'],
            base_sha=ca['pinned_seed_sha'],
            head_sha=repo['latest_sha'],
            diff_data=diff_data,
            rubric=req.prompt
        )
        
        # Save to database
        review_id = database_service.create_or_update_review({
            "candidate_assessment_id": req.candidate_assessment_id,
            "ai_summary_md": analysis['ai_summary_md'],
            "auto_score": analysis['auto_score']
        })
        
        # Log event
        database_service.create_event({
            "candidate_assessment_id": req.candidate_assessment_id,
            "type": "ai_analysis_generated",
            "payload": {
                "auto_score": analysis['auto_score']
            }
        })
        
        return {
            "review_id": review_id,
            "ai_summary_md": analysis['ai_summary_md'],
            "auto_score": analysis['auto_score'],
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/generate-comment")
async def generate_ai_comment(req: AICommentRequest):
    """
    Generates an AI comment for a specific block of code.
    """
    try:
        comment = await ai_service.generate_code_comment(
            code_block=req.code_block,
            prompt=req.prompt
        )
        return {"comment": comment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
