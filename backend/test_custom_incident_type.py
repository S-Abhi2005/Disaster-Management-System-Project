import sys
import os
import asyncio
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from fastapi import HTTPException
from app.core.database import SessionLocal, engine
from app.main import on_startup
from app.users.models import User
from app.incidents.models import Incident
from app.incidents.routes import create_incident, list_incidents, list_my_incidents, get_incident, get_nearby_incidents
from app.auth.schemas import Role

async def run_tests():
    print("=" * 65)
    print("STARTING CUSTOM INCIDENT TYPE TESTS")
    print("=" * 65)

    # 1. Ensure startup DB migration has run (custom_type column added if missing)
    on_startup()
    print("[PASS] 1. Database schema migration executed (custom_type column present)")

    db = SessionLocal()
    created_incident_ids = []

    try:
        # Fetch or mock a citizen user
        citizen = db.query(User).filter(User.role == Role.CITIZEN).first()
        if not citizen:
            citizen = User(
                full_name="Test Citizen",
                email="test_citizen_custom@dm.gov",
                role=Role.CITIZEN,
                is_active=True
            )
            db.add(citizen)
            db.commit()
            db.refresh(citizen)
        print(f"[PASS] 2. Citizen user found/ready: {citizen.email} (id: {citizen.id})")

        # 2. Test predefined incident types (e.g. 'Flood', 'Fire', 'Earthquake')
        predefined_types = [
            'Flood', 'Cyclone', 'Earthquake', 'Fire', 'Landslide',
            'Structural Collapse', 'Medical Emergency', 'Hazardous Material',
            'Road Accident', 'Power Outage', 'Water Shortage'
        ]

        for p_type in predefined_types[:3]:  # Test sample predefined
            inc = await create_incident(
                title=f"Sample {p_type} incident test",
                description="Testing predefined incident type submission without custom type.",
                latitude=16.7666,
                longitude=77.1376,
                type=p_type,
                custom_type=None,
                severity="medium",
                photo=None,
                db=db,
                current_user=citizen
            )
            created_incident_ids.append(inc["id"])
            assert inc["type"] == p_type, f"Expected {p_type}, got {inc['type']}"
            assert inc.get("custom_type") is None, f"Expected None for custom_type, got {inc.get('custom_type')}"
            print(f"[PASS] 3. Predefined incident type '{p_type}' submitted & saved correctly (id: {inc['id']})")

        # 3. Test 'Other' with EMPTY custom field -> must raise 400 Bad Request
        try:
            await create_incident(
                title="Invalid other incident test",
                description="This should fail because Other is selected without specifying custom type.",
                latitude=16.7666,
                longitude=77.1376,
                type="Other",
                custom_type="",
                severity="high",
                photo=None,
                db=db,
                current_user=citizen
            )
            assert False, "Should have raised HTTPException for empty custom_type when type is Other"
        except HTTPException as e:
            assert e.status_code == 400
            assert "specify" in e.detail.lower()
            print(f"[PASS] 4. Validation correctly blocked 'Other' with empty custom field: {e.detail}")

        # 4. Test 'Other' with valid custom incident types
        custom_test_cases = [
            ("Gas Leakage", "critical"),
            ("Building Crack", "high"),
            ("Animal Attack", "medium"),
            ("Tree Falling", "low"),
            ("Water Contamination", "high")
        ]

        for custom_name, sev in custom_test_cases:
            created = await create_incident(
                title=f"Emergency: {custom_name} in sector 4",
                description=f"Detailed report for {custom_name}. Urgent attention requested by citizen.",
                latitude=16.7666,
                longitude=77.1376,
                type="Other",
                custom_type=custom_name,
                severity=sev,
                photo=None,
                db=db,
                current_user=citizen
            )
            created_incident_ids.append(created["id"])
            assert created["type"] == custom_name, f"Expected type to be '{custom_name}', got '{created['type']}'"
            assert created["custom_type"] == custom_name, f"Expected custom_type to be '{custom_name}', got '{created['custom_type']}'"
            print(f"[PASS] 5. Custom incident '{custom_name}' created successfully with type='{created['type']}' (id: {created['id']})")

        # 5. Verify custom incident retrieved via get_incident
        latest_id = created_incident_ids[-1]
        fetched = get_incident(incident_id=latest_id, db=db)
        assert fetched["type"] == "Water Contamination"
        assert fetched["custom_type"] == "Water Contamination"
        print(f"[PASS] 6. GET /incidents/{latest_id} returns actual custom type '{fetched['type']}'")

        # 6. Verify custom incident retrieved via list_incidents (Admin view)
        admin_list = list_incidents(db=db, status=None, page=1, limit=50)
        items = admin_list.get("items", [])
        found_custom = [item for item in items if item["id"] == latest_id]
        assert len(found_custom) == 1
        assert found_custom[0]["type"] == "Water Contamination"
        print(f"[PASS] 7. Admin list_incidents displays custom type '{found_custom[0]['type']}'")

        # 7. Verify custom incident retrieved via list_my_incidents (Citizen view)
        my_list = list_my_incidents(db=db, status=None, page=1, limit=50, current_user=citizen)
        my_items = my_list.get("items", [])
        my_found = [item for item in my_items if item["id"] == latest_id]
        assert len(my_found) == 1
        assert my_found[0]["type"] == "Water Contamination"
        print(f"[PASS] 8. Citizen list_my_incidents displays custom type '{my_found[0]['type']}'")

        # 8. Verify custom incident retrieved via get_nearby_incidents
        nearby = get_nearby_incidents(lat=16.7666, lng=77.1376, radius_km=10.0, status=None, limit=50, db=db)
        nearby_found = [item for item in nearby if item["id"] == latest_id]
        assert len(nearby_found) == 1
        assert nearby_found[0]["type"] == "Water Contamination"
        print(f"[PASS] 9. Nearby incidents displays custom type '{nearby_found[0]['type']}'")

        # 9. Verify existing incidents continue to work
        all_incidents = db.query(Incident).all()
        assert len(all_incidents) >= len(created_incident_ids)
        for inc in all_incidents:
            assert inc.type is not None and len(inc.type) > 0
        print(f"[PASS] 10. Existing incidents verified intact (Total: {len(all_incidents)} incidents in database)")

        print("=" * 65)
        print("ALL CUSTOM INCIDENT TYPE TESTS PASSED SUCCESSFULLY!")
        print("=" * 65)

    finally:
        # Cleanup test incidents
        if created_incident_ids:
            db.query(Incident).filter(Incident.id.in_(created_incident_ids)).delete(synchronize_session=False)
            db.commit()
            print(f"[INFO] Cleaned up {len(created_incident_ids)} temporary test incidents.")
        db.close()

if __name__ == "__main__":
    asyncio.run(run_tests())

