"""
Data Transfer Objects (DTOs) for recruiter and candidate dashboards.
"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.schema import ApplicationStatus


class DashboardApplicantDetail(BaseModel):
    """Detailed view of a single applicant within the recruiter dashboard."""
    application_id: UUID
    candidate_id: UUID
    first_name: str | None = None
    last_name: str | None = None
    headline: str | None = None
    status: ApplicationStatus
    semantic_match_score: float | None = None
    applied_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardJobViewResponse(BaseModel):
    """Master payload for viewing a specific job and its applicants."""
    job_id: UUID
    job_title: str
    is_active: bool
    total_applicants: int
    applicants: list[DashboardApplicantDetail]
    
    model_config = ConfigDict(from_attributes=True)