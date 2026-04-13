"""
Service layer for recruiter dashboard operations.

Provides logic for viewing job-specific applicant pools and managing 
the application lifecycle status.
"""
import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.schema import Job, JobApplication, CandidateProfile
from app.schemas.application_dto import ApplicationStatusUpdate
from app.schemas.dashboard_dto import DashboardJobViewResponse, DashboardApplicantDetail

logger = logging.getLogger(__name__)

def get_job_dashboard(db: Session, job_id: UUID) -> DashboardJobViewResponse:
    """
    Fetches the master view for a specific job posting.
    
    Includes job metadata and a list of all applicants sorted by 
    semantic match score (highest first).
    """
    # 1. Fetch Job context
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Job posting not found."
        )

    # 2. Fetch Applications with Eager Loading
    # We use joinedload to fetch Profile and User data in a single SQL JOIN.
    applications = (
        db.query(JobApplication)
        .options(
            joinedload(JobApplication.candidate)
            .joinedload(CandidateProfile.user)
        )
        .filter(JobApplication.job_id == job_id)
        .order_by(JobApplication.semantic_match_score.desc().nulls_last())
        .all()
    )

    # 3. Transform to DTOs
    applicants_data = []
    for app in applications:
        candidate = app.candidate 
        user = candidate.user if candidate else None
        
        # We map the database objects to our Pydantic DTO
        applicants_data.append(
            DashboardApplicantDetail(
                application_id=app.id,
                candidate_id=app.candidate_id,
                first_name=user.first_name if user else "Unknown",
                last_name=user.last_name if user else "Candidate",
                headline=candidate.headline if candidate else "No headline provided",
                status=app.status,
                semantic_match_score=app.semantic_match_score,
                applied_at=app.applied_at
            )
        )

    return DashboardJobViewResponse(
        job_id=job.id,
        job_title=job.title,
        is_active=job.is_active,
        total_applicants=len(applicants_data),
        applicants=applicants_data
    )

def update_application_status(
    db: Session, 
    application_id: UUID, 
    status_update: ApplicationStatusUpdate
) -> JobApplication:
    """
    Updates the pipeline status of a specific job application.
    """
    application = db.query(JobApplication).filter(JobApplication.id == application_id).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Application record not found."
        )
        
    application.status = status_update.status
    
    try:
        db.commit()
        db.refresh(application)
        return application
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to update application {application_id} status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during status update."
        )