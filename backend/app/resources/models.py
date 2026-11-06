from sqlalchemy import Column, Integer, String, Boolean
from app.core.database import Base

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    is_available = Column(Boolean, default=True)
    assigned_incident_id = Column(Integer, nullable=True)
