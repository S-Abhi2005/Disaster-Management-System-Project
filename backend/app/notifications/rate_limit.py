import time

# event_key -> last_sent_timestamp
_LAST_SENT = {}
COOLDOWN_SECONDS = 120  # 2 minutes

def can_send(event_key: str) -> bool:
    now = time.time()
    last = _LAST_SENT.get(event_key, 0)
    if now - last >= COOLDOWN_SECONDS:
        _LAST_SENT[event_key] = now
        return True
    return False