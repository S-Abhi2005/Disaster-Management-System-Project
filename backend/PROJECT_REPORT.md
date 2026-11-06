# Disaster Response System - Backend Project Report

## 1. Project Overview

**Project Name**: Disaster Response System  
**Framework**: FastAPI (Python)  
**Database**: PostgreSQL (production-ready relational database)  
**Authentication**: JWT with HTTPBearer  
**Documentation**: Swagger UI at `/docs`

**Purpose**: A backend API for managing disaster response operations including incident reporting, volunteer coordination, resource allocation, geolocation-based search, real-time alerts, and photo uploads.

---

## 2. Architecture & Tech Stack

### Core Technologies
- **FastAPI**: Modern async web framework
- **SQLAlchemy**: ORM for database operations
- **Pydantic**: Data validation and serialization
- **python-jose**: JWT token handling
- **passlib + bcrypt**: Password hashing
- **PostgreSQL**: Production relational database with connection pooling
- **python-multipart**: Form data parsing for OAuth2

### Security
- JWT access tokens (60-minute expiry)
- Role-based access control (RBAC): CITIZEN, VOLUNTEER, ADMIN
- HTTPBearer token authentication (simple paste in Swagger)
- Password hashing with bcrypt
- Admin secret key protection for admin registration
- Secure password reset tokens (1-hour expiry)

---

## 3. Database Models

### User Model (app/users/models.py)
```python
class User(Base):
    id: Integer (PK)
    full_name: String
    email: String (unique)
    phone_number: String
    hashed_password: String
    city: String
    role: Enum(CITIZEN/VOLUNTEER/ADMIN)
    reset_token: String (nullable)  # Password reset
    reset_token_expires: DateTime (nullable)  # Token expiry
```

### Citizen Profile (app/citizens/models.py)
```python
class Citizen(Base):
    id: Integer (PK)
    user_id: Integer (FK to users.id)
    address: String
    emergency_contact_name: String
    emergency_contact_phone: String
```

### Volunteer Profile (app/volunteers/models.py)
```python
class Volunteer(Base):
    id: Integer (PK)
    user_id: Integer (FK to users.id)
    skill: Enum(VolunteerSkill)  # First Aid, Medical Support, Search & Rescue, etc.
    experience_years: Integer
    availability: Enum(AvailabilityStatus)  # Available Anytime, Weekends Only, Emergency Only
    vehicle_availability: Boolean
    vehicle_type: Enum(VehicleType)  # Bike, Car, Van, Boat
    organization: String (nullable)
    is_available: Boolean (default=True)
```

### Incident Model (app/incidents/models.py)
```python
class Incident(Base):
    id: Integer (PK)
    title: String
    description: String
    latitude: Float
    longitude: Float
    status: Enum(IncidentStatus)  # REPORTED → VERIFIED → IN_PROGRESS → RESOLVED → ARCHIVED
    created_at: DateTime
    reported_by: Integer (FK to users.id)
```

### Resource Model (app/resources/models.py)
```python
class Resource(Base):
    id: Integer (PK)
    name: String
    type: String
    quantity: Integer
    is_available: Boolean (default=True)
    assigned_incident_id: Integer (nullable, FK)
```

### Alert Model (app/alerts/models.py)
```python
class Alert(Base):
    id: Integer (PK)
    title: String
    message: String
    incident_id: Integer (nullable, FK)
    created_at: DateTime
```

---

## 4. Complete API Endpoints

### Authentication (app/auth/routes.py)

| Method | Endpoint | Auth | Request Body | Response | Description |
|--------|----------|------|--------------|----------|-------------|
| POST | `/auth/register/citizen` | None | CitizenCreate (9 fields) | Token | Register citizen with profile |
| POST | `/auth/register/volunteer` | None | VolunteerCreate (12 fields) | Token | Register volunteer with profile |
| POST | `/auth/register/admin` | None | AdminCreate (4 fields + secret) | Message | Register admin with secret key |
| POST | `/auth/login` | None | OAuth2 form (username/password) | Token | Form-based login for Swagger |
| POST | `/auth/login-json` | None | {email, password} | Token | JSON-based login |
| POST | `/auth/forgot-password` | None | {email} | Token + Message | Request password reset |
| POST | `/auth/reset-password` | None | {token, new_password} | Message | Reset password with token |

**CitizenCreate Schema:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "citizen@test.com",
  "phone_number": "9999999999",
  "password": "pass1234",
  "city": "Hyderabad",
  "address": "123 Main St",
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "8888888888"
}
```

**VolunteerCreate Schema:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "volunteer@test.com",
  "phone_number": "8888888888",
  "password": "pass1234",
  "city": "Hyderabad",
  "skill": "First Aid",
  "experience_years": 3,
  "availability": "Available Anytime",
  "vehicle": true,
  "vehicle_type": "Car",
  "organization": "Red Cross"
}
```

