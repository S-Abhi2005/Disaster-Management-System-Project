from pydantic import BaseModel
from typing import Dict

class IncidentAnalytics(BaseModel):
    total_incidents: int
    by_status: Dict[str, int]

class VolunteerAnalytics(BaseModel):
    total_volunteers: int
    active_volunteers: int
    inactive_volunteers: int

class ResourceAnalytics(BaseModel):
    total_resources: int
    available_resources: int
    in_use_resources: int

class AlertAnalytics(BaseModel):
    alerts_today: int
