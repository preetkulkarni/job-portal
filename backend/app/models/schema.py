import enum
import uuid

from sqlalchemy import (
    Column, String, Text, ForeignKey, Enum, DateTime, Float, Boolean, 
    UniqueConstraint, Uuid, JSON
)
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class UserRole(enum.Enum):
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"
    ADMIN = "admin"


class ApplicationStatus(enum.Enum):
    APPLIED = "applied"
    REVIEWED = "reviewed"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"


class User(Base):
    """Core user authentication and identity model."""
    __tablename__ = 'users'
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    
    first_name = Column(String(100))
    last_name = Column(String(100))
    password_hash = Column(String(128), nullable=False) 
    role = Column(Enum(UserRole, name="user_role_enum"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True)

    candidate_profile = relationship("CandidateProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    recruiter_profile = relationship("RecruiterProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class CandidateProfile(Base):
    """Candidate-specific details, sharing a 1-to-1 primary key with User."""
    __tablename__ = 'candidate_profiles'
    
    id = Column(Uuid, ForeignKey('users.id', ondelete="CASCADE"), primary_key=True)
    headline = Column(String(255))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    user = relationship("User", back_populates="candidate_profile")
    applications = relationship("JobApplication", back_populates="candidate", cascade="all, delete-orphan")
    saved_jobs = relationship("SavedJob", back_populates="candidate", cascade="all, delete-orphan")


class RecruiterProfile(Base):
    """Recruiter-specific details, sharing a 1-to-1 primary key with User."""
    __tablename__ = 'recruiter_profiles'
    
    id = Column(Uuid, ForeignKey('users.id', ondelete="CASCADE"), primary_key=True)
    company_name = Column(String(255), nullable=False, index=True)
    company_website = Column(String(255))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    user = relationship("User", back_populates="recruiter_profile")
    jobs_posted = relationship("Job", back_populates="recruiter", cascade="all, delete-orphan")


class Job(Base):
    """Job postings created by recruiters."""
    __tablename__ = 'jobs'
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    recruiter_id = Column(Uuid, ForeignKey('recruiter_profiles.id', ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=False)
    structured_data = Column(JSON, nullable=True)
    vector_id = Column(String(100), nullable=True) 
    
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    recruiter = relationship("RecruiterProfile", back_populates="jobs_posted")
    applications = relationship("JobApplication", back_populates="job", cascade="all, delete-orphan")
    saved_by = relationship("SavedJob", back_populates="job", cascade="all, delete-orphan")


class JobApplication(Base):
    """Records of candidates applying to specific jobs."""
    __tablename__ = 'job_applications'
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    job_id = Column(Uuid, ForeignKey('jobs.id', ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(Uuid, ForeignKey('candidate_profiles.id', ondelete="CASCADE"), nullable=False, index=True)
    
    extracted_data = Column(JSON, nullable=True)        
    vector_id = Column(String(100), nullable=True)        
    
    status = Column(Enum(ApplicationStatus, name="application_status_enum"), default=ApplicationStatus.APPLIED, index=True)
    semantic_match_score = Column(Float, nullable=True) 
    
    applied_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    job = relationship("Job", back_populates="applications")
    candidate = relationship("CandidateProfile", back_populates="applications")

    __table_args__ = (
        UniqueConstraint('candidate_id', 'job_id', name='uq_candidate_job_application'),
    )


class SavedJob(Base):
    """Jobs bookmarked by candidates for later review."""
    __tablename__ = 'saved_jobs'
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4, index=True)
    candidate_id = Column(Uuid, ForeignKey('candidate_profiles.id', ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(Uuid, ForeignKey('jobs.id', ondelete="CASCADE"), nullable=False, index=True)
    
    saved_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    candidate = relationship("CandidateProfile", back_populates="saved_jobs")
    job = relationship("Job", back_populates="saved_by")

    __table_args__ = (
        UniqueConstraint('candidate_id', 'job_id', name='uq_candidate_job_save'),
    )