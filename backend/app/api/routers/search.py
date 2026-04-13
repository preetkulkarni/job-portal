"""
API Router for Semantic AI Search.

Exposes endpoints for recruiters to perform vector-based candidate 
matching against their specific job postings.
"""
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.schema import User, Job
from app.schemas.search_dto import SearchCandidatesRequest, SearchCandidatesResponse
from app.services import search_service
from app.core.auth import require_role

# Standardizing prefix (removing /api as handled in main.py)
router = APIRouter(prefix="/search", tags=["Semantic Search"])

@router.post(
    "/candidates", 
    response_model=SearchCandidatesResponse, 
    status_code=status.HTTP_200_OK
)
def semantic_resume_search(
    search_req: SearchCandidatesRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(require_role("recruiter", "admin"))
):
    """
    Executes a semantic vector search against applications for a specific job.
    
    Verifies that the recruiter has ownership of the job before 
    triggering the embedding and vector search pipeline.
    """
    # Authorization Check: Prevent recruiters from "peeking" at other companies' data
    if current_user.role.value == "recruiter":
        job_exists = db.query(Job).filter(
            Job.id == search_req.job_id, 
            Job.recruiter_id == current_user.id
        ).first()
        
        if not job_exists:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to search candidates for this job posting."
            )

    return search_service.search_candidates_for_job(db, search_req)