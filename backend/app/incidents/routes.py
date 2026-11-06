from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.roles import require_role
from app.users.models import User
from app.incidents.models import Incident
from app.incidents.schemas import IncidentCreate, IncidentResponse
from app.common.pagination import paginate
from app.incidents.status import IncidentStatus
from app.incidents.service import transition_incident

from sqlalchemy.exc import IntegrityError


router = APIRouter(prefix="/incidents", tags=["Incidents"])

# Citizen creates incident (with optional photo)
@router.post("/", response_model=IncidentResponse)
async def create_incident(
    title: str = Form(..., description="Incident title"),
    description: str = Form(..., description="Incident description"),
    latitude: float = Form(..., description="Latitude coordinate"),
    longitude: float = Form(..., description="Longitude coordinate"),
    type: str | None = Form(None, description="Incident type"),
    severity: str | None = Form(None, description="Incident severity"),
    photo: UploadFile | None = File(None, description="Optional incident photo (jpg, png, gif, max 5MB)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new incident with optional photo upload."""
    import uuid
    from pathlib import Path
    
    # Create incident first
    incident = Incident(
        title=title,
        description=description,
        latitude=latitude,
        longitude=longitude,
        type=type or "Other",
        severity=severity or "medium",
        reported_by=current_user.id
    )
    
    db.add(incident)
    db.commit()
    db.refresh(incident)
    
    # Handle optional photo upload
    if photo:
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif'}
        file_ext = Path(photo.filename).suffix.lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type. Allowed: {allowed_extensions}"
            )
        
        upload_dir = Path("uploads/incidents")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = upload_dir / unique_filename
        
        try:
            content = await photo.read()
            
            if len(content) > 5 * 1024 * 1024:
                raise HTTPException(status_code=400, detail="File too large (max 5MB)")
            
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Add photo info to response (in production, save to DB)
            incident.photo_uploaded = True
            incident.photo_filename = unique_filename
            
        except Exception as e:
            # Don't fail incident creation if photo upload fails
            incident.photo_uploaded = False
        finally:
            await photo.close()

    return {
        "id": incident.id,
        "title": incident.title,
        "description": incident.description,
        "latitude": incident.latitude,
        "longitude": incident.longitude,
        "type": incident.type,
        "severity": incident.severity,
        "status": incident.status,
        "created_at": incident.created_at,
        "reported_by": incident.reported_by,
        "reported_by_name": current_user.full_name,
    }

# Admin verifies incident
@router.put("/{incident_id}/verify")
def verify_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("ADMIN"))
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    try:
        transition_incident(incident, IncidentStatus.VERIFIED)
        db.commit()
        return {"message": "Incident verified"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{incident_id}", response_model=dict)
def delete_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("ADMIN")),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    try:
        db.delete(incident)
        db.commit()
        return {"message": "Incident deleted"}
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Incident cannot be deleted because it is referenced by other records")


@router.get("/my")
def list_my_incidents(
    db: Session = Depends(get_db),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Incident).filter(Incident.reported_by == current_user.id)
    if status:
        query = query.filter(Incident.status == status)

    incidents = query.all()
    formatted_incidents = []
    for incident in incidents:
        inc_dict = {
            "id": incident.id,
            "title": incident.title,
            "description": incident.description,
            "latitude": incident.latitude,
            "longitude": incident.longitude,
            "type": getattr(incident, "type", None),
            "severity": getattr(incident, "severity", None),
            "status": incident.status.value if hasattr(incident.status, "value") else incident.status,
            "created_at": incident.created_at,
            "reported_by": incident.reported_by,
            "reported_by_name": current_user.full_name,
        }
        formatted_incidents.append(inc_dict)

    return paginate(formatted_incidents, page, limit)

