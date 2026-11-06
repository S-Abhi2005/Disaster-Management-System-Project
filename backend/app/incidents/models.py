from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SAEnum
from datetime import datetime
from app.core.database import Base
from app.incidents.status import IncidentStatus

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    type = Column(String, nullable=False, default="Other")
    severity = Column(String, nullable=False, default="medium")

    status = Column(SAEnum(IncidentStatus), default=IncidentStatus.REPORTED)
    created_at = Column(DateTime, default=datetime.utcnow)

    reported_by = Column(Integer, nullable=False)