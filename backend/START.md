# Disaster Response System - Backend Setup Guide

**For Frontend Developers** - Complete step-by-step guide to set up the FastAPI backend with PostgreSQL.

---

## Prerequisites

- Windows 10/11
- Internet connection
- Administrator privileges (for installing PostgreSQL)

---

## Step 1: Install PostgreSQL Database

### Download & Install

1. Go to: https://www.postgresql.org/download/windows/
2. Download **PostgreSQL 15.x** installer for Windows
3. Run the installer:
   - **Installation Directory**: `C:\Program Files\PostgreSQL\15`
   - **Data Directory**: `C:\Program Files\PostgreSQL\15\data`
   - **Password**: Set to `sruthi@1978` (or your preferred password)
   - **Port**: `5432` (default)
   - **Locale**: Default
4. **Uncheck** "Stack Builder" at the end (not needed)

### Verify Installation

Open **PowerShell** and run:
```powershell
# Check if PostgreSQL service is running
Get-Service | Where-Object {$_.Name -like "*postgres*"}

# Expected output:
# Status   Name               DisplayName
# ------   ----               -----------
# Running  postgresql-x64-15  PostgreSQL Server 15
```

If status is **"Stopped"**, start it:
```powershell
net start postgresql-x64-15
```

---

## Step 2: Create Database

### Using psql Command Line

1. Open **SQL Shell (psql)** from Start Menu
   - Or open PowerShell and run: `psql -U postgres`
   - Password: `sruthi@1978`

2. Create the database:
```sql
CREATE DATABASE disaster_db;
\q  -- Quit
```

### Verify Database Created
```powershell
psql -U postgres -c "\l" | findstr disaster_db
```

Should show `disaster_db` in the list.

---

## Step 3: Set Up Python Environment

### Install Python (if not installed)

1. Download Python 3.10+ from https://python.org
2. During installation, **CHECK** "Add Python to PATH"

### Create Virtual Environment

Open PowerShell in the backend folder:
```powershell
# Navigate to backend directory
cd C:\Users\gudiw\Downloads\download (5)\backend

# Create virtual environment
python -m venv .venv

# Activate it
.\.venv\Scripts\Activate.ps1

# You should see (.venv) in your prompt
```

### Install Dependencies

With virtual environment activated:
```powershell
pip install -r requirements.txt
```

This installs:
- fastapi
- uvicorn
- sqlalchemy
- pydantic
- python-jose
- passlib
- bcrypt
- alembic
- python-dotenv
- python-multipart
- **psycopg2-binary** (PostgreSQL driver)

---

## Step 4: Configure Environment Variables

The `.env` file is already configured. **Verify it exists** at:
`C:\Users\gudiw\Downloads\download (5)\backend\.env`

