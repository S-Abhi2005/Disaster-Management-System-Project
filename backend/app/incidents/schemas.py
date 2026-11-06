from pydantic import BaseModel
from datetime import datetime
from app.incidents.models import IncidentStatus

class IncidentCreate(BaseModel):
    title: str
    description: str
    latitude: float
    longitude: float
    type: str | None = None
    severity: str | None = None

class IncidentResponse(BaseModel):
    id: int
    title: str
    description: str
    latitude: float
    longitude: float
    type: str | None = None
    severity: str | None = None
    status: IncidentStatus
    created_at: datetime
    reported_by: int | None = None
    reported_by_name: str | None = None

    class Config:
        orm_mode = True
