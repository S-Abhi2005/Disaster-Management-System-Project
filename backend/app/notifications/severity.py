from enum import Enum

class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    CRITICAL = "CRITICAL"

# What happens for each severity
DELIVERY_RULES = {
    Severity.LOW:    {"popup": False, "sms": False},
    Severity.MEDIUM: {"popup": True,  "sms": False},
    Severity.CRITICAL: {"popup": True, "sms": True},
}