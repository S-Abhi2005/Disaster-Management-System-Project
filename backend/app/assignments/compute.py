from app.assignments.store import ASSIGNMENT_EVENTS


def _db_all():
    """Fetch all assignment logs from the database."""
    try:
        from app.core.database import SessionLocal
        from app.assignments.db_models import AssignmentLog
        db = SessionLocal()
        rows = db.query(AssignmentLog).order_by(AssignmentLog.timestamp.desc()).all()
        db.close()
        return [
            {
                "id": r.id,
                "assignment_type": r.assignment_type,
                "action": r.action,
                "incident_id": r.incident_id,
                "subject_id": r.subject_id,
                "admin_id": r.admin_id,
                "reason": r.reason,
                "timestamp": r.timestamp,
            }
            for r in rows
        ]
    except Exception:
        return []


def history_for_incident(incident_id: int):
    mem = [e for e in ASSIGNMENT_EVENTS if e["incident_id"] == incident_id]
    if mem:
        return mem
    return [e for e in _db_all() if e["incident_id"] == incident_id]


def history_for_subject(assignment_type: str, subject_id: int):
    mem = [
        e for e in ASSIGNMENT_EVENTS
        if e["assignment_type"] == assignment_type and e["subject_id"] == subject_id
    ]
    if mem:
        return mem
    return [
        e for e in _db_all()
        if e["assignment_type"] == assignment_type and e["subject_id"] == subject_id
    ]


def all_history():
    # Merge in-memory + DB (de-dup by id, prefer in-memory for recent)
    db_events = _db_all()
    if not ASSIGNMENT_EVENTS:
        return db_events
    # In-memory is the authoritative recent set; DB has older persisted ones
    mem_ids = {id(e) for e in ASSIGNMENT_EVENTS}
    # Return DB list (which includes everything persisted including current session)
    return db_events
