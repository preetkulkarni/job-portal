"""
Data Transfer Objects (DTOs) for AI semantic search operations.
"""
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SearchCandidatesRequest(BaseModel):
    """Payload for executing a semantic search against job applications."""
    job_id: UUID
    top_k: int = Field(default=10, description="Number of top candidates to return.", ge=1, le=100)
    min_score: float = Field(default=0.0, description="Minimum similarity score filter.")


class CandidateMatch(BaseModel):
    """Represents a single candidate matched via vector search."""
    candidate_id: UUID
    application_id: UUID
    first_name: str | None = None
    last_name: str | None = None
    headline: str | None = None
    match_score: float = Field(description="Similarity score (e.g., percentage out of 100).")
    
    model_config = ConfigDict(from_attributes=True)


class SearchCandidatesResponse(BaseModel):
    """Master payload returned to the recruiter after a semantic search."""
    job_id: UUID
    total_found: int
    matches: list[CandidateMatch]