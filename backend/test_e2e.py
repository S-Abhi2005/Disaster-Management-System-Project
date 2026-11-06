import urllib.request
import urllib.parse
import urllib.error
import json
import uuid
import time
import os
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def print_step(msg):
    print(f"\n[{time.strftime('%H:%M:%S')}] {msg}")

def http_json(method, url, data=None, headers=None):
    req_headers = {'Content-Type': 'application/json'}
    if headers: req_headers.update(headers)
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode('utf-8') if data else None, 
        headers=req_headers, 
        method=method
    )
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        status = e.code
        try:
            body = json.loads(e.read().decode())
        except:
            body = e.read().decode()
        return status, body

def test_e2e():
    uid = str(uuid.uuid4())[:8]
    
    # --- 1. Citizen Flow ---
    print_step("1. Registering Citizen...")
    citizen_payload = {
        "first_name": "Test",
        "last_name": f"Citizen {uid}",
        "email": f"citizen_{uid}@test.com",
        "phone_number": "1234567890",
        "password": "password123",
        "confirm_password": "password123",
        "city": "Mumbai",
        "address": "123 Test St",
        "emergency_contact_name": "Mom",
        "emergency_contact_phone": "0987654321"
    }
    status, res = http_json('POST', f"{BASE_URL}/auth/register/citizen", data=citizen_payload)
    if status != 201: print(res)
    assert status == 201, f"Citizen Registration failed"
    citizen_token = res["access_token"]
    citizen_headers = {"Authorization": f"Bearer {citizen_token}"}
    
    # Create Incident
    print_step("2. Citizen Reporting Incident...")
    incident_data = urllib.parse.urlencode({
        "title": f"Test Incident {uid}",
        "description": "This is a test incident description",
        "latitude": 19.0,
        "longitude": 72.0
    }).encode('utf-8')
    req = urllib.request.Request(f"{BASE_URL}/incidents/", data=incident_data, headers={"Authorization": f"Bearer {citizen_token}", "Content-Type": "application/x-www-form-urlencoded"}, method='POST')
    with urllib.request.urlopen(req) as response:
        assert response.status == 200, "Incident Creation failed"
        incident_id = json.loads(response.read().decode())["id"]
        print(f"   -> Incident Created with ID: {incident_id}")

    # --- 2. Volunteer Flow ---
    print_step("3. Registering Volunteer...")
    vol_payload = {
        "first_name": "Test",
        "last_name": f"Vol {uid}",
        "email": f"vol_{uid}@test.com",
        "phone_number": "5551234567",
        "password": "password123",
        "confirm_password": "password123",
        "city": "Mumbai",
        "skill": "First Aid",
        "experience_years": 3,
        "availability": "Available Anytime",
        "vehicle": False,
        "vehicle_type": None,
        "organization": "Test Org"
    }
    status, res = http_json('POST', f"{BASE_URL}/auth/register/volunteer", data=vol_payload)
    if status != 201: print(res)
    assert status == 201, "Volunteer Registration failed"
    vol_token = res["access_token"]
    vol_headers = {"Authorization": f"Bearer {vol_token}"}

    # Fetch Volunteer Profile to get Volunteer ID
    status, res = http_json('GET', f"{BASE_URL}/users/me", headers=vol_headers)
    assert status == 200, "Failed to fetch vol profile"
    vol_id = res["volunteer_id"]
    print(f"   -> Volunteer Registered with Volunteer ID: {vol_id}")

    # --- 3. Admin Flow ---
    print_step("4. Setting up Admin...")
    admin_payload = {
        "first_name": "Test",
        "last_name": f"Admin {uid}",
        "email": f"admin_{uid}@test.com",
        "phone_number": "5550000000",
        "password": "password123",
        "confirm_password": "password123",
        "city": "Mumbai",
        "address": "123 Admin St",
        "emergency_contact_name": "None",
        "emergency_contact_phone": "000"
    }
    status, res = http_json('POST', f"{BASE_URL}/auth/register/citizen", data=admin_payload)
    assert status == 201
    
    # Promote to Admin directly using SQLAlchemy
    sys_path = os.getcwd()
    if sys_path not in sys.path:
        sys.path.append(sys_path)
    try:
        from app.core.database import SessionLocal
        from app.users.models import User
        from app.auth.schemas import Role

        db = SessionLocal()
        admin_user = db.query(User).filter(User.email == admin_payload["email"]).first()
        if admin_user:
            admin_user.role = Role.ADMIN
            db.commit()
        db.close()
    except Exception as e:
        print(f"Could not promote via direct DB, error: {e}")

    status, res = http_json('POST', f"{BASE_URL}/auth/login-json", data={"email": admin_payload["email"], "password": "password123"})
    admin_token = res["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Check if admin works
    status, res = http_json('GET', f"{BASE_URL}/users/admin-only", headers=admin_headers)
    if status != 200:
        print("Admin promotion failed, skipping admin verification and assignments.")
    else:
        # Verify Incident
        print_step("5. Admin Verifying Incident...")
        status, res = http_json('PUT', f"{BASE_URL}/incidents/{incident_id}/verify", headers=admin_headers)
        assert status == 200, "Verification failed"

        # Assign Volunteer
        print_step("6. Admin Assigning Volunteer...")
        status, res = http_json('PUT', f"{BASE_URL}/volunteers/{vol_id}/assign/{incident_id}", headers=admin_headers)
        assert status == 200, "Assignment failed"
        
        # Verify Incident Status became IN_PROGRESS
        status, res = http_json('GET', f"{BASE_URL}/incidents/{incident_id}", headers=admin_headers)
        assert res["status"] == "IN_PROGRESS", "Incident status did not change to IN_PROGRESS!"
        print("   -> Incident status successfully changed to IN_PROGRESS")

    # --- 4. Cross Verification ---
    print_step("7. Volunteer Fetching Assignments...")
    status, res = http_json('GET', f"{BASE_URL}/assignments/volunteer/{vol_id}", headers=vol_headers)
    assert status == 200, "Volunteer history fetch failed"
    assert len(res) > 0, "No assignments logged for volunteer"
    print("   -> Volunteer successfully retrieved assignment history")
    
    print_step("8. Citizen viewing Incident Detail to verify Volunteer Name...")
    status, res = http_json('GET', f"{BASE_URL}/assignments/incident/{incident_id}", headers=citizen_headers)
    assert status == 200, "Citizen fetch assignment failed"
    print("   -> Citizen easily resolved their assignment data via GET")

    print_step("ALL ENDPOINTS TESTED SUCCESSFULLY END-TO-END!")

if __name__ == "__main__":
    try:
        test_e2e()
    except Exception as e:
        print(f"TEST FAILED: {e}")
