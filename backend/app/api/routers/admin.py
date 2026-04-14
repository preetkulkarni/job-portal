"""
API Router for Admin operations.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.dependencies import get_db, require_role
from app.models.schema import User, Job, JobApplication, UserRole, ApplicationStatus, RecruiterProfile

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", dependencies=[Depends(require_role("admin"))])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role.value if hasattr(u.role, "value") else u.role,
        }
        for u in users
    ]


@router.get("/applications", dependencies=[Depends(require_role("admin"))])
def get_all_applications(db: Session = Depends(get_db)):
    apps = db.query(JobApplication).all()
    return [
        {
            "id": str(a.id),
            "candidate_id": str(a.candidate_id),
            "job_id": str(a.job_id),
            "status": a.status.value if hasattr(a.status, "value") else a.status,
            "semantic_match_score": a.semantic_match_score,
            "applied_at": str(a.applied_at),
        }
        for a in apps
    ]


@router.get("/stats", dependencies=[Depends(require_role("admin"))])
def get_platform_stats(db: Session = Depends(get_db)):
    total_users = db.query(func.count(User.id)).scalar()
    total_candidates = db.query(func.count(User.id)).filter(
        User.role == UserRole.CANDIDATE
    ).scalar()
    total_recruiters = db.query(func.count(User.id)).filter(
        User.role == UserRole.RECRUITER
    ).scalar()
    total_jobs = db.query(func.count(Job.id)).scalar()
    active_jobs = db.query(func.count(Job.id)).filter(
        Job.is_active == True
    ).scalar()
    inactive_jobs = total_jobs - active_jobs
    total_applications = db.query(func.count(JobApplication.id)).scalar()

    shortlisted = db.query(func.count(JobApplication.id)).filter(
        JobApplication.status == ApplicationStatus.SHORTLISTED
    ).scalar()
    rejected = db.query(func.count(JobApplication.id)).filter(
        JobApplication.status == ApplicationStatus.REJECTED
    ).scalar()
    applied = db.query(func.count(JobApplication.id)).filter(
        JobApplication.status == ApplicationStatus.APPLIED
    ).scalar()

    top_recruiters = (
        db.query(
            User.first_name,
            User.last_name,
            User.email,
            func.count(Job.id).label("job_count")
        )
        .join(RecruiterProfile, RecruiterProfile.id == User.id)
        .join(Job, Job.recruiter_id == RecruiterProfile.id)
        .group_by(User.id)
        .order_by(func.count(Job.id).desc())
        .limit(5)
        .all()
    )

    most_applied = (
        db.query(
            Job.title,
            func.count(JobApplication.id).label("app_count")
        )
        .join(JobApplication, JobApplication.job_id == Job.id)
        .group_by(Job.id)
        .order_by(func.count(JobApplication.id).desc())
        .limit(5)
        .all()
    )

    return {
        "total_users": total_users,
        "total_candidates": total_candidates,
        "total_recruiters": total_recruiters,
        "total_jobs": total_jobs,
        "active_jobs": active_jobs,
        "inactive_jobs": inactive_jobs,
        "total_applications": total_applications,
        "shortlisted": shortlisted,
        "rejected": rejected,
        "applied": applied,
        "top_recruiters": [
            {
                "name": f"{r.first_name} {r.last_name}",
                "email": r.email,
                "job_count": r.job_count
            }
            for r in top_recruiters
        ],
        "most_applied_jobs": [
            {
                "title": j.title,
                "applications": j.app_count
            }
            for j in most_applied
        ]
    }