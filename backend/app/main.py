from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from fastapi.middleware.cors import CORSMiddleware
from app.auth.routes import router as auth_router
from app.users.routes import router as user_router
from app.incidents.routes import router as incident_router
from app.core.database import engine, Base, get_db
from app.users import models
from app.volunteers.routes import router as volunteer_router
from app.resources.routes import router as resource_router
from app.alerts.routes import router as alert_router
from app.notifications.ws_routes import router as notification_router
from app.analytics.routes import router as analytics_router
from app.assignments.routes import router as assignment_router

app = FastAPI(title=settings.APP_NAME)

API_PREFIX = "/api/v1"

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if settings.FRONTEND_URL:
    origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    from app.incidents import models as incident_models
    from app.volunteers import models as volunteer_models
    from app.resources import models as resource_models
    from app.alerts import models as alert_models
    from app.assignments import db_models as assignment_db_models  # ensure table exists
    Base.metadata.create_all(bind=engine)

    # Lightweight migration for existing databases (adds missing incident columns)
    try:
        with engine.begin() as conn:
            conn.execute(text('ALTER TABLE incidents ADD COLUMN IF NOT EXISTS type VARCHAR'))
            conn.execute(text("UPDATE incidents SET type = 'Other' WHERE type IS NULL"))
            conn.execute(text('ALTER TABLE incidents ADD COLUMN IF NOT EXISTS severity VARCHAR'))
            conn.execute(text("UPDATE incidents SET severity = 'medium' WHERE severity IS NULL"))

            conn.execute(text('ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS current_incident_id INTEGER'))
            conn.execute(text('ALTER TABLE volunteers ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP'))
    except Exception:
        # Ignore if DB doesn't support IF NOT EXISTS or table missing
        pass

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(user_router, prefix=API_PREFIX)
app.include_router(incident_router, prefix=API_PREFIX)
app.include_router(volunteer_router, prefix=API_PREFIX)
app.include_router(resource_router, prefix=API_PREFIX)
app.include_router(alert_router, prefix=API_PREFIX)
app.include_router(notification_router, prefix=API_PREFIX)
app.include_router(analytics_router, prefix=API_PREFIX)
app.include_router(assignment_router, prefix=API_PREFIX)

@app.get("/health")
def health_check():
    return {"status": "OK", "environment": settings.ENV, "database": "PostgreSQL"}

@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    """
    Test endpoint to verify database connectivity.
    Returns user count and connection status.
    """
    try:
        # Execute a simple query to verify connection
        result = db.execute(text("SELECT 1 as connection_test"))
        connection_ok = result.scalar() == 1
        
        # Get user count
        user_count = db.query(models.User).count()
        
        return {
            "status": "success",
            "database_connected": connection_ok,
            "user_count": user_count,
            "database_url": settings.DATABASE_URL.replace("://", "://***:***@"),  # Mask credentials
            "message": "PostgreSQL connection established successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "database_connected": False,
                "error": str(e),
                "message": "Failed to connect to PostgreSQL database"
            }
        )
