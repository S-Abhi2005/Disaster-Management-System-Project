from collections import defaultdict
from datetime import date

INCIDENTS = []          # list of dicts
VOLUNTEERS = []         # list of dicts
RESOURCES = []          # list of dicts
ALERTS = []             # list of dicts

COUNTERS = {
    "incidents_by_status": defaultdict(int),
    "alerts_by_day": defaultdict(int),
}
