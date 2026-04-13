"""
Main entry point for the AI Job Portal Backend.

Initializes the FastAPI application, configures CORS, sets up application 
lifespan events, and registers all API routers.
"""
from contextlib import asynccontextmanager
from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import (
    auth_router,
    saved_jobs,
    applications,
    search,
    dashboard,
    jobs
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application startup and shutdown events.
    
    Use this to initialize heavy resources like database connection pools, 
    HuggingFace models, or FAISS indices before accepting requests.
    """
    # TODO: Initialize FAISS index and load LLM resources here
    yield
    # TODO: Clean up resources (e.g., close DB pools) on shutdown


app = FastAPI(
    title="Job Portal Backend",
    description="Semantic resume matching using Gemini, HuggingFace, FAISS, and SQLite.",
    version="1.0.0",
    lifespan=lifespan
)



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router.router)
app.include_router(jobs.router)
app.include_router(saved_jobs.router)
app.include_router(applications.router)
app.include_router(search.router)
app.include_router(dashboard.router)


@app.get("/health", tags=["System"])
async def health_check() -> Dict[str, str]:
    """Verify the server and core components are responsive."""
    return {"status": "healthy"}