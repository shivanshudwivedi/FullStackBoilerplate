import os
import httpx
from typing import Optional, Dict, List

class CalendarService:
    """Service for calendar integration using Cal.com API."""
    
    def __init__(self):
        self.api_key = os.getenv("CALCOM_API_KEY")
        self.has_api = bool(self.api_key)
        self.base_url = "https://api.cal.com/v1"
        self.default_event_slug = os.getenv("CALCOM_EVENT_SLUG", "30min")
        self.booking_username = os.getenv("CALCOM_USERNAME", "your-username")
    
    async def generate_booking_link(
        self,
        candidate_name: Optional[str] = None,
        candidate_email: Optional[str] = None,
        assessment_title: Optional[str] = None,
        event_slug: Optional[str] = None
    ) -> str:
        """
        Generate a Cal.com booking link for a candidate.
        """
        try:
            import urllib.parse
            slug = event_slug or self.default_event_slug
            base_link = f"https://cal.com/{self.booking_username}/{slug}"
            
            params = {}
            if candidate_name:
                params['name'] = candidate_name
            if candidate_email:
                params['email'] = candidate_email
            if assessment_title:
                params['notes'] = f"Re: {assessment_title}"
            
            if params:
                query_string = urllib.parse.urlencode(params)
                base_link += f"?{query_string}"
            
            return base_link
        except Exception as e:
            raise Exception(f"Failed to generate booking link: {str(e)}")
    
    async def get_event_types(self) -> List[Dict]:
        """
        Get available event types from Cal.com.
        """
        if not self.has_api:
            raise Exception("Cal.com API key is required to fetch event types")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/event-types",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code != 200:
                    raise Exception(f"Cal.com API error: {response.text}")
                
                data = response.json()
                event_types = data.get('event_types', [])
                
                formatted = []
                for et in event_types:
                    formatted.append({
                        'id': et.get('id'),
                        'title': et.get('title'),
                        'slug': et.get('slug'),
                        'length': et.get('length'),
                        'url': f"https://cal.com/{self.booking_username}/{et.get('slug')}"
                    })
                
                return formatted
        except Exception as e:
            raise Exception(f"Failed to get event types: {str(e)}")

calendar_service = CalendarService()

