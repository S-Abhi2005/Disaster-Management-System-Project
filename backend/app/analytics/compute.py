from datetime import date, datetime
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.incidents.models import Incident
from app.volunteers.models import Volunteer
from app.resources.models import Resource
from app.alerts.models import Alert


def incident_summary(db: Session):
    """Get incident counts from database."""
    total = db.query(Incident).count()
    
    # Count by status
    status_counts = db.query(Incident.status, func.count(Incident.id))\
        .group_by(Incident.status).all()
    
    by_status = {str(status): count for status, count in status_counts}
    
    return {
        "total_incidents": total,
        "by_status": by_status,
    }


def volunteer_summary(db: Session):
    """Get volunteer counts from database."""
    total = db.query(Volunteer).count()
    active = db.query(Volunteer).filter(Volunteer.is_available == True).count()
    
    return {
        "total_volunteers": total,
        "active_volunteers": active,
        "inactive_volunteers": total - active,
    }


def resource_summary(db: Session):
    """Get resource counts from database."""
    total = db.query(Resource).count()
    available = db.query(Resource).filter(Resource.is_available == True).count()
    
    return {
        "total_resources": total,
        "available_resources": available,
        "in_use_resources": total - available,
    }


def alerts_today(db: Session):
    """Get alerts created today from database."""
    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())
    
    count = db.query(Alert).filter(
        Alert.created_at >= today_start,
        Alert.created_at <= today_end
    ).count()
    
    return count
