from pydantic import BaseModel
from app.auth.schemas import VolunteerSkill

class VolunteerCreate(BaseModel):
    skill: VolunteerSkill

class VolunteerResponse(BaseModel):
    id: int
    user_id: int
    skill: str
    is_available: bool

    class Config:
        orm_mode = True