from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from ..database import supabase
import secrets
import string

class DatabaseService:
    """Service for all database operations using Supabase."""
    
    def __init__(self):
        self.db = supabase
    
    # ==================== ASSESSMENTS ====================
    
    def create_assessment(self, assessment_data: Dict) -> str:
        """Create a new assessment and return its ID."""
        try:
            result = self.db.table('assessments').insert(assessment_data).execute()
            return result.data[0]['id']
        except Exception as e:
            raise Exception(f"Failed to create assessment: {str(e)}")
    
    def get_assessment(self, assessment_id: str) -> Optional[Dict]:
        """Get assessment by ID."""
        try:
            result = self.db.table('assessments').select('*').eq('id', assessment_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            raise Exception(f"Failed to get assessment: {str(e)}")
    
    def list_assessments(self, created_by: Optional[str] = None) -> List[Dict]:
        """List all assessments, optionally filtered by creator."""
        try:
            query = self.db.table('assessments').select('*')
            if created_by:
                query = query.eq('created_by', created_by)
            result = query.order('created_at', desc=True).execute()
            return result.data
        except Exception as e:
            raise Exception(f"Failed to list assessments: {str(e)}")
    
    def update_assessment(self, assessment_id: str, updates: Dict) -> Dict:
        """Update an assessment."""
        try:
            result = self.db.table('assessments').update(updates).eq('id', assessment_id).execute()
            return result.data[0]
        except Exception as e:
            raise Exception(f"Failed to update assessment: {str(e)}")
    
    # ==================== CANDIDATES ====================
    
    def create_candidate(self, candidate_data: Dict) -> str:
        """Create a new candidate and return their ID."""
        try:
            result = self.db.table('candidates').insert(candidate_data).execute()
            return result.data[0]['id']
        except Exception as e:
            raise Exception(f"Failed to create candidate: {str(e)}")
    
    def get_candidate(self, candidate_id: str) -> Optional[Dict]:
        """Get candidate by ID."""
        try:
            result = self.db.table('candidates').select('*').eq('id', candidate_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            raise Exception(f"Failed to get candidate: {str(e)}")
    
    def get_candidate_by_email(self, email: str) -> Optional[Dict]:
        """Get candidate by email."""
        try:
            result = self.db.table('candidates').select('*').eq('email', email).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            raise Exception(f"Failed to get candidate by email: {str(e)}")
    
    # ==================== CANDIDATE ASSESSMENTS ====================
    
    def create_candidate_assessment(self, data: Dict) -> str:
        """Create a candidate assessment and return its ID."""
        try:
            # Generate unique slug
            slug = self._generate_slug()
            data['start_slug'] = slug
            
            result = self.db.table('candidate_assessments').insert(data).execute()
            return result.data[0]['id']
        except Exception as e:
            raise Exception(f"Failed to create candidate assessment: {str(e)}")
    
    def get_candidate_assessment(self, ca_id: str) -> Optional[Dict]:
        """Get candidate assessment by ID with joined data."""
        try:
            result = self.db.table('candidate_assessments')\
                .select('*, assessments(*), candidates(*)')\
                .eq('id', ca_id)\
                .execute()
            return result.data[0] if result.data else None
        except Exception as e:
            raise Exception(f"Failed to get candidate assessment: {str(e)}")
    
    def get_candidate_assessment_by_slug(self, slug: str) -> Optional[Dict]:
        """Get candidate assessment by start slug."""
        try:
            result = self.db.table('candidate_assessments')\
                .select('*, assessments(*), candidates(*)')\
                .eq('start_slug', slug)\
                .execute()
            return result.data[0] if result.data else None
        except Exception as e:
            raise Exception(f"Failed to get candidate assessment by slug: {str(e)}")
    
    def update_candidate_assessment(self, ca_id: str, updates: Dict) -> Dict:
        """Update a candidate assessment."""
        try:
            result = self.db.table('candidate_assessments')\
                .update(updates)\
                .eq('id', ca_id)\
                .execute()
            return result.data[0]
        except Exception as e:
            raise Exception(f"Failed to update candidate assessment: {str(e)}")
    
    def list_candidate_assessments_for_assessment(self, assessment_id: str) -> List[Dict]:
        """List all candidate assessments for a given assessment."""
        try:
            result = self.db.table('candidate_assessments')\
                .select('*, candidates(*)')\
                .eq('assessment_id', assessment_id)\
                .order('created_at', desc=True)\
                .execute()
            return result.data
        except Exception as e:
            raise Exception(f"Failed to list candidate assessments: {str(e)}")
    
    # ==================== REPOS ====================
    
    def create_repo(self, repo_data: Dict) -> str:
        """Create a repo record and return its ID."""
        try:
            result = self.db.table('repos').insert(repo_data).execute()
            return result.data[0]['id']
        except Exception as e:
            raise Exception(f"Failed to create repo: {str(e)}")
    
    def get_repo_by_candidate_assessment(self, ca_id: str) -> Optional[Dict]:
        """Get repo by candidate assessment ID."""
        try:
            result = self.db.table('repos')\
                .select('*')\
                .eq('candidate_assessment_id', ca_id)\
                .execute()
            return result.data[0] if result.data else None
        except Exception as e:
            raise Exception(f"Failed to get repo: {str(e)}")
    
    def update_repo(self, repo_id: str, updates: Dict) -> Dict:
        """Update a repo record."""
        try:
            result = self.db.table('repos').update(updates).eq('id', repo_id).execute()
            return result.data[0]
        except Exception as e:
            raise Exception(f"Failed to update repo: {str(e)}")
    
    # ==================== REVIEWS ====================
    
    def create_or_update_review(self, review_data: Dict) -> str:
        """Create or update a review."""
        try:
            ca_id = review_data.get('candidate_assessment_id')
            
            # Check if review exists
            existing = self.db.table('reviews')\
                .select('*')\
                .eq('candidate_assessment_id', ca_id)\
                .execute()
            
            if existing.data:
                # Update existing
                result = self.db.table('reviews')\
                    .update(review_data)\
                    .eq('candidate_assessment_id', ca_id)\
                    .execute()
            else:
                # Create new
                result = self.db.table('reviews').insert(review_data).execute()
            
            return result.data[0]['id']
        except Exception as e:
            raise Exception(f"Failed to create/update review: {str(e)}")
    
    def get_review(self, ca_id: str) -> Optional[Dict]:
        """Get review for a candidate assessment."""
        try:
            result = self.db.table('reviews')\
                .select('*')\
                .eq('candidate_assessment_id', ca_id)\
                .execute()
            return result.data[0] if result.data else None
        except Exception as e:
            raise Exception(f"Failed to get review: {str(e)}")
    
    # ==================== COMMENTS ====================
    
    def create_comment(self, comment_data: Dict) -> str:
        """Create a comment and return its ID."""
        try:
            result = self.db.table('comments').insert(comment_data).execute()
            return result.data[0]['id']
        except Exception as e:
            raise Exception(f"Failed to create comment: {str(e)}")
    
    def list_comments(self, ca_id: str) -> List[Dict]:
        """List all comments for a candidate assessment."""
        try:
            result = self.db.table('comments')\
                .select('*')\
                .eq('candidate_assessment_id', ca_id)\
                .order('created_at', desc=False)\
                .execute()
            return result.data
        except Exception as e:
            raise Exception(f"Failed to list comments: {str(e)}")
    
    # ==================== EVENTS ====================
    
    def create_event(self, event_data: Dict) -> str:
        """Create an event log entry."""
        try:
            result = self.db.table('events').insert(event_data).execute()
            return result.data[0]['id']
        except Exception as e:
            raise Exception(f"Failed to create event: {str(e)}")
    
    def list_events(self, ca_id: str) -> List[Dict]:
        """List all events for a candidate assessment."""
        try:
            result = self.db.table('events')\
                .select('*')\
                .eq('candidate_assessment_id', ca_id)\
                .order('created_at', desc=True)\
                .execute()
            return result.data
        except Exception as e:
            raise Exception(f"Failed to list events: {str(e)}")
    
    # ==================== UTILITIES ====================
    
    def _generate_slug(self, length: int = 12) -> str:
        """Generate a random URL-safe slug."""
        alphabet = string.ascii_lowercase + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    def calculate_deadline(self, hours: int) -> str:
        """Calculate deadline timestamp from now + hours."""
        deadline = datetime.utcnow() + timedelta(hours=hours)
        return deadline.isoformat()

    def get_setting(self, key: str):
        """Retrieves a setting from the app_settings table."""
        return self.db.table('app_settings').select('*').eq('key', key).single().execute().data

    def set_setting(self, key: str, value: Any):
        """Creates or updates a setting in the app_settings table."""
        return self.db.table('app_settings').upsert({'key': key, 'value': value}).execute().data

# Singleton instance
database_service = DatabaseService()

