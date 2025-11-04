import os
import resend
from typing import Optional, Dict

class EmailService:
    """Service for sending emails via Resend."""
    
    def __init__(self):
        api_key = os.getenv("RESEND_API_KEY")
        if not api_key:
            raise ValueError("RESEND_API_KEY must be set")
        
        resend.api_key = api_key
        self.from_email = os.getenv("EMAIL_FROM", "noreply@yourdomain.com")
    
    def send_invite(
        self, 
        to_email: str, 
        candidate_name: Optional[str],
        assessment_title: str,
        start_url: str,
        start_deadline: str,
        complete_hours: int,
        custom_message: Optional[str] = None
    ) -> Dict:
        """
        Send an assessment invitation email to a candidate.
        """
        try:
            greeting = f"Hi {candidate_name}," if candidate_name else "Hello,"
            
            html_content = f"""
            <html>
                <body>
                    <h2>You've Been Invited to Complete a Coding Assessment</h2>
                    <p>{greeting}</p>
                    <p>You have been invited to complete the following assessment: <strong>{assessment_title}</strong></p>
                    {f'<p style="font-style: italic;">{custom_message}</p>' if custom_message else ''}
                    <p>You must start by: <strong>{start_deadline}</strong>. Once started, you have <strong>{complete_hours} hours</strong> to complete.</p>
                    <a href="{start_url}">Start Assessment</a>
                </body>
            </html>
            """
            
            response = resend.Emails.send({
                "from": self.from_email,
                "to": to_email,
                "subject": f"Invitation: {assessment_title}",
                "html": html_content
            })
            
            return response
        except Exception as e:
            raise Exception(f"Failed to send invite email: {str(e)}")
    
    def send_start_confirmation(
        self,
        to_email: str,
        candidate_name: Optional[str],
        assessment_title: str,
        repo_url: str,
        complete_deadline: str
    ) -> Dict:
        """
        Send confirmation email when candidate starts assessment.
        """
        try:
            greeting = f"Hi {candidate_name}," if candidate_name else "Hello,"
            
            html_content = f"""
            <html>
                <body>
                    <h2>Assessment Started: {assessment_title}</h2>
                    <p>{greeting}</p>
                    <p>Your repository is ready at <a href="{repo_url}">{repo_url}</a>. Your deadline is <strong>{complete_deadline}</strong>.</p>
                    <p>Good luck!</p>
                </body>
            </html>
            """
            
            response = resend.Emails.send({
                "from": self.from_email,
                "to": to_email,
                "subject": f"Assessment Started: {assessment_title}",
                "html": html_content
            })
            
            return response
        except Exception as e:
            raise Exception(f"Failed to send start confirmation: {str(e)}")
    
    def send_follow_up(
        self,
        to_email: str,
        candidate_name: Optional[str],
        assessment_title: str,
        booking_link: str,
        reviewer_name: Optional[str] = None
    ) -> Dict:
        """
        Send follow-up email with interview scheduling link.
        """
        try:
            greeting = f"Hi {candidate_name}," if candidate_name else "Hello,"
            reviewer_text = f" with {reviewer_name}" if reviewer_name else ""
            
            html_content = f"""
            <html>
                <body>
                    <h2>Next Steps for {assessment_title}</h2>
                    <p>{greeting}</p>
                    <p>We've reviewed your submission and would like to invite you to the next round{reviewer_text}. Please use the link below to schedule an interview.</p>
                    <a href="{booking_link}">Schedule Interview</a>
                </body>
            </html>
            """
            
            response = resend.Emails.send({
                "from": self.from_email,
                "to": to_email,
                "subject": f"Next Steps: {assessment_title}",
                "html": html_content
            })
            
            return response
        except Exception as e:
            raise Exception(f"Failed to send follow-up email: {str(e)}")
    
    def send_submission_received(
        self,
        to_email: str,
        candidate_name: Optional[str],
        assessment_title: str
    ) -> Dict:
        """Send confirmation that submission was received."""
        try:
            greeting = f"Hi {candidate_name}," if candidate_name else "Hello,"
            
            html_content = f"""
            <html>
                <body>
                    <h2>Submission Received: {assessment_title}</h2>
                    <p>{greeting}</p>
                    <p>We have successfully received your submission. Our team will review it and get back to you soon.</p>
                </body>
            </html>
            """
            
            response = resend.Emails.send({
                "from": self.from_email,
                "to": to_email,
                "subject": f"Submission Received: {assessment_title}",
                "html": html_content
            })
            
            return response
        except Exception as e:
            raise Exception(f"Failed to send submission confirmation: {str(e)}")

email_service = EmailService()

