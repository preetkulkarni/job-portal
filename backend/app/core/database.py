"""
Database configuration and session management.

Establishes the SQLAlchemy engine, configures connection pooling, 
and provides session factories for the application.
"""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load environment variables (primarily for local dev)
load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("SQLALCHEMY_DATABASE_URL")
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("SQLALCHEMY_DATABASE_URL environment variable is not set.")

# Dynamically adjust engine arguments based on the database type
is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")
engine_kwargs = {}

if is_sqlite:
    # Required for FastAPI + SQLite to prevent thread-sharing issues
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Production connection pooling settings (e.g., for PostgreSQL)
    engine_kwargs["pool_size"] = 20
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_pre_ping"] = True 

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)