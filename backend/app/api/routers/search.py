"""
API Router for semantic candidate search using FAISS vector similarity.
"""
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_role
from app.models.schema import User, Job, JobApplication, CandidateProfile
from app.schemas.search_dto import (
    SearchCandidatesRequest,
    SearchCandidatesResponse,
    CandidateMatch,
)
from app.services.vector_service import resume_index
from app.utils.embedding_pipeline import generate_embedding

router = APIRouter(prefix="/search", tags=["Search"])
logger = logging.getLogger(__name__)


@router.post("/candidates", response_model=SearchCandidatesResponse)
def search_candidates(
    req: SearchCandidatesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("recruiter", "admin")),
):
    # 1. Validate job exists
    job = db.query(Job).filter(Job.id == req.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found."
        )

    # 2. Generate query vector from job text
    query_text = f"{job.title} {job.description} {job.requirements}"
    try:
        query_vector = generate_embedding(query_text)
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate search embedding."
        )

    # 3. Search FAISS index
    raw_results = resume_index.search(query_vector, top_k=req.top_k)

    if not raw_results:
        return SearchCandidatesResponse(
            job_id=req.job_id,
            total_found=0,
            matches=[]
        )

    # 4. Filter by min_score
    filtered = [r for r in raw_results if r["match_score"] >= req.min_score]

    # 5. Enrich with DB data
    matches = []
    for result in filtered:
        application_uuid = result["uuid"]

        application = db.query(JobApplication).filter(
            JobApplication.id == application_uuid
        ).first()

        if not application:
            continue

        candidate = db.query(User).filter(
            User.id == application.candidate_id
        ).first()

        profile = db.query(CandidateProfile).filter(
            CandidateProfile.id == application.candidate_id
        ).first() if candidate else None

        matches.append(
            CandidateMatch(
                candidate_id=application.candidate_id,
                application_id=application.id,
                first_name=candidate.first_name if candidate else None,
                last_name=candidate.last_name if candidate else None,
                headline=profile.headline if profile else None,
                match_score=round(result["match_score"] * 100, 1),
            )
        )

    return SearchCandidatesResponse(
        job_id=req.job_id,
        total_found=len(matches),
        matches=matches,
    )