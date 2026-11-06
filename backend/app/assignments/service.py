from app.assignments.store import ASSIGNMENT_EVENTS
from app.assignments.models import assignment_event


def log_assignment(**kwargs):
    # Keep in-memory store for fast in-process lookups (backward compat)
    event = assignment_event(**kwargs)
    ASSIGNMENT_EVENTS.append(event)

    # Also persist to DB so data survives restarts
    try:
        from app.core.database import SessionLocal
        from app.assignments.db_models import AssignmentLog
        db = SessionLocal()
        log = AssignmentLog(
            assignment_type=event["assignment_type"],
            action=event["action"],
            incident_id=event["incident_id"],
            subject_id=event["subject_id"],
            admin_id=event.get("admin_id"),
            reason=event.get("reason"),
            timestamp=event["timestamp"],
        )
        db.add(log)
        db.commit()
        db.close()
    except Exception as e:
        pass  # Don't let DB errors break the assignment flow
