"""
Data Transfer Objects (DTOs) for job postings.
"""
from datetime import datetime
from uuid import UUID
from typing import Any

from pydantic import BaseModel, ConfigDict


class JobCreate(BaseModel):
    """Payload for creating a new job posting."""
    title: str
    description: str
    requirements: str


class JobUpdate(BaseModel):
    """Payload for partially updating an existing job posting."""
    title: str | None = None
    description: str | None = None
    requirements: str | None = None
    is_active: bool | None = None

class JobResponse(BaseModel):
    """
    The master response schema for Job entities.
    Used for listings, single-job views, and after creation/updates.
    """
    id: UUID
    recruiter_id: UUID
    title: str
    description: str
    requirements: str
    
    # We include structured_data so the frontend can show AI-extracted highlights
    # (e.g., mandatory skills tags, min years experience)
    structured_data: dict[str, Any] | None = None
    
    # vector_id is generally internal, but useful for debugging AI links
    vector_id: str | None = None
    
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # CRITICAL: This allows Pydantic to interface with SQLAlchemy ORM objects
    model_config = ConfigDict(from_attributes=True)