# Admin starts work on incident
@router.put("/{incident_id}/start")
def start_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("ADMIN"))
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    try:
        # Auto-verify REPORTED incidents so admin can activate in one click
        if incident.status == IncidentStatus.REPORTED:
            transition_incident(incident, IncidentStatus.VERIFIED)
            transition_incident(incident, IncidentStatus.IN_PROGRESS)
        elif incident.status in (IncidentStatus.RESOLVED, IncidentStatus.VERIFIED):
            # Admin can reactivate resolved/verified incidents directly
            incident.status = IncidentStatus.IN_PROGRESS
        else:
            transition_incident(incident, IncidentStatus.IN_PROGRESS)
        db.commit()
        return {"message": "Incident in progress"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Admin resolves incident
@router.put("/{incident_id}/resolve")
def resolve_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("ADMIN"))
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    try:
        transition_incident(incident, IncidentStatus.RESOLVED)
        db.commit()
        return {"message": "Incident resolved"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Admin archives incident
@router.put("/{incident_id}/archive")
def archive_incident_endpoint(
    incident_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("ADMIN"))
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()

    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    if incident.status != IncidentStatus.RESOLVED:
        raise HTTPException(status_code=400, detail="Only resolved incidents can be archived")

    try:
        transition_incident(incident, IncidentStatus.ARCHIVED)
        db.commit()
        return {"message": "Incident archived"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# View all incidents
@router.get("/")
def list_incidents(
    db: Session = Depends(get_db),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100)
):
    from app.users.models import User
    query = db.query(Incident, User.full_name.label("reported_by_name")).join(User, Incident.reported_by == User.id)
    if status:
        query = query.filter(Incident.status == status)

    results = query.all()
    incidents_with_names = []
    for incident, reported_by_name in results:
        inc_dict = {
            "id": incident.id,
            "title": incident.title,
            "description": incident.description,
            "latitude": incident.latitude,
            "longitude": incident.longitude,
            "type": getattr(incident, "type", None),
            "severity": getattr(incident, "severity", None),
            "status": incident.status.value if hasattr(incident.status, "value") else incident.status,
            "created_at": incident.created_at,
            "reported_by": incident.reported_by,
            "reported_by_name": reported_by_name,
        }
        incidents_with_names.append(inc_dict)

    return paginate(incidents_with_names, page, limit)

# Location-based incident search
@router.get("/nearby")
def get_nearby_incidents(
    lat: float = Query(..., description="Latitude of center point", ge=-90, le=90),
    lng: float = Query(..., description="Longitude of center point", ge=-180, le=180),
    radius_km: float = Query(10.0, description="Search radius in kilometers", gt=0, le=500),
    status: str | None = Query(None, description="Filter by incident status"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Find incidents within a specified radius (in km) from a given latitude/longitude.
    Uses Haversine formula for accurate distance calculation.
    """
    from math import radians, cos, sin, asin, sqrt
    
    # Earth radius in kilometers
    R = 6371
    
    # Convert inputs to radians
    lat_rad = radians(lat)
    lng_rad = radians(lng)
    
    # Build query
    query = db.query(Incident)
    
    # Apply status filter if provided
    if status:
        query = query.filter(Incident.status == status)
    
    # Get all incidents
    all_incidents = query.all()
    
    nearby_incidents = []
    for incident in all_incidents:
        # Convert incident coordinates to radians
        incident_lat = radians(incident.latitude)
        incident_lng = radians(incident.longitude)
        
        # Haversine formula
        dlat = incident_lat - lat_rad
        dlng = incident_lng - lng_rad
        
        a = sin(dlat/2)**2 + cos(lat_rad) * cos(incident_lat) * sin(dlng/2)**2
        c = 2 * asin(sqrt(a))
        distance = R * c
        
        if distance <= radius_km:
            incident_dict = {
                "id": incident.id,
                "title": incident.title,
                "description": incident.description,
                "latitude": incident.latitude,
                "longitude": incident.longitude,
                "type": getattr(incident, "type", None),
                "severity": getattr(incident, "severity", None),
                "status": incident.status.value if hasattr(incident.status, 'value') else incident.status,
                "created_at": incident.created_at,
                "reported_by": incident.reported_by,
                "distance_km": round(distance, 2)
            }
            nearby_incidents.append(incident_dict)
    
    # Sort by distance (closest first)
    nearby_incidents.sort(key=lambda x: x["distance_km"])
    
    return nearby_incidents[:limit]


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: int,
    db: Session = Depends(get_db),
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    reporter = db.query(User).filter(User.id == incident.reported_by).first()
    return {
        "id": incident.id,
        "title": incident.title,
        "description": incident.description,
        "latitude": incident.latitude,
        "longitude": incident.longitude,
        "type": getattr(incident, "type", None),
        "severity": getattr(incident, "severity", None),
        "status": incident.status,
        "created_at": incident.created_at,
        "reported_by": incident.reported_by,
        "reported_by_name": reporter.full_name if reporter else None,
    }


# File upload for incident photos
@router.post("/{incident_id}/photos")
async def upload_incident_photo(
    incident_id: int,
    file: UploadFile = File(..., description="Image file (jpg, png, gif)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a photo for an incident. 
    Allowed formats: jpg, jpeg, png, gif
    Max size: 5MB
    """
    import os
    import uuid
    from pathlib import Path
    
    # Check if incident exists
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # Validate file type
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif'}
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed: {allowed_extensions}"
        )
    
    # Create upload directory
    upload_dir = Path("uploads/incidents")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = upload_dir / unique_filename
    
    # Save file
    try:
        content = await file.read()
        
        # Check file size (5MB max)
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large (max 5MB)")
        
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    finally:
        await file.close()
    
    return {
        "message": "Photo uploaded successfully",
        "filename": unique_filename,
        "original_name": file.filename,
        "incident_id": incident_id,
        "uploaded_by": current_user.id,
        "file_path": str(file_path)
    }


@router.get("/{incident_id}/photos")
def get_incident_photos(
    incident_id: int,
    db: Session = Depends(get_db)
):
    """List all photos uploaded for a specific incident."""
    import os
    from pathlib import Path
    
    # Check if incident exists
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    
    # List files in incident upload directory
    upload_dir = Path("uploads/incidents")
    
    if not upload_dir.exists():
        return {"incident_id": incident_id, "photos": []}
    
    # In a real app, you'd store photo metadata in database
    # For now, return all files (simplified approach)
    photos = []
    for file_path in upload_dir.iterdir():
        if file_path.is_file():
            photos.append({
                "filename": file_path.name,
                "url": f"/uploads/incidents/{file_path.name}",
                "size_bytes": file_path.stat().st_size
            })
    
    return {
        "incident_id": incident_id,
        "photos": photos,
        "total": len(photos)
    }
