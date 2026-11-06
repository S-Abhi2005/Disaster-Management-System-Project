from fastapi import Depends, HTTPException, status
from app.auth.dependencies import get_current_user
from app.users.models import User

def require_role(*required_roles: str):
    """
    Dependency that verifies the current user has one of the required roles.
    If 'ADMIN' is in required_roles, 'SUPER_ADMIN' is automatically permitted.
    """
    def role_checker(current_user: User = Depends(get_current_user)):
        user_role_str = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        normalized_required = [r.upper() for r in required_roles]
        
        # Super Admin inherits all standard Admin permissions
        if "ADMIN" in normalized_required and "SUPER_ADMIN" not in normalized_required:
            normalized_required.append("SUPER_ADMIN")
            
        if user_role_str.upper() not in normalized_required:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker
