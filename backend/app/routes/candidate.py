from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from ..services.github_service import github_service
from ..services.database_service import database_service
from ..services.email_service import email_service

router = APIRouter()

class SubmissionRequest(BaseModel):
    candidate_assessment_id: str  # Can be UUID or slug
    confirmation_text: str  # Must be "CONFIRM"

@router.get("/start/{start_slug}")
def get_start_page_details(start_slug: str):
    """
    Provides the necessary details for the candidate's start page.
    """
    try:
        # Get candidate assessment
        ca = database_service.get_candidate_assessment_by_slug(start_slug)
        if not ca:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Check if already started or expired
        if ca['status'] == 'started':
            return {
                "status": "already_started",
                "message": "You have already started this assessment",
                "start_deadline_ts": ca['start_deadline_ts'],
                "complete_deadline_ts": ca.get('complete_deadline_ts')
            }
        
        if ca['status'] in ['submitted', 'expired']:
            return {
                "status": ca['status'],
                "message": f"This assessment is {ca['status']}"
            }
        
        # Check if start deadline has passed
        start_deadline = datetime.fromisoformat(ca['start_deadline_ts'].replace('Z', '+00:00'))
        if datetime.utcnow() > start_deadline.replace(tzinfo=None):
            # Mark as expired
            database_service.update_candidate_assessment(ca['id'], {
                "status": "expired"
            })
            raise HTTPException(status_code=403, detail="Start deadline has passed")
        
        assessment = ca['assessments']
        
        return {
            "title": assessment['title'],
            "description": assessment.get('description'),
            "instructions_md": assessment.get('instructions_md'),
            "start_deadline_ts": ca['start_deadline_ts'],
            "complete_within_hours": assessment['complete_within_hours'],
            "status": ca['status']
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start/{start_slug}/begin")
def begin_assessment(start_slug: str):
    """
    Handles the action of a candidate starting an assessment.
    """
    try:
        # Get candidate assessment
        ca = database_service.get_candidate_assessment_by_slug(start_slug)
        if not ca:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Check if already started
        if ca['status'] != 'invited':
            raise HTTPException(status_code=400, detail=f"Assessment is already {ca['status']}")
        
        # Check start deadline
        start_deadline = datetime.fromisoformat(ca['start_deadline_ts'].replace('Z', '+00:00'))
        if datetime.utcnow() > start_deadline.replace(tzinfo=None):
            raise HTTPException(status_code=403, detail="Start deadline has passed")
        
        assessment = ca['assessments']
        candidate = ca['candidates']
        
        # Get latest SHA from seed repo
        seed_latest_sha = github_service.get_latest_main_sha(assessment['seed_repo_url'])
        
        # Generate unique repo name
        repo_name = f"{start_slug}-assessment"
        
        # Create private candidate repo
        # Returns dict with repo_full_name and initial_commit_sha from the NEW repo
        repo_info = github_service.create_private_repo_from_seed(
            seed_repo_url=assessment['seed_repo_url'],
            new_repo_name=repo_name,
            pinned_sha=seed_latest_sha
        )
        
        repo_full_name = repo_info['repo_full_name']
        initial_commit_sha = repo_info['initial_commit_sha']
        
        # Add candidate as collaborator if GitHub username provided
        collaborator_added = False
        github_username = candidate.get('github_username', '').strip()
        
        if github_username:
            # Validate username exists before attempting to add
            if github_service.validate_username(github_username):
                try:
                    github_service.add_collaborator(
                        repo_full_name=repo_full_name,
                        username=github_username,
                        permission="push"
                    )
                    collaborator_added = True
                    print(f"Successfully added '{github_username}' as collaborator")
                except Exception as e:
                    print(f"Warning: Could not add collaborator '{github_username}': {str(e)}")
            else:
                print(f"Warning: GitHub username '{github_username}' does not exist. Skipping collaborator add.")
        
        # Calculate completion deadline
        complete_deadline = datetime.utcnow() + timedelta(hours=assessment['complete_within_hours'])
        
        # Update candidate assessment
        # IMPORTANT: Use initial_commit_sha from the NEW repo, not the seed repo!
        database_service.update_candidate_assessment(ca['id'], {
            "status": "started",
            "pinned_seed_sha": initial_commit_sha,  # SHA from the NEW repo!
            "complete_deadline_ts": complete_deadline.isoformat()
        })
        
        # Create repo record
        database_service.create_repo({
            "candidate_assessment_id": ca['id'],
            "github_repo_full_name": repo_full_name,
            "latest_sha": initial_commit_sha  # SHA from the NEW repo!
        })
        
        # Log event
        database_service.create_event({
            "candidate_assessment_id": ca['id'],
            "type": "assessment_started",
            "payload": {
                "repo_full_name": repo_full_name,
                "started_at": datetime.utcnow().isoformat()
            }
        })
        
        # Send confirmation email
        repo_url = f"https://github.com/{repo_full_name}"
        email_service.send_start_confirmation(
            to_email=candidate['email'],
            candidate_name=candidate.get('name'),
            assessment_title=assessment['title'],
            repo_url=repo_url,
            complete_deadline=complete_deadline.isoformat()
        )
        
        message = "Assessment started successfully! Check your email for details."
        if not collaborator_added and candidate.get('github_username'):
            message += " Note: Could not add you as collaborator. Please contact the admin for repository access."
        
        return {
            "status": "started",
            "github_repo_full_name": repo_full_name,
            "repo_url": repo_url,
            "pinned_seed_sha": initial_commit_sha,  # Fixed: use initial_commit_sha
            "complete_deadline_ts": complete_deadline.isoformat(),
            "clone_cmd": f"git clone https://github.com/{repo_full_name}.git",
            "collaborator_added": collaborator_added,
            "message": message
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit")
def submit_assessment(req: SubmissionRequest):
    """
    Finalizes the assessment submission for a candidate.
    Accepts either candidate_assessment UUID or start_slug.
    """
    try:
        # Validate confirmation text
        if req.confirmation_text != "CONFIRM":
            raise HTTPException(status_code=400, detail="You must type CONFIRM to submit")
        
        # Get candidate assessment (try by slug first, then by UUID)
        ca = None
        
        # Check if it's a UUID (contains hyphens) or a slug (short alphanumeric)
        if '-' in req.candidate_assessment_id:
            # Likely a UUID
            ca = database_service.get_candidate_assessment(req.candidate_assessment_id)
        else:
            # Likely a slug
            ca = database_service.get_candidate_assessment_by_slug(req.candidate_assessment_id)
        
        if not ca:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Check if already submitted
        if ca['status'] == 'submitted':
            raise HTTPException(status_code=400, detail="Assessment already submitted")
        
        if ca['status'] != 'started':
            raise HTTPException(status_code=400, detail="Assessment not started")
        
        # Use the actual UUID from the candidate assessment
        ca_id = ca['id']
        
        # Get repo info
        repo = database_service.get_repo_by_candidate_assessment(ca_id)
        if not repo:
            raise HTTPException(status_code=404, detail="Repository not found")
        
        candidate = ca['candidates']
        
        # Get final commit SHA
        final_sha = github_service.get_head_sha(repo['github_repo_full_name'])
        
        # Remove collaborator access (if they were added as collaborator)
        if candidate.get('github_username') and candidate['github_username'].strip():
            try:
                github_service.remove_collaborator(
                    repo_full_name=repo['github_repo_full_name'],
                    username=candidate['github_username'].strip()
                )
            except Exception as e:
                # Log but don't fail - they might not have been added as collaborator
                print(f"Warning: Could not remove collaborator '{candidate['github_username']}': {str(e)}")
        
        # Make repo private (it should already be, but ensure)
        github_service.set_repo_private(repo['github_repo_full_name'], private=True)
        
        # Optionally archive the repo
        # github_service.archive_repo(repo['github_repo_full_name'])
        
        # Update repo record
        database_service.update_repo(repo['id'], {
            "latest_sha": final_sha,
            "is_archived": False  # Set to True if archiving
        })
        
        # Update candidate assessment
        database_service.update_candidate_assessment(ca_id, {
            "status": "submitted",
            "submitted_at": datetime.utcnow().isoformat()
        })
        
        # Log event
        database_service.create_event({
            "candidate_assessment_id": ca_id,
            "type": "assessment_submitted",
            "payload": {
                "final_sha": final_sha,
                "submitted_at": datetime.utcnow().isoformat()
            }
        })
        
        # Send confirmation email
        assessment = ca['assessments']
        email_service.send_submission_received(
            to_email=candidate['email'],
            candidate_name=candidate.get('name'),
            assessment_title=assessment['title']
        )
        
        return {
            "status": "submitted",
            "final_sha": final_sha,
            "submitted_at": datetime.utcnow().isoformat(),
            "message": "Submission successful! Your access has been revoked."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
