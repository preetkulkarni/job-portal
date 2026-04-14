"""
Service layer for job posting and lifecycle management.
"""
import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.schema import Job, RecruiterProfile, User
from app.schemas.job_dto import JobCreate, JobUpdate
from app.utils.llm_parser import extract_job_data
from app.utils.embedding_pipeline import generate_embedding
from app.services.vector_service import job_index

logger = logging.getLogger(__name__)


def _heuristic_job_fallback(job_data: JobCreate) -> dict:
    """Deterministic fallback for job extraction when LLM fails."""
    return {
        "core_role_summary": job_data.title,
        "mandatory_skills": [s.strip() for s in job_data.requirements.split(',')],
        "nice_to_have_skills": [],
        "minimum_years_experience": 0,
        "is_ai_parsed": False
    }


def create_job_pipeline(db: Session, job_data: JobCreate, current_user: User) -> Job:
    """
    Validates, parses, embeds, and persists a new job posting.
    """
    recruiter = db.query(RecruiterProfile).filter(RecruiterProfile.id == current_user.id).first()
    if not recruiter:
        raise HTTPException(status_code=403, detail="Recruiter profile required.")

    try:
        extraction = extract_job_data(
            title=job_data.title,
            description=job_data.description,
            requirements=job_data.requirements
        )
        extracted_data = extraction.model_dump()
        extracted_data["is_ai_parsed"] = True
    except Exception as e:
        logger.error(f"LLM Job Parsing failed: {e}")
        extracted_data = _heuristic_job_fallback(job_data)

    new_job = Job(
        recruiter_id=recruiter.id,
        title=job_data.title,
        description=job_data.description,
        requirements=job_data.requirements,
        structured_data=extracted_data
    )

    db.add(new_job)

    try:
        db.flush()

        m_skills = ", ".join(extracted_data.get("mandatory_skills", []))
        summary = extracted_data.get("core_role_summary", "")
        text_to_embed = f"ROLE: {summary} | SKILLS: {m_skills}"

        embedding = generate_embedding(text_to_embed)
        job_index.add_vector(item_uuid=new_job.id, vector=embedding)
        new_job.vector_id = str(new_job.id)

        db.commit()
        db.refresh(new_job)
        return new_job

    except Exception as e:
        db.rollback()
        logger.critical(f"Pipeline failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to index job vector.")


def update_job_pipeline(db: Session, job: Job, update_data: JobUpdate) -> Job:
    """
    Updates job fields. Re-runs AI pipeline only if content fields change.
    """
    content_changed = any([
        update_data.title is not None,
        update_data.description is not None,
        update_data.requirements is not None,
    ])

    if update_data.title is not None:
        job.title = update_data.title
    if update_data.description is not None:
        job.description = update_data.description
    if update_data.requirements is not None:
        job.requirements = update_data.requirements
    if update_data.is_active is not None:
        job.is_active = update_data.is_active

    if content_changed:
        try:
            extraction = extract_job_data(
                title=job.title,
                description=job.description,
                requirements=job.requirements
            )
            extracted_data = extraction.model_dump()
            extracted_data["is_ai_parsed"] = True
            job.structured_data = extracted_data
        except Exception as e:
            logger.error(f"LLM re-parse failed on update: {e}")

    try:
        db.commit()
        db.refresh(job)
        return job
    except Exception as e:
        db.rollback()
        logger.critical(f"Job update failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to update job.")