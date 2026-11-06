from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.auth.dependencies import get_current_user
from app.auth.roles import require_role
from app.users.models import User
from app.citizens.models import Citizen
from app.volunteers.models import Volunteer

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    parts = (current_user.full_name or "").split(" ", 1)
    first_name = parts[0] if len(parts) > 0 else ""
    last_name = parts[1] if len(parts) > 1 else ""

    base_data = {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else current_user.role,
        "first_name": first_name,
        "last_name": last_name,
        "phone_number": current_user.phone_number,
        "city": current_user.city
    }
    
    role_str = base_data["role"]
    
    if role_str == "CITIZEN":
        citizen = db.query(Citizen).filter(Citizen.user_id == current_user.id).first()
        if citizen:
            base_data.update({
                "address": citizen.address,
                "age": citizen.age,
                "emergency_contact_name": citizen.emergency_contact_name,
                "emergency_contact_phone": citizen.emergency_contact_phone,
                "preferred_language": citizen.preferred_language
            })
    elif role_str == "VOLUNTEER":
        volunteer = db.query(Volunteer).filter(Volunteer.user_id == current_user.id).first()
        if volunteer:
            base_data.update({
                "volunteer_id": volunteer.id,
                "skill": volunteer.skill.value if hasattr(volunteer.skill, 'value') and volunteer.skill else volunteer.skill,
                "experience_years": volunteer.experience_years,
                "availability": volunteer.availability.value if hasattr(volunteer.availability, 'value') and volunteer.availability else volunteer.availability,
                "vehicle_availability": volunteer.vehicle_availability,
                "vehicle_type": volunteer.vehicle_type.value if hasattr(volunteer.vehicle_type, 'value') and volunteer.vehicle_type else volunteer.vehicle_type,
                "organization": volunteer.organization,
                "is_available": volunteer.is_available
            })
            
    return base_data

@router.get("/admin-only")
def admin_route(
    admin: User = Depends(require_role("ADMIN"))
):
    return {"message": "Welcome Admin"}