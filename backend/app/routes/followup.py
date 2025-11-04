from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.calendar_service import calendar_service
from ..services.email_service import email_service
from ..services.database_service import database_service

router = APIRouter()

class FollowUpRequest(BaseModel):
    candidate_assessment_id: str

@router.post("/followup/send")
async def send_follow_up(req: FollowUpRequest):
    """
    Generates a booking link and sends a follow-up email to the candidate.
    """
    try:
        # Get candidate assessment
        ca = database_service.get_candidate_assessment(req.candidate_assessment_id)
        if not ca:
            raise HTTPException(status_code=404, detail="Candidate assessment not found")
        
        candidate = ca['candidates']
        assessment = ca['assessments']
        
        # Check if assessment is submitted
        if ca['status'] != 'submitted':
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot send follow-up for assessment with status: {ca['status']}"
            )
        
        # Generate Cal.com booking link
        booking_link = await calendar_service.generate_booking_link(
            candidate_name=candidate.get('name'),
            candidate_email=candidate['email'],
            assessment_title=assessment['title']
        )
        
        # Send follow-up email
        email_service.send_follow_up(
            to_email=candidate['email'],
            candidate_name=candidate.get('name'),
            assessment_title=assessment['title'],
            booking_link=booking_link
        )
        
        # Log event
        database_service.create_event({
            "candidate_assessment_id": req.candidate_assessment_id,
            "type": "follow_up_sent",
            "payload": {
                "booking_link": booking_link
            }
        })
        
        return {
            "status": "follow_up_sent",
            "booking_link": booking_link,
            "message": "Follow-up email sent successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
