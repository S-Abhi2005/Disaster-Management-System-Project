from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.auth.roles import require_role
from app.users.models import User
from app.alerts.models import Alert
from app.alerts.schemas import AlertCreate, AlertResponse

router = APIRouter(prefix="/alerts", tags=["Alerts"])

# Admin sends alert
@router.post("/", response_model=AlertResponse)
def create_alert(
    data: AlertCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("ADMIN"))
):
    alert = Alert(
        title=data.title,
        message=data.message,
        incident_id=data.incident_id
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert

# View all alerts
@router.get("/", response_model=list[AlertResponse])
def list_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).order_by(Alert.created_at.desc()).all()
