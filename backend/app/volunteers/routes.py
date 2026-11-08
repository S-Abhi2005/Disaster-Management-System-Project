from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.roles import require_role
from app.users.models import User
from app.volunteers.models import Volunteer
from app.volunteers.schemas import VolunteerCreate, VolunteerResponse
from app.assignments.service import log_assignment
from app.analytics.store import VOLUNTEERS

router = APIRouter(prefix="/volunteers", tags=["Volunteers"])

def get_volunteer_completed_count(db: Session, volunteer_id: int) -> int:
    """
    Calculate the total number of unique completed incident assignments for a volunteer.
    An incident assignment is completed when the most recent event action is 'RELEASED'.
    """
    from app.assignments.db_models import AssignmentLog
    logs = (
        db.query(AssignmentLog)
        .filter(
            AssignmentLog.assignment_type == "VOLUNTEER",
            AssignmentLog.subject_id == volunteer_id
        )
        .order_by(AssignmentLog.timestamp.desc(), AssignmentLog.id.desc())
        .all()
    )
    by_incident = {}
    for log in logs:
        if log.incident_id not in by_incident:
            by_incident[log.incident_id] = log.action
    return sum(1 for action in by_incident.values() if action == "RELEASED")


# Volunteer registers
@router.post("/", response_model=VolunteerResponse)
def register_volunteer(
    data: VolunteerCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.role != "VOLUNTEER":
        raise HTTPException(status_code=403, detail="Only volunteers allowed")

    volunteer = Volunteer(
        user_id=user.id,
        skill=data.skill
    )

    db.add(volunteer)
    db.commit()
    db.refresh(volunteer)

    # Analytics hook
    volunteer_dict = {
        "id": volunteer.id,
        "user_id": volunteer.user_id,
        "skill": volunteer.skill,
        "available": volunteer.is_available,
    }
    VOLUNTEERS.append(volunteer_dict)

    return volunteer

# Admin assigns volunteer
@router.put("/{volunteer_id}/assign/{incident_id}")
def assign_volunteer(
    volunteer_id: int,
    incident_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        # Allow passing a User.id (common frontend shape) and map to volunteer record
        volunteer = db.query(Volunteer).filter(Volunteer.user_id == volunteer_id).first()

    user_role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
    if user_role_str.upper() == "VOLUNTEER":
        if not volunteer or volunteer.user_id != user.id:
            raise HTTPException(status_code=403, detail="Volunteers can only accept incidents for themselves")
    elif user_role_str.upper() not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    # Block if volunteer is already assigned (same or different incident)
    if volunteer.is_available is False:
        if volunteer.current_incident_id is not None:
            raise HTTPException(status_code=400, detail="Volunteer is already assigned to an active incident")

    resolved_volunteer_id = volunteer.id

    volunteer.is_available = False
    volunteer.current_incident_id = incident_id
    volunteer.assigned_at = volunteer.assigned_at or __import__('datetime').datetime.utcnow()
    
    from app.incidents.models import Incident
    from app.incidents.schemas import IncidentStatus
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if incident and incident.status in [IncidentStatus.REPORTED, IncidentStatus.VERIFIED]:
        incident.status = IncidentStatus.IN_PROGRESS

    db.commit()

    # Analytics hook
    for vol in VOLUNTEERS:
        if vol["id"] == resolved_volunteer_id:
            vol["available"] = False
            break

    log_assignment(
        assignment_type="VOLUNTEER",
        action="ASSIGNED",
        incident_id=incident_id,
        subject_id=resolved_volunteer_id,
        admin_id=user.id,
        reason="Primary responder"
    )

    return {"message": "Volunteer assigned successfully"}

# Admin releases volunteer
@router.put("/{volunteer_id}/release/{incident_id}")
def release_volunteer(
    volunteer_id: int,
    incident_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    volunteer = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not volunteer:
        volunteer = db.query(Volunteer).filter(Volunteer.user_id == volunteer_id).first()

    user_role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
    if user_role_str.upper() == "VOLUNTEER":
        if not volunteer or volunteer.user_id != user.id:
            raise HTTPException(status_code=403, detail="Volunteers can only release themselves")
    elif user_role_str.upper() not in ["ADMIN", "SUPER_ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    resolved_volunteer_id = volunteer.id

    volunteer.is_available = True
    volunteer.current_incident_id = None
    volunteer.assigned_at = None

    # Update incident status to RESOLVED only when it's actively in progress
    from app.incidents.models import Incident
    from app.incidents.schemas import IncidentStatus
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if incident and incident.status == IncidentStatus.IN_PROGRESS:
        incident.status = IncidentStatus.RESOLVED

    db.commit()

    # Analytics hook
    for vol in VOLUNTEERS:
        if vol["id"] == resolved_volunteer_id:
            vol["available"] = True
            break
    
    log_assignment(
        assignment_type="VOLUNTEER",
        action="RELEASED",
        incident_id=incident_id,
        subject_id=resolved_volunteer_id,
        admin_id=user.id,
        reason="Task completed"
    )

    return {"message": "Volunteer released successfully"}


# View all volunteers
@router.get("/")
def list_volunteers(
    available: bool | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    db: Session = Depends(get_db)
):
    from app.users.models import User
    from app.assignments.db_models import AssignmentLog
    from app.incidents.models import Incident

    query = db.query(Volunteer, User).join(User, Volunteer.user_id == User.id)
    if available is not None:
        query = query.filter(Volunteer.is_available == available)
    
    results = query.offset((page - 1) * limit).limit(limit).all()

    volunteer_ids = [vol.id for vol, _ in results]
    completed_counts = {vid: 0 for vid in volunteer_ids}
    if volunteer_ids:
        logs = (
            db.query(AssignmentLog)
            .filter(
                AssignmentLog.assignment_type == "VOLUNTEER",
                AssignmentLog.subject_id.in_(volunteer_ids)
            )
            .order_by(AssignmentLog.timestamp.desc(), AssignmentLog.id.desc())
            .all()
        )
        by_vol_inc = {}
        for log in logs:
            key = (log.subject_id, log.incident_id)
            if key not in by_vol_inc:
                by_vol_inc[key] = log.action
                if log.action == "RELEASED":
                    completed_counts[log.subject_id] = completed_counts.get(log.subject_id, 0) + 1

    active_inc_ids = [vol.current_incident_id for vol, _ in results if vol.current_incident_id]
    incidents_map = {}
    if active_inc_ids:
        active_incs = db.query(Incident).filter(Incident.id.in_(active_inc_ids)).all()
        incidents_map = {inc.id: f"INC-{inc.id}: {inc.title}" for inc in active_incs}
    
    response = []
    for vol, user in results:
        name_parts = user.full_name.split(" ", 1) if user.full_name else [""]
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        current_assignment = incidents_map.get(vol.current_incident_id) if vol.current_incident_id else None
        
        response.append({
            "id": vol.id,
            "user_id": vol.user_id,
            "first_name": first_name,
            "last_name": last_name,
            "email": user.email,
            "phone_number": user.phone_number,
            "city": user.city,
            "skill": getattr(vol.skill, 'value', vol.skill) if hasattr(vol, 'skill') else None,
            "experience_years": vol.experience_years,
            "availability": getattr(vol.availability, 'value', vol.availability) if hasattr(vol, 'availability') else None,
            "vehicle": vol.vehicle_availability,
            "vehicle_type": getattr(vol.vehicle_type, 'value', vol.vehicle_type) if hasattr(vol, 'vehicle_type') else None,
            "organization": vol.organization,
            "is_available": vol.is_available,
            "assignments_completed": completed_counts.get(vol.id, 0),
            "current_assignment": current_assignment,
            "rating": None,
            "joined_at": user.created_at.isoformat() if getattr(user, 'created_at', None) else "2024-01-01T00:00:00Z"
        })
    return response


# View single volunteer
@router.get("/{volunteer_id}")
def get_volunteer(
    volunteer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.users.models import User
    from app.incidents.models import Incident

    vol = db.query(Volunteer).filter(Volunteer.id == volunteer_id).first()
    if not vol:
        vol = db.query(Volunteer).filter(Volunteer.user_id == volunteer_id).first()
    if not vol:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    user = db.query(User).filter(User.id == vol.user_id).first()
    name_parts = user.full_name.split(" ", 1) if user and user.full_name else [""]
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    current_assignment = None
    if vol.current_incident_id:
        inc = db.query(Incident).filter(Incident.id == vol.current_incident_id).first()
        if inc:
            current_assignment = f"INC-{inc.id}: {inc.title}"

    completed_count = get_volunteer_completed_count(db, vol.id)

    return {
        "id": vol.id,
        "user_id": vol.user_id,
        "first_name": first_name,
        "last_name": last_name,
        "email": user.email if user else "",
        "phone_number": user.phone_number if user else None,
        "city": user.city if user else None,
        "skill": getattr(vol.skill, 'value', vol.skill) if hasattr(vol, 'skill') else None,
        "experience_years": vol.experience_years,
        "availability": getattr(vol.availability, 'value', vol.availability) if hasattr(vol, 'availability') else None,
        "vehicle": vol.vehicle_availability,
        "vehicle_type": getattr(vol.vehicle_type, 'value', vol.vehicle_type) if hasattr(vol, 'vehicle_type') else None,
        "organization": vol.organization,
        "is_available": vol.is_available,
        "assignments_completed": completed_count,
        "current_assignment": current_assignment,
        "rating": None,
        "joined_at": user.created_at.isoformat() if getattr(user, 'created_at', None) else "2024-01-01T00:00:00Z"
    }
