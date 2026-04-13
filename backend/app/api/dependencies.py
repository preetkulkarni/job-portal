"""
FastAPI dependencies for route injection.

Centralizes reusable logic such as database session management, 
authentication checks, and role-based access control (RBAC).
"""
from typing import Generator, Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.core.database import SessionLocal
from app.models.schema import User
from app.core.auth import SECRET_KEY, ALGORITHM

security = HTTPBearer()

def get_db() -> Generator[Session, None, None]:
    """Provision a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: Session = Depends(get_db)
) -> User:
    """
    Validates the JWT token from the Authorization header and returns the user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, 
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None: 
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None: 
        raise credentials_exception
        
    return user


def require_role(*roles: str) -> Callable:
    """
    Dependency factory for Role-Based Access Control (RBAC).
    
    Args:
        *roles: Unpacked list of allowed role values (e.g., "admin", "recruiter").
        
    Returns:
        A dependency function that enforces the role check.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.value not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Insufficient permissions to access this resource"
            )
        return current_user
        
    return role_checker