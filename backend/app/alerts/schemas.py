from pydantic import BaseModel
from datetime import datetime

class AlertCreate(BaseModel):
    title: str
    message: str
    incident_id: int | None = None

class AlertResponse(BaseModel):
    id: int
    title: str
    message: str
    incident_id: int | None
    created_at: datetime

    class Config:
        orm_mode = True
