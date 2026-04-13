"""
Data Transfer Objects (DTOs) for job applications.
"""
from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.schema import ApplicationStatus


class ApplicationCreate(BaseModel):
    """Payload for submitting a new job application."""
    job_id: UUID
    candidate_id: UUID
    file_name: str = Field(..., description="Original name of the uploaded file.")
    # Added this field: If the frontend extracts text, it needs a place to send it!
    resume_text: str = Field(..., description="Raw text extracted from the resume.")


class ApplicationStatusUpdate(BaseModel):
    """Payload for recruiters updating an application's pipeline status."""
    status: ApplicationStatus


class ApplicationResponse(BaseModel):
    """Standard response model for a generic application record."""
    id: UUID
    job_id: UUID
    candidate_id: UUID
    status: ApplicationStatus
    applied_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CandidateApplicationDetail(BaseModel):
    """Detailed view of an application for the candidate's personal portal."""
    application_id: UUID
    job_id: UUID
    job_title: str
    company_name: str
    status: ApplicationStatus
    applied_at: datetime
    extracted_data: dict[str, Any] | None = None

    model_config = ConfigDict(from_attributes=True)