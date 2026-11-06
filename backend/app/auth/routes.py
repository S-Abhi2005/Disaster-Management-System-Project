from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets

from ..core.database import get_db
from ..core.security import hash_password, verify_password, create_access_token
from ..core.config import settings
from ..users.models import User
from ..volunteers.models import Volunteer
from ..citizens.models import Citizen
from .schemas import (
    UserLogin, CitizenCreate, VolunteerCreate, AdminCreate, 
    Token, Role, PasswordResetRequest, PasswordResetConfirm
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register/admin", response_model=dict, status_code=status.HTTP_201_CREATED)
def register_admin(user_data: AdminCreate, db: Session = Depends(get_db)):
    # Validate admin secret
    if user_data.admin_secret != settings.ADMIN_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin secret"
        )
    
    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create admin user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        phone_number="",  # Optional for admin
        hashed_password=hashed_password,
        city="",  # Optional for admin
        role=Role.ADMIN
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "Admin created successfully"}


@router.post("/forgot-password", response_model=dict)
def forgot_password(data: PasswordResetRequest, db: Session = Depends(get_db)):
    """Request password reset token. Returns token directly (for testing). In production, email this token."""
    user = db.query(User).filter(User.email == data.email).first()
    
    # Don't reveal if email exists for security
    if not user:
        return {"message": "If email exists, reset token sent"}
    
    # Generate secure token
    reset_token = secrets.token_urlsafe(32)
    token_expires = datetime.utcnow() + timedelta(hours=1)
    
    # Save to user
    user.reset_token = reset_token
    user.reset_token_expires = token_expires
    db.commit()
    
    # In production: Send email with reset link
    # For now: Return token in response (for testing)
    return {
        "message": "Password reset token generated",
        "token": reset_token,  # Remove this in production - send via email instead
        "expires_in": "1 hour"
    }


@router.post("/reset-password", response_model=dict)
def reset_password(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Reset password using token from forgot-password endpoint."""
    user = db.query(User).filter(User.reset_token == data.token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )
    
    # Check if token expired
    if user.reset_token_expires and datetime.utcnow() > user.reset_token_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token expired"
        )
    
    # Update password
    user.hashed_password = hash_password(data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return {"message": "Password reset successfully"}


@router.post("/register/citizen", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_citizen(user_data: CitizenCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = hash_password(user_data.password)
    new_user = User(
        full_name=f"{user_data.first_name} {user_data.last_name}",
        email=user_data.email,
        phone_number=user_data.phone_number,
        hashed_password=hashed_password,
        city=user_data.city,
        role=Role.CITIZEN
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    citizen_profile = Citizen(
        user_id=new_user.id,
        address=user_data.address,
        emergency_contact_name=user_data.emergency_contact_name,
        emergency_contact_phone=user_data.emergency_contact_phone
    )
    db.add(citizen_profile)
    db.commit()
    
    token = create_access_token({"sub": new_user.email, "role": new_user.role})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/register/volunteer", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_volunteer(user_data: VolunteerCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = hash_password(user_data.password)
    new_user = User(
        full_name=f"{user_data.first_name} {user_data.last_name}",
        email=user_data.email,
        phone_number=user_data.phone_number,
        hashed_password=hashed_password,
        city=user_data.city,
        role=Role.VOLUNTEER
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    volunteer_profile = Volunteer(
        user_id=new_user.id,
        skill=user_data.skill,
        experience_years=user_data.experience_years,
        availability=user_data.availability,
        vehicle_availability=user_data.vehicle,
        vehicle_type=user_data.vehicle_type,
        organization=user_data.organization
    )
    db.add(volunteer_profile)
    db.commit()
    
    token = create_access_token({"sub": new_user.email, "role": new_user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/login-json", response_model=Token)
def login_json(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}
