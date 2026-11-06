from enum import Enum

class IncidentStatus(str, Enum):
    REPORTED = "REPORTED"
    VERIFIED = "VERIFIED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    ARCHIVED = "ARCHIVED"

# Allowed transitions
ALLOWED_TRANSITIONS = {
    IncidentStatus.REPORTED: {IncidentStatus.VERIFIED},
    IncidentStatus.VERIFIED: {IncidentStatus.IN_PROGRESS},
    IncidentStatus.IN_PROGRESS: {IncidentStatus.RESOLVED},
    IncidentStatus.RESOLVED: {IncidentStatus.ARCHIVED},
    IncidentStatus.ARCHIVED: set(),   # terminal
}
