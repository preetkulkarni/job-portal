"""
API Router for job applications.

Handles multipart/form-data uploads for resumes and manages 
candidate-specific application history.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, status, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_role
from app.schemas.application_dto import (
    ApplicationCreate, 
    ApplicationResponse, 
    CandidateApplicationDetail
)
from app.services import application_service
from app.models.schema import User

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.post(
    "/", 
    response_model=ApplicationResponse, 
    status_code=status.HTTP_201_CREATED
)
async def apply_for_job(
    job_id: UUID = Form(...),
    resume_file: UploadFile = File(...),
    db: Session = Depends(get_db),
    # Ensure only the authenticated candidate can apply as themselves
    current_user: User = Depends(require_role("candidate"))
):
    """
    Submits a new job application with a resume.
    
    Processes the PDF entirely in memory and triggers the AI extraction 
    and vector indexing pipeline.
    """
    # 1. Validate file type before processing
    if resume_file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported."
        )

    # 2. Asynchronous file reading (Non-blocking)
    try:
        file_bytes = await resume_file.read()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to read the uploaded file."
        )

    # 3. Construct DTO using current_user.id to prevent IDOR attacks
    app_data = ApplicationCreate(
        job_id=job_id,
        candidate_id=current_user.id,
        file_name=resume_file.filename,
        resume_text="" # Placeholder if your DTO requires it; the service extracts it.
    )
    
    # 4. Hand off to the service layer
    return application_service.create_application(db, app_data, file_bytes)


@router.get("/me", response_model=list[CandidateApplicationDetail])
def get_my_applications(
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("candidate"))
):
    """
    Retrieves the application history for the currently logged-in candidate.
    """
    return application_service.get_candidate_applications(db, current_user.id)


@router.get(
    "/candidate/{candidate_id}", 
    response_model=list[CandidateApplicationDetail],
    dependencies=[Depends(require_role("admin"))]
)
def get_applications_by_admin(candidate_id: UUID, db: Session = Depends(get_db)):
    """
    Administrative endpoint to view applications for any specific candidate.
    """
    return application_service.get_candidate_applications(db, candidate_id)