from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timedelta
from ..services.github_service import github_service
from ..services.database_service import database_service
from ..services.email_service import email_service
import os


router = APIRouter()

class CreateAssessmentRequest(BaseModel):
    title: str
    description: Optional[str] = None
    instructions_md: Optional[str] = None
    seed_repo_url: str
    email_template: Optional[str] = None
    start_by_hours: int
    complete_within_hours: int

class InviteCandidateRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    github_username: str

@router.post("/assessments")
def create_assessment(req: CreateAssessmentRequest):
    """
    Creates an assessment.
    """
    try:
        # Get the latest SHA from the seed repository
        main_sha = github_service.get_latest_main_sha(req.seed_repo_url)
        
        # Prepare assessment data
        assessment_data = {
            "title": req.title,
            "description": req.description,
            "instructions_md": req.instructions_md,
            "seed_repo_url": req.seed_repo_url,
            "seed_main_sha": main_sha,
            "start_by_hours": req.start_by_hours,
            "complete_within_hours": req.complete_within_hours,
            "email_template": req.email_template,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Insert into database
        assessment_id = database_service.create_assessment(assessment_data)
        
        return {
            "assessment_id": assessment_id,
            "seed_main_sha": main_sha,
            "message": "Assessment created successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/assessments/{assessment_id}/invite")
def invite_candidate(assessment_id: str, req: InviteCandidateRequest):
    """
    Invites a candidate to an assessment.
    """
    try:
        # Get the assessment
        assessment = database_service.get_assessment(assessment_id)
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Check if candidate exists, create if not
        candidate = database_service.get_candidate_by_email(req.email)
        if not candidate:
            candidate_data = {
                "email": req.email,
                "name": req.name,
                "github_username": req.github_username,
                "status": "invited"
            }
            candidate_id = database_service.create_candidate(candidate_data)
        else:
            candidate_id = candidate['id']
        
        # Calculate deadlines
        start_deadline = database_service.calculate_deadline(assessment['start_by_hours'])
        
        # Create candidate assessment
        ca_data = {
            "assessment_id": assessment_id,
            "candidate_id": candidate_id,
            "start_deadline_ts": start_deadline,
            "status": "invited"
        }
        ca_id = database_service.create_candidate_assessment(ca_data)
        
        # Get the created candidate assessment to get the slug
        ca = database_service.get_candidate_assessment(ca_id)
        
        # Build start URL
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        start_url = f"{frontend_url}/start/{ca['start_slug']}"
        
        # Send invite email
        email_service.send_invite(
            to_email=req.email,
            candidate_name=req.name,
            assessment_title=assessment['title'],
            start_url=start_url,
            start_deadline=start_deadline,
            complete_hours=assessment['complete_within_hours'],
            custom_message=assessment.get('email_template')
        )
        
        return {
            "status": "invite_sent",
            "candidate_assessment_id": ca_id,
            "start_url": start_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/assessments")
def list_assessments():
    """
    List all assessments.
    """
    try:
        assessments = database_service.list_assessments()
        return {"assessments": assessments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/assessments/{assessment_id}")
def get_assessment(assessment_id: str):
    """
    Get details of a specific assessment.
    """
    try:
        assessment = database_service.get_assessment(assessment_id)
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Get candidates for this assessment
        candidates = database_service.list_candidate_assessments_for_assessment(assessment_id)
        
        return {
            "assessment": assessment,
            "candidates": candidates,
            "total_candidates": len(candidates)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/assessments/{assessment_id}/preview")
def get_assessment_preview(assessment_id: str):
    """
    Get the data needed to render a preview of the candidate start page.
    """
    try:
        assessment = database_service.get_assessment(assessment_id)
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")

        # Mock the data structure of the /start/{slug} endpoint
        return {
            "title": assessment['title'],
            "description": assessment.get('description'),
            "instructions_md": assessment.get('instructions_md'),
            "start_deadline_ts": (datetime.utcnow() + timedelta(hours=assessment['start_by_hours'])).isoformat(),
            "complete_within_hours": assessment['complete_within_hours'],
            "status": "preview"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
