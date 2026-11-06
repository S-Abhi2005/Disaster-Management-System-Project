from app.notifications.severity import Severity, DELIVERY_RULES
from app.notifications.rate_limit import can_send
from app.notifications.sms_sender import send_sms
from app.notifications.ws_manager import manager

async def notify(
    *,
    event_key: str,
    title: str,
    message: str,
    severity: Severity
):
    rules = DELIVERY_RULES[severity]

    # rate-limit per event
    if not can_send(event_key):
        print("Rate-limited:", event_key)
        return

    payload = {
        "title": title,
        "message": message,
        "severity": severity
    }

    if rules["popup"]:
        await manager.send_popup_once(payload)

    if rules["sms"]:
        send_sms(f"[{severity}] {title}: {message}")