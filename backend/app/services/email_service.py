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
        
        Args:
            to_email: Candidate's email
            candidate_name: Candidate's name
            assessment_title: Title of the assessment
            start_url: URL to start the assessment
            start_deadline: Deadline to start (ISO format)
            complete_hours: Hours allowed to complete once started
            custom_message: Optional custom message from admin
        
        Returns:
            Response from Resend API
        """
        try:
            greeting = f"Hi {candidate_name}," if candidate_name else "Hello,"
            
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>You've Been Invited to Complete a Coding Assessment</h2>
                    <p>{greeting}</p>
                    <p>You have been invited to complete the following assessment:</p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">{assessment_title}</h3>
                        {f'<p style="font-style: italic;">{custom_message}</p>' if custom_message else ''}
                    </div>
                    
                    <p><strong>Important Details:</strong></p>
                    <ul>
                        <li>You must start by: <strong>{start_deadline}</strong></li>
                        <li>Once started, you have <strong>{complete_hours} hours</strong> to complete</li>
                        <li>You will receive a private GitHub repository to work in</li>
                    </ul>
                    
                    <div style="margin: 30px 0;">
                        <a href="{start_url}" 
                           style="background-color: #0070f3; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Start Assessment
                        </a>
                    </div>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #0070f3;">{start_url}</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 12px; color: #666;">
                        This is an automated message. Please do not reply to this email.
                    </p>
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
        
        Args:
            to_email: Candidate's email
            candidate_name: Candidate's name
            assessment_title: Title of the assessment
            repo_url: URL of their GitHub repository
            complete_deadline: Deadline to complete (ISO format)
        """
        try:
            greeting = f"Hi {candidate_name}," if candidate_name else "Hello,"
            
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Assessment Started Successfully!</h2>
                    <p>{greeting}</p>
                    <p>You have successfully started: <strong>{assessment_title}</strong></p>
                    
                    <div style="background-color: #f0f9ff; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0070f3;">
                        <p><strong>Your Repository:</strong></p>
                        <p><a href="{repo_url}" style="color: #0070f3; word-break: break-all;">{repo_url}</a></p>
                        <p><strong>Deadline:</strong> {complete_deadline}</p>
                    </div>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ol>
                        <li>Clone your repository</li>
                        <li>Complete the assignment</li>
                        <li>Push your changes</li>
                        <li>Submit when ready</li>
                    </ol>
                    
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
        
        Args:
            to_email: Candidate's email
            candidate_name: Candidate's name
            assessment_title: Title of the assessment
            booking_link: Cal.com booking link
            reviewer_name: Optional name of the reviewer
        """
        try:
            greeting = f"Hi {candidate_name}," if candidate_name else "Hello,"
            reviewer_text = f" with {reviewer_name}" if reviewer_name else ""
            
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Great Work! Let's Schedule a Follow-Up</h2>
                    <p>{greeting}</p>
                    <p>Thank you for completing <strong>{assessment_title}</strong>!</p>
                    <p>We've reviewed your submission and would like to invite you to the next round{reviewer_text}.</p>
                    
                    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #22c55e;">
                        <p><strong>Schedule Your Interview:</strong></p>
                        <p>Please use the link below to choose a time that works best for you.</p>
                    </div>
                    
                    <div style="margin: 30px 0;">
                        <a href="{booking_link}" 
                           style="background-color: #22c55e; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 5px; display: inline-block;">
                            Schedule Interview
                        </a>
                    </div>
                    
                    <p>Or copy and paste this link:</p>
                    <p style="word-break: break-all; color: #0070f3;">{booking_link}</p>
                    
                    <p>We look forward to speaking with you!</p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
                    <p style="font-size: 12px; color: #666;">
                        This is an automated message. If you have questions, please reply to this email.
                    </p>
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
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Submission Received!</h2>
                    <p>{greeting}</p>
                    <p>We have successfully received your submission for <strong>{assessment_title}</strong>.</p>
                    
                    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p>✓ Your work has been submitted and is now under review.</p>
                    </div>
                    
                    <p>Our team will review your submission and get back to you soon.</p>
                    <p>Thank you for your time and effort!</p>
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

# Singleton instance
email_service = EmailService()

