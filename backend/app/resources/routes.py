from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.auth.roles import require_role
from app.users.models import User
from app.resources.models import Resource
from app.resources.schemas import ResourceCreate, ResourceResponse
from app.common.pagination import paginate
from app.common.filtering import filter_by_field
from app.analytics.store import RESOURCES
from app.assignments.service import log_assignment

router = APIRouter(prefix="/resources", tags=["Resources"])

# Admin adds resource
@router.post("/", response_model=ResourceResponse)
def add_resource(
    data: ResourceCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("ADMIN"))
):
    resource = Resource(
        name=data.name,
        type=data.type,
        quantity=data.quantity
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)

    # Analytics hook
    resource_dict = {
        "id": resource.id,
        "name": resource.name,
        "type": resource.type,
        "quantity": resource.quantity,
        "available": resource.is_available,
    }
    RESOURCES.append(resource_dict)

    return resource

# View all resources
@router.get("/")
def list_resources(
    available: bool | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100)
):
    data = RESOURCES
    data = filter_by_field(data, "available", available)
    return paginate(data, page, limit)

# Assign resource to incident
@router.put("/{resource_id}/assign/{incident_id}")
def assign_resource(
    resource_id: int,
    incident_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("ADMIN"))
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()

    if not resource or not resource.is_available:
        raise HTTPException(status_code=404, detail="Resource not available")

    resource.is_available = False
    resource.assigned_incident_id = incident_id
    db.commit()

    # Analytics hook
    for res in RESOURCES:
        if res["id"] == resource_id:
            res["available"] = False
            break

    log_assignment(
        assignment_type="RESOURCE",
        action="ASSIGNED",
        incident_id=incident_id,
        subject_id=resource_id,
        admin_id=admin.id,
        reason="Emergency transport"
    )

    return {"message": "Resource assigned successfully"}

# Admin releases resource
@router.put("/{resource_id}/release/{incident_id}")
def release_resource(
    resource_id: int,
    incident_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("ADMIN"))
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    resource.is_available = True
    resource.assigned_incident_id = None
    db.commit()

    # Analytics hook
    for res in RESOURCES:
        if res["id"] == resource_id:
            res["available"] = True
            break

    log_assignment(
        assignment_type="RESOURCE",
        action="RELEASED",
        incident_id=incident_id,
        subject_id=resource_id,
        admin_id=admin.id,
        reason="Task completed"
    )

    return {"message": "Resource released successfully"}
