"""
Authentication utilities.

Handles password hashing, verification, and JWT (JSON Web Token) creation.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Any

from jose import jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is not set. Cannot start application securely.")

ALGORITHM = "HS256"
# Allow token expiry to be configurable via env vars, defaulting to 24 hours
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain text password against its hashed version."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate a secure bcrypt hash from a plain text password."""
    return pwd_context.hash(password)


def create_access_token(
    data: dict[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a new JWT access token.

    Args:
        data: The payload to encode in the token (usually containing the 'sub' claim).
        expires_delta: Optional custom expiration time.

    Returns:
        str: The encoded JWT string.
    """
    to_encode = data.copy()
    
    # In modern Python, datetime.utcnow() is deprecated. 
    # Use datetime.now(timezone.utc) for proper timezone-aware UTC times.
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)