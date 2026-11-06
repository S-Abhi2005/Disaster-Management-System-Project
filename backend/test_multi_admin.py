import sys
import os
from pathlib import Path

# Set path so backend app is importable
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from fastapi import HTTPException
from jose import jwt
from app.core.database import SessionLocal
from app.core.config import settings
from app.users.models import User
from app.auth.schemas import Role, AdminUserCreate, AdminUserUpdate, AdminStatusUpdate, UserLogin
from app.auth.roles import require_role
from app.auth.routes import login_json
from app.users.routes import (
    list_admin_accounts,
    create_admin_account,
    update_admin_status,
    update_admin_account,
    delete_admin_account,
)

def run_tests():
    db = SessionLocal()
    print("=" * 60)
    print("STARTING MULTI-ADMIN COMPREHENSIVE TESTS")
    print("=" * 60)

    try:
        # 1. Fetch Super Admin and existing Admin
        super_admin = db.query(User).filter(User.email == "abhishek@gmail.com").first()
        assert super_admin is not None, "Super admin abhishek@gmail.com not found!"
        super_role_val = super_admin.role.value if hasattr(super_admin.role, "value") else str(super_admin.role)
        assert super_role_val == "SUPER_ADMIN", f"Role is {super_admin.role}"
        assert super_admin.is_active is True, "Super admin must be active"
        print(f"[PASS] 1. Super Admin exists with Role.SUPER_ADMIN ({super_admin.email}) and is_active=True")

        admin_user = db.query(User).filter(User.role == Role.ADMIN).first()
        assert admin_user is not None, "Existing admin not found!"
        admin_role_val = admin_user.role.value if hasattr(admin_user.role, "value") else str(admin_user.role)
        print(f"[PASS] 2. Standard Admin found: {admin_user.email} (role: {admin_role_val})")

        # 2. Test Role Checker (RBAC)
        super_checker = require_role("SUPER_ADMIN")
        admin_checker = require_role("ADMIN")

        # Super Admin accesses Super Admin requirement
        assert super_checker(super_admin) == super_admin
        print("[PASS] 3a. Super Admin passes require_role('SUPER_ADMIN')")

        # Super Admin accesses Admin requirement
        assert admin_checker(super_admin) == super_admin
        print("[PASS] 3b. Super Admin passes require_role('ADMIN')")

        # Standard Admin accesses Admin requirement
        assert admin_checker(admin_user) == admin_user
        print("[PASS] 3c. Standard Admin passes require_role('ADMIN')")

        # Standard Admin attempts Super Admin access -> 403
        try:
            super_checker(admin_user)
            assert False, "Admin should NOT pass require_role('SUPER_ADMIN')"
        except HTTPException as e:
            assert e.status_code == 403
            print(f"[PASS] 3d. Standard Admin correctly blocked from require_role('SUPER_ADMIN'): {e.detail}")

        # Volunteer attempts Admin access -> 403
        mock_volunteer = User(email="vol@test.com", role=Role.VOLUNTEER, is_active=True)
        try:
            admin_checker(mock_volunteer)
            assert False, "Volunteer should NOT pass require_role('ADMIN')"
        except HTTPException as e:
            assert e.status_code == 403
            print(f"[PASS] 3e. Volunteer correctly blocked from require_role('ADMIN'): {e.detail}")

        # Citizen attempts Admin access -> 403
        mock_citizen = User(email="cit@test.com", role=Role.CITIZEN, is_active=True)
        try:
            admin_checker(mock_citizen)
            assert False, "Citizen should NOT pass require_role('ADMIN')"
        except HTTPException as e:
            assert e.status_code == 403
            print(f"[PASS] 3f. Citizen correctly blocked from require_role('ADMIN'): {e.detail}")

        # 3. Test Independent Login for Super Admin
        login_res = login_json(
            db=db,
            credentials=UserLogin(email="abhishek@gmail.com", password="nayak321")
        )
        assert "access_token" in login_res
        payload = jwt.decode(login_res["access_token"], settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload.get("role") == "SUPER_ADMIN"
        print(f"[PASS] 4. Super Admin login successful. Token verified. Decoded role: {payload.get('role')}")

        # 4. Super Admin creates a new secondary Admin account
        test_email = "test_district_admin@dm.gov"
        # Cleanup if left over from previous runs
        existing = db.query(User).filter(User.email == test_email).first()
        if existing:
            db.delete(existing)
            db.commit()

        new_admin_data = AdminUserCreate(
            full_name="District Admin",
            email=test_email,
            password="StrongPassword123!",
            role=Role.ADMIN,
            phone_number="9876543210",
            city="Gulbarga"
        )
        created_admin = create_admin_account(admin_data=new_admin_data, super_admin=super_admin, db=db)
        assert created_admin.email == test_email
        created_role_val = created_admin.role.value if hasattr(created_admin.role, "value") else str(created_admin.role)
        assert created_role_val == "ADMIN"
        assert created_admin.is_active is True
        print(f"[PASS] 5. Super Admin successfully created new Admin: {created_admin.email} (id: {created_admin.id})")

        # 5. Test Duplicate Email Prevention
        try:
            create_admin_account(admin_data=new_admin_data, super_admin=super_admin, db=db)
            assert False, "Duplicate email creation should have failed"
        except HTTPException as e:
            assert e.status_code == 400
            print(f"[PASS] 6. Duplicate email prevented: {e.detail}")

        # 6. Test Independent Login for Newly Created Admin
        new_admin_login = login_json(
            db=db,
            credentials=UserLogin(email=test_email, password="StrongPassword123!")
        )
        assert "access_token" in new_admin_login
        payload_new = jwt.decode(new_admin_login["access_token"], settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload_new.get("role") == "ADMIN"
        print(f"[PASS] 7. New Admin logged in independently. Decoded role: {payload_new.get('role')}")

        # 7. Test list_admin_accounts
        admins_list = list_admin_accounts(current_admin=super_admin, db=db)
        assert any(a.email == test_email for a in admins_list)
        print(f"[PASS] 8. list_admin_accounts returns list including new admin (Total admins found: {len(admins_list)})")

        # 8. Test Account Deactivation
        status_res = update_admin_status(
            user_id=created_admin.id,
            status_data=AdminStatusUpdate(is_active=False),
            super_admin=super_admin,
            db=db
        )
        assert status_res.is_active is False
        print(f"[PASS] 9. Super Admin deactivated account for {test_email}")

        # 9. Test Inactive Admin Cannot Log In
        try:
            login_json(
                db=db,
                credentials=UserLogin(email=test_email, password="StrongPassword123!")
            )
            assert False, "Deactivated account should NOT be able to log in"
        except HTTPException as e:
            assert e.status_code == 403
            assert "deactivated" in e.detail.lower()
            print(f"[PASS] 10. Deactivated Admin login blocked with 403: {e.detail}")

        # 10. Test Last Active Super Admin Protection (Deactivation)
        try:
            update_admin_status(
                user_id=super_admin.id,
                status_data=AdminStatusUpdate(is_active=False),
                super_admin=super_admin,
                db=db
            )
            assert False, "Deactivating last Super Admin should fail"
        except HTTPException as e:
            assert e.status_code == 400
            print(f"[PASS] 11. Protection: Cannot deactivate last active Super Admin: {e.detail}")

        # 11. Test Last Active Super Admin Protection (Demotion)
        try:
            update_admin_account(
                user_id=super_admin.id,
                admin_data=AdminUserUpdate(role=Role.ADMIN),
                super_admin=super_admin,
                db=db
            )
            assert False, "Demoting last Super Admin should fail"
        except HTTPException as e:
            assert e.status_code == 400
            print(f"[PASS] 12. Protection: Cannot demote last active Super Admin: {e.detail}")

        # 12. Test Last Active Super Admin Protection (Deletion)
        try:
            delete_admin_account(
                user_id=super_admin.id,
                super_admin=super_admin,
                db=db
            )
            assert False, "Deleting last Super Admin should fail"
        except HTTPException as e:
            assert e.status_code == 400
            print(f"[PASS] 13. Protection: Cannot delete last active Super Admin: {e.detail}")

        # 13. Test Account Reactivation
        reactivate_res = update_admin_status(
            user_id=created_admin.id,
            status_data=AdminStatusUpdate(is_active=True),
            super_admin=super_admin,
            db=db
        )
        assert reactivate_res.is_active is True
        print(f"[PASS] 14. Super Admin reactivated account for {test_email}")

        # 14. Test Reactivated Admin Can Log In Again
        relogin = login_json(
            db=db,
            credentials=UserLogin(email=test_email, password="StrongPassword123!")
        )
        assert "access_token" in relogin
        print(f"[PASS] 15. Reactivated Admin logged in successfully!")

        # 15. Clean up created test admin
        del_res = delete_admin_account(user_id=created_admin.id, super_admin=super_admin, db=db)
        assert del_res["message"] or del_res["success"]
        print(f"[PASS] 16. Cleaned up test admin account ({test_email})")

        print("=" * 60)
        print("ALL MULTI-ADMIN COMPREHENSIVE TESTS PASSED!")
        print("=" * 60)

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
