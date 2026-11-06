from pydantic import BaseModel

class ResourceCreate(BaseModel):
    name: str
    type: str
    quantity: int

class ResourceResponse(BaseModel):
    id: int
    name: str
    type: str
    quantity: int
    is_available: bool
    assigned_incident_id: int | None

    class Config:
        orm_mode = True
