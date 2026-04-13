"""
Data Transfer Objects (DTOs) for job postings.
"""
from pydantic import BaseModel


class JobCreate(BaseModel):
    """Payload for creating a new job posting."""
    title: str
    description: str
    requirements: str


class JobUpdate(BaseModel):
    """Payload for partially updating an existing job posting."""
    title: str | None = None
    description: str | None = None
    requirements: str | None = None
    is_active: bool | None = None