**Token Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

### Incidents (app/incidents/routes.py)

| Method | Endpoint | Auth | Request/Params | Response | Description |
|--------|----------|------|----------------|----------|-------------|
| POST | `/incidents/` | Any role | Form-data (title, desc, lat, lng, photo[opt]) | IncidentResponse | Create incident with optional photo |
| GET | `/incidents/` | None | ?status=&page=&limit= | Paginated list | List all incidents |
| GET | `/incidents/nearby` | None | ?lat=&lng=&radius_km=&status= | List[Incident+dist] | Location-based search |
| PUT | `/incidents/{id}/verify` | ADMIN | path: incident_id | {message} | Verify incident |
| PUT | `/incidents/{id}/start` | ADMIN | path: incident_id | {message} | Start response |
| PUT | `/incidents/{id}/resolve` | ADMIN | path: incident_id | {message} | Mark resolved |
| PUT | `/incidents/{id}/archive` | ADMIN | path: incident_id | {message} | Archive resolved |
| POST | `/incidents/{id}/photos` | Any role | multipart: file | Photo info | Upload additional photo |
| GET | `/incidents/{id}/photos` | None | path: incident_id | List[photos] | List incident photos |

**IncidentCreate Schema:**
```json
{
  "title": "Flood in Area",
  "description": "Water level rising",
  "latitude": 17.385,
  "longitude": 78.4867
}
```

**IncidentResponse Schema:**
```json
{
  "id": 1,
  "title": "Flood in Area",
  "description": "Water level rising",
  "latitude": 17.385,
  "longitude": 78.4867,
  "status": "REPORTED",
  "created_at": "2026-04-03T15:23:02"
}
```

**Incident Status Flow:**
```
REPORTED → VERIFIED → IN_PROGRESS → RESOLVED → ARCHIVED
```

---

### Volunteers (app/volunteers/routes.py)

| Method | Endpoint | Auth | Request/Params | Response | Description |
|--------|----------|------|----------------|----------|-------------|
| POST | `/volunteers/` | VOLUNTEER | {skill: "First Aid"} | VolunteerResponse | Self-register skills |
| GET | `/volunteers/` | None | ?available=&page=&limit= | list[VolunteerResponse] | List volunteers |
| PUT | `/volunteers/{id}/assign/{incident_id}` | ADMIN | path params | {message} | Assign to incident |
| PUT | `/volunteers/{id}/release/{incident_id}` | ADMIN | path params | {message} | Release from incident |

**VolunteerResponse Schema:**
```json
{
  "id": 1,
  "user_id": 2,
  "skill": "First Aid",
  "is_available": true
}
```

---

### Resources (app/resources/routes.py)

| Method | Endpoint | Auth | Request/Params | Response | Description |
|--------|----------|------|----------------|----------|-------------|
| POST | `/resources/` | ADMIN | ResourceCreate | ResourceResponse | Add resource |
| GET | `/resources/` | None | ?available=&page=&limit= | Paginated list | List resources |
| PUT | `/resources/{id}/assign/{incident_id}` | ADMIN | path params | {message} | Assign to incident |
| PUT | `/resources/{id}/release/{incident_id}` | ADMIN | path params | {message} | Release from incident |

**ResourceCreate Schema:**
```json
{
  "name": "Emergency Kit",
  "type": "Medical",
  "quantity": 50
}
```

**ResourceResponse Schema:**
```json
{
  "id": 1,
  "name": "Emergency Kit",
  "type": "Medical",
  "quantity": 50,
  "is_available": true,
  "assigned_incident_id": null
}
```

---

### Alerts (app/alerts/routes.py)

| Method | Endpoint | Auth | Request/Params | Response | Description |
|--------|----------|------|----------------|----------|-------------|
| POST | `/alerts/` | ADMIN | AlertCreate | AlertResponse | Create alert |
| GET | `/alerts/` | None | None | list[AlertResponse] | List all alerts |

**AlertCreate Schema:**
```json
{
  "title": "Weather Warning",
  "message": "Heavy rain expected",
  "incident_id": 1
}
```

---

### Analytics (app/analytics/routes.py)

| Method | Endpoint | Auth | Response | Description |
|--------|----------|------|----------|-------------|
| GET | `/analytics/incidents` | ADMIN | {total_incidents, by_status} | Incident stats |
| GET | `/analytics/volunteers` | ADMIN | {total, active, inactive} | Volunteer stats |
| GET | `/analytics/resources` | ADMIN | {total, available, in_use} | Resource stats |
| GET | `/analytics/alerts` | ADMIN | {alerts_today} | Alert count |

