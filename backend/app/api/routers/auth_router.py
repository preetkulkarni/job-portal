"""
Authentication and User Registration Router.

Handles candidate and recruiter registration, login/JWT issuance, 
and session verification.
"""
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.core.auth import verify_password, get_password_hash, create_access_token
from app.models.schema import User, UserRole, CandidateProfile, RecruiterProfile
from app.schemas.auth_dto import (
    LoginRequest, 
    CandidateRegisterRequest, 
    RecruiterRegisterRequest
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register/candidate", status_code=status.HTTP_201_CREATED)
def register_candidate(req: CandidateRegisterRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Registers a new candidate and creates their professional profile."""
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        user = User(
            email=req.email, 
            password_hash=get_password_hash(req.password),
            first_name=req.first_name, 
            last_name=req.last_name, 
            role=UserRole.CANDIDATE
        )
        db.add(user)
        db.flush()  # Generate user.id

        profile = CandidateProfile(id=user.id, headline=req.headline)
        db.add(profile)
        
        db.commit()
        db.refresh(user)
        return {"id": str(user.id), "email": user.email, "role": user.role.value}
    except Exception as e:
        db.rollback()
        logger.error(f"Candidate registration failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during registration")

@router.post("/register/recruiter", status_code=status.HTTP_201_CREATED)
def register_recruiter(req: RecruiterRegisterRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Registers a new recruiter and links their company details."""
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        user = User(
            email=req.email, 
            password_hash=get_password_hash(req.password),
            first_name=req.first_name, 
            last_name=req.last_name, 
            role=UserRole.RECRUITER
        )
        db.add(user)
        db.flush()

        profile = RecruiterProfile(
            id=user.id,
            company_name=req.company_name,
            company_website=req.company_website
        )
        db.add(profile)
        
        db.commit()
        db.refresh(user)
        return {"id": str(user.id), "email": user.email, "role": user.role.value}
    except Exception as e:
        db.rollback()
        logger.error(f"Recruiter registration failed: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during registration")

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)) -> dict[str, Any]:
    """Authenticates user and returns a JWT access token."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is deactivated")
    
    token = create_access_token({"sub": user.email, "role": user.role.value})
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "user": {
            "id": str(user.id), 
            "email": user.email, 
            "role": user.role.value
        }
    }

@router.get("/me")
def get_current_session_info(current_user: User = Depends(get_current_user)) -> dict[str, Any]:
    """Returns profile information for the currently authenticated user."""
    # Basic info
    user_data = {
        "id": str(current_user.id), 
        "email": current_user.email, 
        "first_name": current_user.first_name, 
        "last_name": current_user.last_name, 
        "role": current_user.role.value
    }
    
    # Add role-specific profile data if available
    if current_user.role == UserRole.CANDIDATE and current_user.candidate_profile:
        user_data["profile"] = {"headline": current_user.candidate_profile.headline}
    elif current_user.role == UserRole.RECRUITER and current_user.recruiter_profile:
        user_data["profile"] = {
            "company_name": current_user.recruiter_profile.company_name,
            "company_website": current_user.recruiter_profile.company_website
        }
        
    return user_data