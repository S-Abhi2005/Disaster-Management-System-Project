from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.roles import require_role
from app.assignments.compute import (
    history_for_incident,
    history_for_subject,
    all_history
)
from app.volunteers.models import Volunteer

router = APIRouter(prefix="/assignments", tags=["Assignment History"])

@router.get("/")
def get_all_history(admin=Depends(require_role("ADMIN"))):
    return all_history()

@router.get("/incident/{incident_id}")
def get_incident_history(incident_id: int, user=Depends(get_current_user)):
    return history_for_incident(incident_id)

@router.get("/volunteer/{volunteer_id}")
def get_volunteer_history(
    volunteer_id: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    events = history_for_subject("VOLUNTEER", volunteer_id)
    if events:
        return events

    # Fallback to persisted assignment after backend restart
    vol = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not vol:
        vol = db.query(Volunteer).filter(Volunteer.user_id == volunteer_id).first()

    if vol and vol.current_incident_id:
        return [
            {
                "assignment_type": "VOLUNTEER",
                "action": "ASSIGNED",
                "incident_id": vol.current_incident_id,
                "subject_id": vol.id,
                "admin_id": vol.user_id,
                "reason": "Primary responder",
                "timestamp": vol.assigned_at,
            }
        ]

    return []

@router.get("/resource/{resource_id}")
def get_resource_history(resource_id: int, user=Depends(get_current_user)):
    return history_for_subject("RESOURCE", resource_id)
