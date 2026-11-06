from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.core.database import Base


class AssignmentLog(Base):
    __tablename__ = "assignment_logs"

    id = Column(Integer, primary_key=True, index=True)
    assignment_type = Column(String, nullable=False)   # "VOLUNTEER" | "RESOURCE"
    action = Column(String, nullable=False)            # "ASSIGNED" | "RELEASED"
    incident_id = Column(Integer, nullable=False)
    subject_id = Column(Integer, nullable=False)       # volunteer_id or resource_id
    admin_id = Column(Integer, nullable=True)
    reason = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
