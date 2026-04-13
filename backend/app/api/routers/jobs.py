"""
API Router for Job Postings.

Handles public job listing, detailed retrieval, and recruiter-managed 
CRUD operations including AI re-processing on content updates.
"""
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.schema import Job, User, UserRole, RecruiterProfile
from app.schemas.job_dto import JobCreate, JobUpdate, JobResponse
from app.services import job_service
from app.api.dependencies import require_role

router = APIRouter(prefix="/jobs", tags=["Jobs"])
logger = logging.getLogger(__name__)

def job_dict(j: Job):
    return {
        "job_id": str(j.id),
        "title": j.title,
        "description": j.description,
        "requirements": j.requirements,
        "recruiter_id": str(j.recruiter_id),
        "is_active": j.is_active,
        "created_at": str(j.created_at)
    }

@router.get("", response_model=list[JobResponse])
def list_jobs(
    skip: int = 0, 
    limit: int = 20, 
    search: str | None = Query(None, min_length=3), 
    db: Session = Depends(get_db)
):
    """Retrieves a paginated list of active job postings with optional search filtering."""
    query = db.query(Job).filter(Job.is_active)
    
    if search:
        # Simple text search across core fields
        search_filter = f"%{search}%"
        query = query.filter(
            Job.title.ilike(search_filter) | 
            Job.description.ilike(search_filter) | 
            Job.requirements.ilike(search_filter)
        )
    
    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    return jobs

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: UUID, db: Session = Depends(get_db)):
    """Retrieves details for a single job posting."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job: 
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return job

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    req: JobCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("recruiter", "admin"))
):
    """Triggers the AI pipeline to create and index a new job posting."""
    return job_service.create_job_pipeline(db=db, job_data=req, current_user=current_user)

@router.patch("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: UUID, 
    req: JobUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("recruiter", "admin"))
):
    """
    Updates job details. If title/description/requirements change, 
    the AI pipeline is re-triggered to update structured data and vectors.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job: 
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Ownership Validation
    if job.recruiter_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized to modify this job"
        )
        
    # We move the update logic to the service layer to ensure AI consistency
    return job_service.update_job_pipeline(db=db, job=job, update_data=req)

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: UUID, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("recruiter", "admin"))
):
    """Deletes a job posting and associated relational data."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job: 
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.recruiter_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")
        
    db.delete(job)
    db.commit()
    return None

@router.get("/recruiter/all-jobs")
def my_jobs(db: Session = Depends(get_db), current_user: User = Depends(require_role("recruiter", "admin"))):
    recruiter_profile = db.query(RecruiterProfile).filter(RecruiterProfile.id == current_user.id).first()
    if not recruiter_profile:
        return []
        
    jobs = db.query(Job).filter(Job.recruiter_id == recruiter_profile.id).order_by(Job.created_at.desc()).all()
    return [job_dict(j) for j in jobs]