**Note**: Analytics queries database directly (not in-memory). Shows real data even after server restart.

---

### Assignment History (app/assignments/routes.py)

| Method | Endpoint | Auth | Response | Description |
|--------|----------|------|----------|-------------|
| GET | `/assignments/` | ADMIN | list[AssignmentEvent] | All history |
| GET | `/assignments/incident/{id}` | ADMIN | list[AssignmentEvent] | By incident |
| GET | `/assignments/volunteer/{id}` | ADMIN | list[AssignmentEvent] | By volunteer |
| GET | `/assignments/resource/{id}` | ADMIN | list[AssignmentEvent] | By resource |

**AssignmentEvent Schema:**
```json
{
  "assignment_type": "VOLUNTEER|RESOURCE",
  "action": "ASSIGNED|RELEASED",
  "incident_id": 1,
  "subject_id": 1,
  "admin_id": 3,
  "reason": "Primary responder",
  "timestamp": "2026-04-03T15:44:24"
}
```

---

### Users (app/users/routes.py)

| Method | Endpoint | Auth | Response | Description |
|--------|----------|------|----------|-------------|
| GET | `/users/me` | Any | {id, email, role} | Current user profile |
| GET | `/users/admin-only` | ADMIN | {message} | Admin test endpoint |

---

### Health Check (app/main.py)

| Method | Endpoint | Auth | Response |
|--------|----------|------|----------|
| GET | `/health` | None | {status: "ok"} |

---

## 5. Authentication Flow

### Step 1: Obtain Token
```bash
# Option A: JSON login
curl -X POST http://localhost:8000/auth/login-json \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "admin1234"}'

# Response: {"access_token": "eyJ...", "token_type": "bearer"}
```

### Step 2: Use Token
```bash
# Include in header
curl http://localhost:8000/incidents/ \
  -H "Authorization: Bearer eyJ..."
```

### Step 3: Swagger Authorization
1. Click **Authorize** button (top right)
2. Enter: `Bearer YOUR_TOKEN_HERE`
3. Click **Authorize** → **Close**
4. All subsequent requests include token automatically

---

## 6. Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI entry point
│   ├── core/
│   │   ├── config.py           # Settings (SECRET_KEY, DB_URL)
│   │   ├── database.py         # SQLAlchemy engine & session
│   │   └── security.py         # Password hashing, JWT creation
│   ├── auth/
│   │   ├── dependencies.py     # get_current_user (HTTPBearer)
│   │   ├── roles.py            # require_role dependency
│   │   ├── routes.py           # /auth/* endpoints
│   │   └── schemas.py          # Enums & Pydantic models
│   ├── users/
│   │   ├── models.py           # User SQLAlchemy model
│   │   └── routes.py           # /users/* endpoints
│   ├── citizens/
│   │   └── models.py           # Citizen profile model
│   ├── volunteers/
│   │   ├── models.py           # Volunteer profile model
│   │   ├── routes.py           # /volunteers/* endpoints
│   │   └── schemas.py          # Volunteer Pydantic schemas
│   ├── incidents/
│   │   ├── models.py           # Incident model
│   │   ├── routes.py           # /incidents/* endpoints
│   │   ├── schemas.py          # Incident schemas
│   │   ├── status.py           # IncidentStatus enum & transitions
│   │   └── service.py          # transition_incident logic
│   ├── resources/
│   │   ├── models.py           # Resource model
│   │   ├── routes.py           # /resources/* endpoints
│   │   └── schemas.py          # Resource schemas
│   ├── alerts/
│   │   ├── models.py           # Alert model
│   │   ├── routes.py           # /alerts/* endpoints
│   │   └── schemas.py          # Alert schemas
│   ├── analytics/
│   │   ├── store.py            # In-memory data stores
│   │   ├── compute.py          # Summary calculations
│   │   ├── routes.py           # /analytics/* endpoints
│   │   └── schemas.py          # Analytics response schemas
│   ├── assignments/
│   │   ├── store.py            # In-memory assignment events
│   │   ├── models.py           # Assignment event structure
│   │   ├── service.py          # log_assignment function
│   │   ├── compute.py          # History filtering
│   │   └── routes.py           # /assignments/* endpoints
│   ├── notifications/
│   │   ├── engine.py           # Notification orchestration
│   │   ├── severity.py         # Severity levels & rules
│   │   ├── rate_limit.py       # Rate limiting logic
│   │   ├── ws_manager.py       # WebSocket connection manager
│   │   ├── ws_routes.py        # /ws/admin endpoint
│   │   └── sms_sender.py       # SMS gateway integration
│   └── common/
│       ├── schemas.py          # Pagination schemas
│       ├── pagination.py       # Paginate function
│       ├── filtering.py        # Filter utilities
│       └── soft_delete.py      # Soft delete utilities
├── alembic/                    # Database migrations
│   ├── env.py
│   └── versions/
├── uploads/                    # File upload directory
│   └── incidents/              # Incident photos
├── .env                        # Environment variables (PostgreSQL connection)
├── requirements.txt            # Python dependencies
├── adminlogin.py               # Admin user creation script (legacy)
├── POSTGRESQL_MIGRATION_PLAN.md  # Database schema documentation
└── START.md                    # Setup guide for developers
```

---

## 7. Configuration (.env)

```env
APP_NAME=Disaster Response System
ENV=development

