"""
Main entry point for the AI Job Portal Backend.
"""
from contextlib import asynccontextmanager
from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine
from app.models.schema import Base

from app.api.routers import (
    auth_router,
    saved_jobs,
    applications,
    dashboard,
    jobs,
    search,
    admin
)

Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(
    title="Job Portal Backend",
    description="Semantic resume matching using FAISS and SQLite.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(jobs.router)
app.include_router(saved_jobs.router)
app.include_router(applications.router)
app.include_router(dashboard.router)
app.include_router(search.router)
app.include_router(admin.router)

@app.get("/health", tags=["System"])
async def health_check() -> Dict[str, str]:
    return {"status": "healthy"}