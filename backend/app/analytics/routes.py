from fastapi import APIRouter, Depends
from app.auth.roles import require_role
from app.core.database import get_db
from sqlalchemy.orm import Session
from app.analytics.compute import (
    incident_summary,
    volunteer_summary,
    resource_summary,
    alerts_today
)
from app.analytics.schemas import (
    IncidentAnalytics,
    VolunteerAnalytics,
    ResourceAnalytics,
    AlertAnalytics
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/incidents", response_model=IncidentAnalytics)
def get_incident_analytics(db: Session = Depends(get_db), admin=Depends(require_role("ADMIN"))):
    return incident_summary(db)

@router.get("/volunteers", response_model=VolunteerAnalytics)
def get_volunteer_analytics(db: Session = Depends(get_db), admin=Depends(require_role("ADMIN"))):
    return volunteer_summary(db)

@router.get("/resources", response_model=ResourceAnalytics)
def get_resource_analytics(db: Session = Depends(get_db), admin=Depends(require_role("ADMIN"))):
    return resource_summary(db)

@router.get("/alerts", response_model=AlertAnalytics)
def get_alert_analytics(db: Session = Depends(get_db), admin=Depends(require_role("ADMIN"))):
    return {"alerts_today": alerts_today(db)}