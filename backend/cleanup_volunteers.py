import sys
sys.path.insert(0, '.')

from app.core.database import SessionLocal
from app.volunteers.models import Volunteer
from app.users.models import User

db = SessionLocal()

# IDs to KEEP: sruthi (vol id 3), hithasai (vol id 8)
keep_vol_ids = {3, 8}

volunteers = db.query(Volunteer).all()
print("Current volunteers:")
for v in volunteers:
    user = db.query(User).filter(User.id == v.user_id).first()
    email = user.email if user else "unknown"
    tag = "KEEP" if v.id in keep_vol_ids else "DELETE"
    print(f"  [{tag}] vol_id={v.id} name={user.full_name if user else '?'} email={email}")

print()

to_delete = [v for v in volunteers if v.id not in keep_vol_ids]

for v in to_delete:
    user = db.query(User).filter(User.id == v.user_id).first()
    # Delete the volunteer record first
    db.delete(v)
    # Also delete the associated user if they are test/demo accounts (not real users)
    if user and ('test' in user.email.lower() or 'volunteer1@test' in user.email):
        print(f"Deleting user {user.email}")
        db.delete(user)

db.commit()
db.close()
print()
print("Done! Remaining volunteers:")

db2 = SessionLocal()
for v in db2.query(Volunteer).all():
    user = db2.query(User).filter(User.id == v.user_id).first()
    print(f"  vol_id={v.id} name={user.full_name if user else '?'} email={user.email if user else '?'}")
db2.close()
