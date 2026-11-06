from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.security import hash_password
from app.auth.dependencies import get_current_user
from app.auth.roles import require_role
from app.auth.schemas import (
    Role, AdminUserCreate, AdminUserUpdate, AdminStatusUpdate, AdminUserResponse
)
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
        "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        "first_name": first_name,
        "last_name": last_name,
        "phone_number": current_user.phone_number,
        "city": current_user.city,
        "is_active": current_user.is_active if hasattr(current_user, "is_active") else True,
        "created_at": current_user.created_at.isoformat() if hasattr(current_user, "created_at") and current_user.created_at else None,
    }
    
    role_str = base_data["role"].upper()
    
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


# ─── ADMIN MANAGEMENT ENDPOINTS ──────────────────────────────────────────────

@router.get("/admins", response_model=List[AdminUserResponse])
def list_admin_accounts(
    current_admin: User = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """
    List all administrator accounts (Admin and Super Admin).
    Accessible to administrators.
    """
    admins = (
        db.query(User)
        .filter(User.role.in_([Role.ADMIN, Role.SUPER_ADMIN]))
        .order_by(User.id.asc())
        .all()
    )
    result = []
    for a in admins:
        role_str = a.role.value if hasattr(a.role, 'value') else str(a.role)
        result.append(
            AdminUserResponse(
                id=a.id,
                full_name=a.full_name or "",
                email=a.email,
                phone_number=a.phone_number or "",
                city=a.city or "",
                role=role_str,
                is_active=a.is_active if hasattr(a, "is_active") else True,
                created_at=a.created_at if hasattr(a, "created_at") else None,
            )
        )
    return result


@router.post("/admins", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
def create_admin_account(
    admin_data: AdminUserCreate,
    super_admin: User = Depends(require_role("SUPER_ADMIN")),
    db: Session = Depends(get_db)
):
    """
    Create a new administrator account (ADMIN or SUPER_ADMIN).
    Accessible only to Super Admins.
    """
    # 1. Check email uniqueness
    existing_user = db.query(User).filter(User.email == admin_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered with another account"
        )

    # 2. Validate password length
    if len(admin_data.password.strip()) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )

    # 3. Validate role
    role_to_assign = admin_data.role or Role.ADMIN
    if role_to_assign not in [Role.ADMIN, Role.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be ADMIN or SUPER_ADMIN"
        )

    # 4. Create admin user
    hashed = hash_password(admin_data.password.strip())
    new_admin = User(
        full_name=admin_data.full_name.strip(),
        email=admin_data.email.strip().lower(),
        phone_number=admin_data.phone_number or "",
        city=admin_data.city or "",
        hashed_password=hashed,
        role=role_to_assign,
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    role_str = new_admin.role.value if hasattr(new_admin.role, 'value') else str(new_admin.role)
    return AdminUserResponse(
        id=new_admin.id,
        full_name=new_admin.full_name or "",
        email=new_admin.email,
        phone_number=new_admin.phone_number or "",
        city=new_admin.city or "",
        role=role_str,
        is_active=new_admin.is_active,
        created_at=new_admin.created_at,
    )


@router.put("/admins/{user_id}/status", response_model=AdminUserResponse)
def update_admin_status(
    user_id: int,
    status_data: AdminStatusUpdate,
    super_admin: User = Depends(require_role("SUPER_ADMIN")),
    db: Session = Depends(get_db)
):
    """
    Activate or deactivate an admin account.
    Accessible only to Super Admins.
    Prevents deactivating the last active Super Admin.
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user or target_user.role not in [Role.ADMIN, Role.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Administrator account not found"
        )

    # If deactivating a SUPER_ADMIN, check if it's the last active one
    if not status_data.is_active:
        target_role = target_user.role.value if hasattr(target_user.role, 'value') else str(target_user.role)
        if target_role == "SUPER_ADMIN" and target_user.is_active:
            active_super_admins = (
                db.query(User)
                .filter(User.role == Role.SUPER_ADMIN, User.is_active == True)
                .count()
            )
            if active_super_admins <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot deactivate the last active Super Admin account"
                )

    target_user.is_active = status_data.is_active
    db.commit()
    db.refresh(target_user)

    role_str = target_user.role.value if hasattr(target_user.role, 'value') else str(target_user.role)
    return AdminUserResponse(
        id=target_user.id,
        full_name=target_user.full_name or "",
        email=target_user.email,
        phone_number=target_user.phone_number or "",
        city=target_user.city or "",
        role=role_str,
        is_active=target_user.is_active,
        created_at=target_user.created_at,
    )


@router.put("/admins/{user_id}", response_model=AdminUserResponse)
def update_admin_account(
    user_id: int,
    admin_data: AdminUserUpdate,
    super_admin: User = Depends(require_role("SUPER_ADMIN")),
    db: Session = Depends(get_db)
):
    """
    Update administrator account details (name, phone, city, role, optional password).
    Accessible only to Super Admins.
    Prevents demoting the last active Super Admin.
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user or target_user.role not in [Role.ADMIN, Role.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Administrator account not found"
        )

    # If changing email, check uniqueness
    if admin_data.email and admin_data.email.strip().lower() != target_user.email.lower():
        existing = db.query(User).filter(User.email == admin_data.email.strip().lower()).first()
        if existing and existing.id != target_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already used by another account"
            )
        target_user.email = admin_data.email.strip().lower()

    # If changing role away from SUPER_ADMIN
    target_role = target_user.role.value if hasattr(target_user.role, 'value') else str(target_user.role)
    if admin_data.role and admin_data.role != target_user.role:
        new_role_str = admin_data.role.value if hasattr(admin_data.role, 'value') else str(admin_data.role)
        if target_role == "SUPER_ADMIN" and new_role_str != "SUPER_ADMIN":
            active_super_admins = (
                db.query(User)
                .filter(User.role == Role.SUPER_ADMIN, User.is_active == True)
                .count()
            )
            if active_super_admins <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot demote the last active Super Admin account"
                )
        target_user.role = admin_data.role

    if admin_data.full_name is not None:
        target_user.full_name = admin_data.full_name.strip()

    if admin_data.phone_number is not None:
        target_user.phone_number = admin_data.phone_number.strip()

    if admin_data.city is not None:
        target_user.city = admin_data.city.strip()

    if admin_data.password and len(admin_data.password.strip()) >= 6:
        target_user.hashed_password = hash_password(admin_data.password.strip())

    db.commit()
    db.refresh(target_user)

    role_str = target_user.role.value if hasattr(target_user.role, 'value') else str(target_user.role)
    return AdminUserResponse(
        id=target_user.id,
        full_name=target_user.full_name or "",
        email=target_user.email,
        phone_number=target_user.phone_number or "",
        city=target_user.city or "",
        role=role_str,
        is_active=target_user.is_active,
        created_at=target_user.created_at,
    )


@router.delete("/admins/{user_id}", response_model=dict)
def delete_admin_account(
    user_id: int,
    super_admin: User = Depends(require_role("SUPER_ADMIN")),
    db: Session = Depends(get_db)
):
    """
    Delete an administrator account.
    Accessible only to Super Admins.
    Prevents deleting the last active Super Admin or oneself if last.
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user or target_user.role not in [Role.ADMIN, Role.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Administrator account not found"
        )

    target_role = target_user.role.value if hasattr(target_user.role, 'value') else str(target_user.role)
    if target_role == "SUPER_ADMIN":
        active_super_admins = (
            db.query(User)
            .filter(User.role == Role.SUPER_ADMIN, User.is_active == True)
            .count()
        )
        if active_super_admins <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete the last active Super Admin account"
            )

    db.delete(target_user)
    db.commit()
    return {"message": "Administrator account deleted successfully"}