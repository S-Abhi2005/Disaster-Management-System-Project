from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from ..core.database import Base

class Citizen(Base):
    __tablename__ = "citizens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    address = Column(String)
    age = Column(Integer)
    emergency_contact_name = Column(String)
    emergency_contact_phone = Column(String)
    preferred_language = Column(String)
    allow_gps_location = Column(Boolean)
