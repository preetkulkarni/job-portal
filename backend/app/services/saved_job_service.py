"""
Service layer for managing candidate's bookmarked (saved) jobs.

Handles job preservation logic, duplicate prevention via IntegrityErrors, 
and rich data retrieval for the candidate dashboard.
"""
import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.schema import SavedJob, Job, RecruiterProfile
from app.schemas.saved_job_dto import SavedJobCreate, SavedJobDetailResponse

logger = logging.getLogger(__name__)

def save_job(db: Session, save_data: SavedJobCreate, candidate_id: UUID) -> SavedJob:
    """
    Bookmarks a job for a candidate.
    
    Args:
        db: Database session.
        save_data: DTO containing the job_id.
        candidate_id: UUID derived from the authenticated user's token.
    """
    # 1. Verification
    job = db.query(Job).filter(Job.id == save_data.job_id, Job.is_active).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Job not found or is no longer accepting applications."
        )

    # 2. Persistence
    new_saved_job = SavedJob(
        candidate_id=candidate_id,  # Derived from token, not DTO
        job_id=save_data.job_id
    )
    
    db.add(new_saved_job)
    
    try:
        db.commit()
        db.refresh(new_saved_job)
        return new_saved_job
    except IntegrityError:
        db.rollback()
        # This occurs if the UniqueConstraint('candidate_id', 'job_id') is violated
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already saved this job."
        )

def get_saved_jobs_for_candidate(db: Session, candidate_id: UUID) -> list[SavedJobDetailResponse]:
    """
    Retrieves the candidate's bookmarked jobs with company context.
    """
    # Using explicit column selection for performance and clarity
    results = (
        db.query(
            SavedJob.id,
            SavedJob.job_id,
            SavedJob.candidate_id,
            SavedJob.saved_at,
            SavedJob.updated_at,
            Job.title.label("job_title"),
            RecruiterProfile.company_name.label("company_name")
        )
        .join(Job, SavedJob.job_id == Job.id)
        .join(RecruiterProfile, Job.recruiter_id == RecruiterProfile.id)
        .filter(SavedJob.candidate_id == candidate_id)
        .order_by(SavedJob.saved_at.desc())
        .all()
    )
    
    # Mapping raw row results to our Pydantic Detail DTO
    return [SavedJobDetailResponse.model_validate(row, from_attributes=True) for row in results]

def remove_saved_job(db: Session, candidate_id: UUID, job_id: UUID) -> dict[str, str]:
    """
    Deletes a saved job record for the specific candidate.
    """
    saved_job = db.query(SavedJob).filter(
        SavedJob.candidate_id == candidate_id,
        SavedJob.job_id == job_id
    ).first()

    if not saved_job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bookmark not found."
        )

    try:
        db.delete(saved_job)
        db.commit()
        return {"message": "Job removed from saved list successfully."}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to remove saved job {job_id} for candidate {candidate_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error during removal."
        )