import requests
import os

ANDROID_SMS_GATEWAY_URL = os.getenv("ANDROID_SMS_GATEWAY_URL")
ADMIN_PHONE = os.getenv("ADMIN_PHONE")

def send_sms(message: str):
    if not ANDROID_SMS_GATEWAY_URL or not ADMIN_PHONE:
        print("SMS config missing; skipping SMS")
        return

    payload = {
        "phone": ADMIN_PHONE,
        "message": message
    }
    try:
        requests.post(ANDROID_SMS_GATEWAY_URL, json=payload, timeout=5)
        print("SMS sent")
    except Exception as e:
        print("SMS failed:", e)