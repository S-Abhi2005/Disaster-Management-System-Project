from pydantic import BaseModel, EmailStr, ConfigDict
from enum import Enum
from typing import Optional

# Enums for controlled vocabulary as per your requirements
class Role(str, Enum):
    CITIZEN = "CITIZEN"
    VOLUNTEER = "VOLUNTEER"
    ADMIN = "ADMIN"

class VolunteerSkill(str, Enum):
    FIRST_AID = "First Aid"
    MEDICAL_SUPPORT = "Medical Support"
    SEARCH_AND_RESCUE = "Search & Rescue"
    LOGISTICS = "Logistics"
    FOOD_DISTRIBUTION = "Food Distribution"
    SHELTER_MANAGEMENT = "Shelter Management"
    OTHER = "Other"

class AvailabilityStatus(str, Enum):
    AVAILABLE_ANYTIME = "Available Anytime"
    WEEKENDS_ONLY = "Weekends Only"
    EMERGENCY_ONLY = "Emergency Only"

class VehicleType(str, Enum):
    BIKE = "Bike"
    CAR = "Car"
    VAN = "Van"
    BOAT = "Boat"

# --- Schemas for User Creation based on your payload examples ---

class CitizenCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # Based on your payload example for citizen
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: str
    password: str
    city: str
    address: str
    emergency_contact_name: str
    emergency_contact_phone: str

class VolunteerCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    # Based on your payload example for volunteer
    first_name: str
    last_name: str
    email: EmailStr
    phone_number: str
    password: str
    city: str
    skill: VolunteerSkill
    experience_years: int
    availability: AvailabilityStatus
    vehicle: bool  # Maps to vehicle_availability
    vehicle_type: Optional[VehicleType] = None
    organization: Optional[str] = None

# --- Other Schemas ---

class UserLogin(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email: EmailStr
    password: str

class Token(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    access_token: str
    token_type: str = "bearer"


class AdminCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    full_name: str
    email: EmailStr
    password: str
    admin_secret: str


class PasswordResetRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    token: str
    new_password: str
