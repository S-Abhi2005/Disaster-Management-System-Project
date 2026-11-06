# # adminlogin.py - Run this in backend folder
# from app.core.database import SessionLocal
# from app.core.security import hash_password
# from app.users.models import User
# from app.auth.schemas import Role

# def seed_admin():
#     db = SessionLocal()
#     try:
#         user = db.query(User).filter(User.email =="abhishek@gmail.com").first()
#         hashed = hash_password("nayak321")
#         if user:
#             print("Admin already exists. Updating password...")
#             user.hashed_password = hashed
#             user.role = Role.ADMIN
#         else:
#             print("Creating new admin...")
#             user = User(
#                 full_name="Admin User",
#                 email="admin@test.com",
#                 phone_number="7777777777",
#                 hashed_password=hashed,
#                 city="Hyderabad",
#                 role=Role.ADMIN
#             )
#             db.add(user)
#         db.commit()
#         print("Admin ready: admin@test.com / admin1234")
#     finally:
#         db.close()

# if __name__ == "__main__":
#     seed_admin()




# adminlogin.py - Run inside backend folder

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.users.models import User
from app.auth.schemas import Role

def seed_admin():
    db = SessionLocal()

    email = "abhishek@gmail.com"
    password = "nayak321"

    try:
        user = db.query(User).filter(User.email == email).first()
        hashed = hash_password(password)

        if user:
            print("Super Admin already exists. Updating...")
            user.hashed_password = hashed
            user.role = Role.SUPER_ADMIN
            user.is_active = True
        else:
            print("Creating new Super Admin...")
            user = User(
                full_name="Abhishek",
                email=email,
                phone_number="7777777777",
                hashed_password=hashed,
                city="Yadgir",
                role=Role.SUPER_ADMIN,
                is_active=True
            )
            db.add(user)

        db.commit()
        print(f"Super Admin ready: {email} / {password} (Role: SUPER_ADMIN)")

    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
