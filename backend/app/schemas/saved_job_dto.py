"""
Data Transfer Objects (DTOs) for saved jobs bookmarking.
"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SavedJobCreate(BaseModel):
    """
    Payload required to save a job.
    
    Note: candidate_id is intentionally omitted here as it MUST be 
    injected by the backend via the authenticated user's JWT token 
    to prevent IDOR vulnerabilities.
    """
    job_id: UUID


class SavedJobResponse(BaseModel):
    """Standard response for a saved job record."""
    id: UUID
    job_id: UUID
    candidate_id: UUID
    saved_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SavedJobDetailResponse(SavedJobResponse):
    """Expanded response including job context for frontend rendering."""
    job_title: str
    company_name: str