DATABASE_URL=postgresql://postgres:password@localhost:5432/disaster_db
SECRET_KEY=supersecretkey123
ADMIN_SECRET_KEY=superadmin123
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

---

## 8. Key Business Logic

### Incident State Machine
```
REPORTED (citizen creates)
    ↓
VERIFIED (admin verifies)
    ↓
IN_PROGRESS (admin starts response)
    ↓
RESOLVED (admin marks complete)
    ↓
ARCHIVED (admin archives)
```

### Assignment Flow
1. Admin assigns volunteer/resource to incident
2. System marks volunteer/resource as unavailable
3. Assignment event logged with timestamp & admin
4. Admin releases when task complete
5. Assignment release event logged

---

## 9. Known Issues & Limitations

| Issue | Location | Impact | Workaround |
|-------|----------|--------|------------|
| WebSocket untested | app/notifications/ | Real-time features unverified | Test with WS client |
| No email service | auth/forgot-password | Token returned in response (insecure) | Integrate SendGrid/AWS SES |
| Photo metadata not in DB | incidents/routes.py | File listing scans directory | Add Photo table for metadata |
| Geolocation filters all incidents | incidents/nearby | Performance with 1000+ incidents | Use PostGIS or spatial index |

---

## 10. Enums Reference

### VolunteerSkill
- `First Aid`
- `Medical Support`
- `Search & Rescue`
- `Logistics`
- `Food Distribution`
- `Shelter Management`
- `Other`

### AvailabilityStatus
- `Available Anytime`
- `Weekends Only`
- `Emergency Only`

### VehicleType
- `Bike`
- `Car`
- `Van`
- `Boat`

### Role
- `CITIZEN`
- `VOLUNTEER`
- `ADMIN`

### IncidentStatus
- `REPORTED`
- `VERIFIED`
- `IN_PROGRESS`
- `RESOLVED`
- `ARCHIVED`

---

## 11. Testing Quick Start

### Prerequisites
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Test Sequence
1. **POST** `/auth/register/citizen` → Create citizen
2. **POST** `/auth/register/volunteer` → Create volunteer  
3. **POST** `/auth/login-json` → Get token
4. **Authorize** in Swagger with `Bearer <token>`
5. **POST** `/incidents/` → Create incident
6. Run `python adminlogin.py` → Create admin
7. Login as admin, test admin endpoints
8. Test transitions: verify → start → resolve → archive

---

## 12. Database Schema (PostgreSQL)

**Tables:**
- `users` - All user accounts
- `citizens` - Citizen profile extensions
- `volunteers` - Volunteer profile extensions  
- `incidents` - Disaster incidents
- `resources` - Emergency resources
- `alerts` - System alerts

**Relationships:**
- User 1:1 Citizen (if role=CITIZEN)
- User 1:1 Volunteer (if role=VOLUNTEER)
- Incident N:1 User (reported_by)
- Resource N:1 Incident (assigned_incident_id, nullable)
- Alert N:1 Incident (incident_id, nullable)

---

## 13. Future Enhancement Suggestions

### Implemented ✅
| Feature | Status | Notes |
|---------|--------|-------|
| Admin registration endpoint | ✅ | With secret key protection |
| Analytics from database | ✅ | SQL queries instead of memory |
| Geolocation incident search | ✅ | Haversine formula |
| Password reset flow | ✅ | Token-based |
| File upload for incidents | ✅ | Optional photo during creation |

### Recommended Next Steps
| Priority | Feature | Description |
|----------|---------|-------------|
| High | Email Integration | Send reset tokens via email (SendGrid/AWS SES) |
| High | Photo Metadata DB | Store photo info in database table |
| Medium | Push Notifications | Firebase/APNs for mobile alerts |
| Medium | Heatmap Analytics | Geographic incident density visualization |
| Low | AI Categorization | Auto-tag incident severity |
| Low | Multi-language | i18n support for regional use |

---

**Report Generated**: April 3, 2026  
**Backend Version**: 1.1  
**Status**: Production-ready with enhanced features
