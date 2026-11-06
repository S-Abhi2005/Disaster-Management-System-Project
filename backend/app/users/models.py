from sqlalchemy import Column, Integer, String, Enum as SAEnum, DateTime
from datetime import datetime
from ..core.database import Base
from ..auth.schemas import Role

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    city = Column(String, nullable=True)
    role = Column(SAEnum(Role), nullable=False)
    
    # Password reset fields
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)
