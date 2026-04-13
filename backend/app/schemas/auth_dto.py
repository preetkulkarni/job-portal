"""
Data Transfer Objects (DTOs) for authentication and registration.
"""
from pydantic import BaseModel, EmailStr, Field

from app.models.schema import UserRole


class RegisterRequest(BaseModel):
    """Base registration payload for standard users."""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Must be at least 8 characters.")
    first_name: str
    last_name: str | None = None
    role: UserRole 


class LoginRequest(BaseModel):
    """Payload for user authentication."""
    email: EmailStr
    password: str


class CandidateRegisterRequest(BaseModel):
    """Specialized registration payload for candidates."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str
    last_name: str
    headline: str | None = None


class RecruiterRegisterRequest(BaseModel):
    """Specialized registration payload for recruiters."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str
    last_name: str
    company_name: str
    company_website: str | None = None