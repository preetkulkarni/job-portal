"""
Service layer for AI-driven semantic search.

Bridges FAISS vector results with relational user data to provide 
ranked, filtered candidate matches for recruiters.
"""
import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.schema import Job, JobApplication, CandidateProfile
from app.schemas.search_dto import (
    SearchCandidatesRequest, 
    CandidateMatch, 
    SearchCandidatesResponse
)
from app.services.vector_service import resume_index
from app.utils.embedding_pipeline import generate_embedding

logger = logging.getLogger(__name__)

def search_candidates_for_job(db: Session, search_req: SearchCandidatesRequest) -> SearchCandidatesResponse:
    """
    Finds the best-matching candidates for a job using semantic vector search.
    
    Args:
        db: Database session.
        search_req: Request containing job_id, top_k, and min_score filters.
        
    Returns:
        SearchCandidatesResponse: Ranked list of candidates with match percentages.
    """
    # 1. Retrieve the Job context
    job = db.query(Job).filter(Job.id == search_req.job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Target job posting not found."
        )

    # 2. Vectorize the Job Query
    # We use a structured format consistent with how resumes were indexed
    job_text = f"ROLE: {job.title} | DESCRIPTION: {job.description} | REQUIREMENTS: {job.requirements}"
    try:
        job_vector = generate_embedding(job_text)
    except Exception as e:
        logger.error(f"Failed to generate embedding for job {job.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI embedding engine failure."
        )

    # 3. Query FAISS for raw vector matches
    # Returns List[dict] with 'uuid' and 'match_score' (0.0 - 1.0)
    faiss_results = resume_index.search(query_vector=job_vector, top_k=search_req.top_k)

    if not faiss_results:
        return SearchCandidatesResponse(job_id=search_req.job_id, total_found=0, matches=[])

    # 4. Map results for SQLite lookup
    # Convert string UUIDs from FAISS back to proper UUID objects for SQLAlchemy
    score_map = {
        UUID(str(res["uuid"])): res["match_score"] 
        for res in faiss_results
    }
    matched_ids = list(score_map.keys())

    # 5. Hydrate matches with User/Profile data
    # We use joinedload to prevent N+1 queries when accessing user names
    applications = (
        db.query(JobApplication)
        .options(
            joinedload(JobApplication.candidate).joinedload(CandidateProfile.user)
        )
        .filter(JobApplication.id.in_(matched_ids))
        .all()
    )

    # 6. Final Ranking and Filtering
    matches = []
    for app in applications:
        # Cosine similarity (0.0-1.0) converts easily to percentage
        similarity_score = score_map.get(app.id, 0.0)
        match_percentage = round(similarity_score * 100, 1)

        # Apply recruiter's score threshold
        if match_percentage >= search_req.min_score:
            candidate = app.candidate
            user = candidate.user if candidate else None
            
            matches.append(
                CandidateMatch(
                    candidate_id=app.candidate_id,
                    application_id=app.id,
                    first_name=user.first_name if user else "Unknown",
                    last_name=user.last_name if user else "Candidate",
                    headline=candidate.headline if candidate else None,
                    match_score=match_percentage
                )
            )

    # Sort results by match_score descending
    matches.sort(key=lambda x: x.match_score, reverse=True)

    return SearchCandidatesResponse(
        job_id=search_req.job_id,
        total_found=len(matches),
        matches=matches
    )