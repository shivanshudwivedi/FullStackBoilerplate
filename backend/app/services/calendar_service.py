import os
import httpx
from typing import Optional, Dict, List

class CalendarService:
    """Service for calendar integration using Cal.com API."""
    
    def __init__(self):
        self.api_key = os.getenv("CALCOM_API_KEY")
        
        # API key is optional - we can still generate booking links without it
        self.has_api = bool(self.api_key)
        
        self.base_url = "https://api.cal.com/v1"
        self.default_event_slug = os.getenv("CALCOM_EVENT_SLUG", "30min")  # Event slug, not ID
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
        
        Args:
            candidate_name: Name of the candidate
            candidate_email: Email of the candidate
            assessment_title: Title of the assessment
            event_slug: Specific event slug (e.g., '30min', 'interview') - uses default if not provided
        
        Returns:
            Booking URL with pre-filled information
        
        Note:
            Cal.com URLs use slugs like 'https://cal.com/username/30min' not numeric IDs
        """
        try:
            import urllib.parse
            
            # Use provided slug or default
            slug = event_slug or self.default_event_slug
            
            # Cal.com booking link format: https://cal.com/username/event-slug
            base_link = f"https://cal.com/{self.booking_username}/{slug}"
            
            # Add query parameters for pre-filled data
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
        
        Returns:
            List of event types with id, title, slug, and length
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
                
                # Format for easy reading
                formatted = []
                for et in event_types:
                    formatted.append({
                        'id': et.get('id'),
                        'title': et.get('title'),
                        'slug': et.get('slug'),  # This is what you need for CALCOM_EVENT_SLUG!
                        'length': et.get('length'),
                        'url': f"https://cal.com/{self.booking_username}/{et.get('slug')}"
                    })
                
                return formatted
        except Exception as e:
            raise Exception(f"Failed to get event types: {str(e)}")
    
    async def get_availability(
        self,
        start_date: str,
        end_date: str,
        event_type_id: Optional[int] = None
    ) -> Dict:
        """
        Get availability for a date range.
        
        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            event_type_id: Optional event type ID
        
        Returns:
            Availability data
        """
        try:
            params = {
                "startTime": start_date,
                "endTime": end_date
            }
            
            if event_type_id:
                params["eventTypeId"] = event_type_id
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/availability",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    params=params
                )
                
                if response.status_code != 200:
                    raise Exception(f"Cal.com API error: {response.text}")
                
                return response.json()
        except Exception as e:
            raise Exception(f"Failed to get availability: {str(e)}")
    
    async def create_booking(
        self,
        event_type_id: int,
        start_time: str,
        attendee_name: str,
        attendee_email: str,
        notes: Optional[str] = None
    ) -> Dict:
        """
        Create a booking (programmatic scheduling).
        
        Args:
            event_type_id: Event type ID
            start_time: Start time in ISO format
            attendee_name: Name of attendee
            attendee_email: Email of attendee
            notes: Optional notes
        
        Returns:
            Booking data
        """
        try:
            payload = {
                "eventTypeId": event_type_id,
                "start": start_time,
                "responses": {
                    "name": attendee_name,
                    "email": attendee_email,
                    "notes": notes or ""
                }
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/bookings",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload
                )
                
                if response.status_code not in [200, 201]:
                    raise Exception(f"Cal.com API error: {response.text}")
                
                return response.json()
        except Exception as e:
            raise Exception(f"Failed to create booking: {str(e)}")
    
    async def get_bookings(self, status: Optional[str] = None) -> List[Dict]:
        """
        Get list of bookings.
        
        Args:
            status: Optional filter by status (upcoming, past, cancelled)
        
        Returns:
            List of bookings
        """
        try:
            params = {}
            if status:
                params["status"] = status
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/bookings",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    params=params
                )
                
                if response.status_code != 200:
                    raise Exception(f"Cal.com API error: {response.text}")
                
                data = response.json()
                return data.get('bookings', [])
        except Exception as e:
            raise Exception(f"Failed to get bookings: {str(e)}")

# Singleton instance
calendar_service = CalendarService()

