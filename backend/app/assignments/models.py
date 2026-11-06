from datetime import datetime
from typing import Literal, Optional, Dict

AssignmentType = Literal["VOLUNTEER", "RESOURCE"]
ActionType = Literal["ASSIGNED", "RELEASED"]

def assignment_event(
    *,
    assignment_type: AssignmentType,
    action: ActionType,
    incident_id: int,
    subject_id: int,      # volunteer_id OR resource_id
    admin_id: int,
    reason: Optional[str] = None
) -> Dict:
    return {
        "assignment_type": assignment_type,
        "action": action,
        "incident_id": incident_id,
        "subject_id": subject_id,
        "admin_id": admin_id,
        "reason": reason,
        "timestamp": datetime.utcnow(),
    }
