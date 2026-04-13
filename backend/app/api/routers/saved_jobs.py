"""
API Router for saved jobs (bookmarks).

Provides endpoints for candidates to save jobs for later, 
view their saved list, and remove bookmarks.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.schemas.saved_job_dto import SavedJobCreate, SavedJobResponse, SavedJobDetailResponse
from app.services import saved_job_service
from app.api.dependencies import require_role
from app.models.schema import User

router = APIRouter(prefix="/saved-jobs", tags=["Saved Jobs"])

@router.post("/", response_model=SavedJobResponse, status_code=status.HTTP_201_CREATED)
def save_a_job(
    save_data: SavedJobCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("candidate"))
):
    """
    Bookmarks a job for the currently authenticated candidate.
    """
    # Pass current_user.id to the service to ensure the record belongs to the token owner
    return saved_job_service.save_job(db, save_data, current_user.id)

@router.get("/me", response_model=list[SavedJobDetailResponse])
def get_my_saved_jobs(
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("candidate"))
):
    """
    Retrieves all jobs bookmarked by the logged-in candidate.
    """
    return saved_job_service.get_saved_jobs_for_candidate(db, current_user.id)

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_saved_job(
    job_id: UUID, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("candidate"))
):
    """
    Removes a job from the logged-in candidate's bookmarked list.
    """
    saved_job_service.remove_saved_job(db, current_user.id, job_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get(
    "/candidate/{candidate_id}", 
    response_model=list[SavedJobDetailResponse],
    dependencies=[Depends(require_role("admin"))]
)
def admin_get_candidate_saved_jobs(candidate_id: UUID, db: Session = Depends(get_db)):
    """
    Administrative endpoint to view bookmarks for a specific candidate.
    """
    return saved_job_service.get_saved_jobs_for_candidate(db, candidate_id)