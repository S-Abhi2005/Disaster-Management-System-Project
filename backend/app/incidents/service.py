from app.incidents.status import IncidentStatus, ALLOWED_TRANSITIONS

def can_transition(current: IncidentStatus, target: IncidentStatus) -> bool:
    return target in ALLOWED_TRANSITIONS.get(current, set())

def transition_incident(incident, target: IncidentStatus):
    current = incident.status

    if not can_transition(current, target):
        raise ValueError(f"Invalid transition: {current} → {target}")

    incident.status = target
    return incident