Contents should be:
```env
APP_NAME=Disaster Response System
ENV=development

DATABASE_URL=postgresql://postgres:sruthi%401978@localhost:5432/disaster_db
SECRET_KEY=supersecretkey123
ADMIN_SECRET_KEY=superadmin123
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

**Note**: If you used a different PostgreSQL password, update `DATABASE_URL` accordingly.

---

## Step 5: Initialize Database Tables

### Automatic Table Creation

The backend will **auto-create all tables** on first startup. No manual SQL needed!

Simply start the server:
```powershell
uvicorn app.main:app --reload
```

You should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Verify Tables Created

In psql:
```sql
\c disaster_db  -- Connect to database
\dt           -- List all tables
```

Expected tables:
- alerts
- citizens
- incidents
- resources
- users
- volunteers

---

## Step 6: Test the Backend

### 1. Health Check

Open browser or PowerShell:
```powershell
curl http://localhost:8000/health
```

Expected:
```json
{
  "status": "OK",
  "environment": "development",
  "database": "PostgreSQL"
}
```

### 2. Database Connection Test
```powershell
curl http://localhost:8000/test-db
```

Expected:
```json
{
  "status": "success",
  "database_connected": true,
  "user_count": 0,
  "message": "PostgreSQL connection established successfully"
}
```

### 3. Open Swagger UI

Browser: http://localhost:8000/docs

You should see all API endpoints listed.

---

## Step 7: Create Test Data (Optional)

Use Swagger UI to create test data:

### Create Admin Account
1. POST `/auth/register/admin`
2. Body:
```json
{
  "full_name": "System Administrator",
  "email": "admin@test.com",
  "password": "admin123",
  "admin_secret": "superadmin123"
}
```

### Login as Admin
3. POST `/auth/login-json`
4. Body:
```json
{
  "email": "admin@test.com",
  "password": "admin123"
}
```
5. Copy the `access_token` from response

### Authorize in Swagger
6. Click **Authorize** button (top right)
7. Enter: `Bearer eyJhbGciOiJIUzI1NiIs...` (paste your token)
8. Click **Authorize** → **Close**

Now you can test all admin endpoints.

---

## Project Structure

```
backend/
├── app/
│   ├── analytics/      # Statistics & reporting
│   ├── assignments/    # Resource/volunteer assignment
│   ├── auth/          # Login, register, JWT
│   ├── citizens/      # Citizen profile models
│   ├── common/        # Shared utilities
│   ├── core/          # Config & database setup
│   ├── incidents/     # Incident CRUD & workflow
│   ├── notifications/ # WebSocket & alerts
│   ├── resources/     # Resource management
│   ├── users/         # User models & routes
│   └── volunteers/    # Volunteer profiles
├── .env               # Environment variables
├── requirements.txt   # Python dependencies
└── POSTGRESQL_MIGRATION_PLAN.md  # Detailed DB schema
```

---

## Available Endpoints

### Authentication
- `POST /auth/register/citizen` - Register citizen
- `POST /auth/register/volunteer` - Register volunteer
- `POST /auth/register/admin` - Register admin (requires secret)
- `POST /auth/login-json` - Login, get JWT token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset with token

### Incidents
- `POST /incidents/` - Create incident (any role)
- `GET /incidents/` - List all incidents
- `GET /incidents/nearby` - Search by location (lat, lng, radius)
- `PUT /incidents/{id}/verify` - Admin: verify incident
- `PUT /incidents/{id}/start` - Admin: start response
- `PUT /incidents/{id}/resolve` - Admin: mark resolved
- `PUT /incidents/{id}/archive` - Admin: archive incident
- `POST /incidents/{id}/photos` - Upload incident photo

### Resources (Admin)
- `POST /resources/add` - Add new resource
- `GET /resources/` - List all resources
- `POST /resources/{id}/assign` - Assign to incident
- `POST /resources/{id}/release` - Release from incident

### Volunteers (Admin)
- `GET /volunteers/` - List all volunteers
- `POST /volunteers/{id}/assign` - Assign to incident
- `POST /volunteers/{id}/release` - Release from incident

### Analytics (Admin)
- `GET /analytics/incidents` - Incident statistics
- `GET /analytics/volunteers` - Volunteer statistics
- `GET /analytics/resources` - Resource statistics
- `GET /analytics/alerts` - Alert count

### System
- `GET /health` - Health check
- `GET /test-db` - Database connection test
- `GET /docs` - Swagger UI (API documentation)
- `GET /redoc` - ReDoc UI (alternative docs)

---

## Common Issues & Solutions

### Issue 1: "No module named 'psycopg2'"
**Fix**: Install PostgreSQL driver
```powershell
pip install psycopg2-binary
```

### Issue 2: "Connection refused"
**Fix**: PostgreSQL service not running
```powershell
net start postgresql-x64-15
```

### Issue 3: "password authentication failed"
**Fix**: Wrong password in `.env`
- Update `DATABASE_URL` with correct password
- Remember to encode `@` as `%40` in password

### Issue 4: "database 'disaster_db' does not exist"
**Fix**: Create database
```sql
CREATE DATABASE disaster_db;
```

### Issue 5: "column does not exist" errors
**Fix**: Tables were created with old schema. Drop and recreate:
```sql
DROP TABLE IF EXISTS citizens, volunteers, incidents, resources, alerts, users CASCADE;
DROP TYPE IF EXISTS user_role, volunteer_skill, availability_status, vehicle_type, incident_status CASCADE;
```
Then restart the FastAPI server.

### Issue 6: Port 8000 already in use
**Fix**: Use different port
```powershell
uvicorn app.main:app --reload --port 8001
```

---

## Frontend Integration

### Base URL
```javascript
const API_BASE_URL = 'http://localhost:8000';
```

### Authentication Header
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + localStorage.getItem('token')
};
```

### Example Login
```javascript
const response = await fetch('http://localhost:8000/auth/login-json', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@test.com',
    password: 'admin123'
  })
});

const data = await response.json();
localStorage.setItem('token', data.access_token);
```

### Example Create Incident
```javascript
const response = await fetch('http://localhost:8000/incidents/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({
    title: 'Flood Emergency',
    description: 'Water rising fast',
    latitude: 17.385,
    longitude: 78.4867
  })
});
```

---

## Useful Commands

### Start Backend
```powershell
# With hot reload (development)
uvicorn app.main:app --reload

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Database Operations
```powershell
# Access PostgreSQL
psql -U postgres -d disaster_db

# View tables
\dt

# View table structure
\d users

# Query data
SELECT * FROM users;

# Exit
\q
```

### Reset Everything
```powershell
# Stop server (Ctrl+C)

# Drop all tables
psql -U postgres -c "DROP TABLE IF EXISTS citizens, volunteers, incidents, resources, alerts, users CASCADE;"

# Restart server (auto-creates tables)
uvicorn app.main:app --reload
```

---

## Next Steps

1. ✅ Backend is running on `http://localhost:8000`
2. ✅ Swagger UI available for testing
3. ✅ PostgreSQL database connected
4. 🎯 **Start building your frontend!**

Connect your React/Angular/Vue app to these endpoints.

---

## Support

- Check `PROJECT_REPORT.md` for detailed API documentation
- Check `POSTGRESQL_MIGRATION_PLAN.md` for database schema details
- Test all endpoints in Swagger UI before integrating frontend

---

**Good luck with the frontend development! 🚀**
