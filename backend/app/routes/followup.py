from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.calendar_service import calendar_service
from ..services.email_service import email_service
from ..services.database_service import database_service

router = APIRouter()

class FollowUpRequest(BaseModel):
    candidate_assessment_id: str


@router.get("/calcom/event-types")
async def list_event_types():
    """
    List all available Cal.com event types with their slugs.
    This helps you find the correct CALCOM_EVENT_SLUG for your .env file.
    """
    try:
        event_types = await calendar_service.get_event_types()
        return {
            "event_types": event_types,
            "message": "Use the 'slug' field for CALCOM_EVENT_SLUG in your .env file"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/followup/send")
def send_follow_up(req: FollowUpRequest):
    try:
        # Get candidate assessment
        ca = database_service.get_candidate_assessment(req.candidate_assessment_id)
        if not ca:
            raise HTTPException(status_code=404, detail="Candidate assessment not found")

        candidate = ca['candidates']
        assessment = ca['assessments']

        # Get email template from settings
        template_setting = database_service.get_setting('follow_up_email_template')
        if not template_setting or not template_setting.get('value'):
            raise HTTPException(status_code=500, detail="Follow-up email template not set")

        email_body = template_setting['value'].replace('[Candidate Name]', candidate.get('name', 'there'))

        email_service.send_email(
            to_email=candidate['email'],
            subject=f"Follow-up on your {assessment['title']} assessment",
            body=email_body
        )

        return {"status": "success", "message": "Follow-up email sent."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
