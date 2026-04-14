"""
Service layer for managing job applications.

Handles the end-to-end pipeline: PDF parsing, fallback data extraction, 
LLM processing, semantic embedding generation, and FAISS indexing.
"""
import logging
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.schema import JobApplication, Job, RecruiterProfile
from app.schemas.application_dto import ApplicationCreate
from app.utils.text_parser import clean_resume_text, extract_text_from_pdf 
from app.utils.llm_parser import extract_resume_data
from app.utils.embedding_pipeline import generate_embedding
from app.services.vector_service import resume_index

logger = logging.getLogger(__name__)

def _heuristic_fallback_extraction(text: str) -> dict:
    """
    Emergency extraction using regex/string matching when LLM fails.
    Ensures that generate_embedding() still receives structured keywords.
    """
    text_lower = text.lower()
    
    # Simple keyword-based skill heuristic
    common_skills = ["python", "java", "react", "sql", "aws", "docker", "fastapi", "project management"]
    found_skills = [skill for skill in common_skills if skill in text_lower]
    
    # Simple title heuristic (looking for common patterns)
    common_titles = ["engineer", "developer", "manager", "analyst", "lead", "architect"]
    found_titles = [title.capitalize() for title in common_titles if title in text_lower]

    return {
        "primary_skills": found_skills,
        "job_titles": found_titles,
        "professional_summary": text[:500],
        "years_of_experience": 0,
        "work_experience": [],
        "is_ai_parsed": False
    }

def create_application(db: Session, app_data: ApplicationCreate, file_bytes: bytes) -> JobApplication:
    """
    Processes a new job application with a robust AI fallback pipeline.
    """
    # 1. Validation
    job = db.query(Job).filter(Job.id == app_data.job_id, Job.is_active).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job inactive or not found.")

    existing = db.query(JobApplication).filter(
        JobApplication.job_id == app_data.job_id,
        JobApplication.candidate_id == app_data.candidate_id
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Application already exists.")

    # 2. Extraction & Cleaning
    raw_text = extract_text_from_pdf(file_bytes)
    if not raw_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PDF text extraction failed.")
    
    cleaned_text = clean_resume_text(raw_text)

    # 3. Parsing Phase (LLM with Heuristic Fallback)
    try:
        # extract_resume_data returns a ResumeExtraction Pydantic object
        extraction_obj = extract_resume_data(cleaned_text)
        extracted_data = extraction_obj.model_dump()
        extracted_data["is_ai_parsed"] = True
    except Exception as e:
        logger.error(f"LLM Parsing failed for candidate {app_data.candidate_id}: {e}")
        extracted_data = _heuristic_fallback_extraction(cleaned_text)

    # 4. Rich Embedding Construction
    # We build a 'feature string' to ensure the vector captures the most important info
    skills_str = ", ".join(extracted_data.get("primary_skills", []))
    titles_str = ", ".join(extracted_data.get("job_titles", []))
    summary = extracted_data.get("professional_summary", "")
    
    # Construct a high-signal string for the embedding model
    text_to_embed = f"TITLES: {titles_str} | SKILLS: {skills_str} | SUMMARY: {summary}"
    embedding = generate_embedding(text_to_embed)
    job_embedding = generate_embedding(job.description + " " + job.requirements)
    match_score = resume_index.calculate_match_score(embedding, job_embedding)

    # 5. Database & Vector Persistence
    new_app = JobApplication(
        job_id=app_data.job_id,
        candidate_id=app_data.candidate_id,
        extracted_data=extracted_data,
        semantic_match_score=match_score
    )

    try:
        db.add(new_app)
        db.flush()  # Generate UUID for vector mapping

        # Indexing in FAISS
        resume_index.add_vector(item_uuid=new_app.id, vector=embedding)
        new_app.vector_id = str(new_app.id)

        db.commit()
        db.refresh(new_app)
        return new_app
    except Exception as e:
        db.rollback()
        logger.critical(f"Database commit failed: {e}")
        raise HTTPException(status_code=500, detail="Internal processing error.")

def get_candidate_applications(db: Session, candidate_id: UUID) -> list[dict]:
    """
    Retrieves rich application history for a candidate dashboard.
    """
    results = (
        db.query(JobApplication, Job, RecruiterProfile)
        .join(Job, JobApplication.job_id == Job.id)
        .join(RecruiterProfile, Job.recruiter_id == RecruiterProfile.id)
        .filter(JobApplication.candidate_id == candidate_id)
        .order_by(JobApplication.applied_at.desc())
        .all()
    )

    return [
        {
            "application_id": app.id,
            "job_id": job.id,
            "job_title": job.title,
            "company_name": recruiter.company_name,
            "status": app.status,
            "applied_at": app.applied_at,
            "extracted_data": app.extracted_data 
        }
        for app, job, recruiter in results
    ]