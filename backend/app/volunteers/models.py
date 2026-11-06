from sqlalchemy import Column, Integer, String, Boolean, Enum as SAEnum, ForeignKey, DateTime
from datetime import datetime
from ..core.database import Base
from ..auth.schemas import VolunteerSkill, AvailabilityStatus, VehicleType

class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    skill = Column(SAEnum(VolunteerSkill))
    experience_years = Column(Integer)
    availability = Column(SAEnum(AvailabilityStatus))
    vehicle_availability = Column(Boolean)
    vehicle_type = Column(SAEnum(VehicleType), nullable=True)
    organization = Column(String, nullable=True)
    is_available = Column(Boolean, default=True)

    # Persist current assignment so it survives backend restarts
    current_incident_id = Column(Integer, nullable=True)
    assigned_at = Column(DateTime, nullable=True)
