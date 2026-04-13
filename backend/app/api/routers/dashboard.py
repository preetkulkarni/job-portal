"""
API Router for Recruiter Dashboard operations.

Provides endpoints for viewing applicant pools and managing the candidate 
pipeline through status updates.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.schema import User, Job, JobApplication
from app.schemas.dashboard_dto import DashboardJobViewResponse
from app.schemas.application_dto import ApplicationStatusUpdate, ApplicationResponse
from app.services import dashboard_service
from app.api.dependencies import require_role

# Removed /api from prefix as it's typically handled at the app level in main.py
router = APIRouter(prefix="/dashboard", tags=["Recruiter Dashboard"])

@router.get("/jobs/{job_id}", response_model=DashboardJobViewResponse)
def view_job_applicants(
    job_id: UUID, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("recruiter", "admin"))
):
    """
    Returns the full job context and a ranked list of all applicants.
    
    Validates that the recruiter owns the job before returning data.
    """
    # Authorization Check: Ensure the recruiter owns this job
    if current_user.role.value == "recruiter":
        job = db.query(Job).filter(Job.id == job_id, Job.recruiter_id == current_user.id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="You do not have permission to view this job's applicants."
            )

    return dashboard_service.get_job_dashboard(db, job_id)

@router.patch("/applications/{application_id}/status", response_model=ApplicationResponse)
def change_applicant_status(
    application_id: UUID, 
    status_update: ApplicationStatusUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("recruiter", "admin"))
):
    """
    Updates the status of an application.
    
    Verifies that the recruiter owns the job associated with the application.
    """
    # Authorization Check
    if current_user.role.value == "recruiter":
        # Join check to ensure recruiter ownership
        valid_app = (
            db.query(JobApplication)
            .join(Job)
            .filter(JobApplication.id == application_id, Job.recruiter_id == current_user.id)
            .first()
        )
        if not valid_app:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Unauthorized to update this application's status."
            )

    return dashboard_service.update_application_status(db, application_id, status_update)