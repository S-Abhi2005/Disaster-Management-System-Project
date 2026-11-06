from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
from app.core.config import settings
import os

# PostgreSQL Connection with pooling
# Format: postgresql://username:password@host:port/database
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,              # Base pool size
    max_overflow=30,           # Overflow connections under load
    pool_pre_ping=True,        # Verify connections before use (detect stale)
    pool_recycle=3600,         # Recycle connections after 1 hour
    pool_timeout=30,           # Wait time for available connection
    echo=False                 # Set True to log all SQL (debug)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_db_async():
    """Async dependency for database sessions (for async routes)"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
