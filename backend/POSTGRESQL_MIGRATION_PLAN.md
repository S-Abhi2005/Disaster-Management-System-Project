# PostgreSQL Migration Plan - Disaster Response System

## Executive Summary
This document provides a complete migration plan from SQLite to PostgreSQL for the Disaster Response System backend. It includes full SQL DDL, data type mappings, index recommendations, and migration steps.

**Target Database**: PostgreSQL 14+
**ORM**: SQLAlchemy (already compatible)
**Estimated Migration Time**: 2-4 hours

---

## 1. Database Configuration Changes

### Updated .env File
```env
# Database Configuration - PostgreSQL
DATABASE_URL=postgresql://disaster_user:your_password@localhost:5432/disaster_db
# OR for async (recommended with asyncpg)
# DATABASE_URL=postgresql+asyncpg://disaster_user:your_password@localhost:5432/disaster_db

# Keep other settings
APP_NAME=Disaster Response System
ENV=production
SECRET_KEY=supersecretkey123
ADMIN_SECRET_KEY=superadmin123
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### Required Python Dependencies
```
# Add to requirements.txt
psycopg2-binary==2.9.9
# OR for async support
asyncpg==0.29.0
```

---

## 2. Complete PostgreSQL Schema (DDL)

### 2.1 Database & User Setup
```sql
-- Create database and user
CREATE DATABASE disaster_db;
CREATE USER disaster_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE disaster_db TO disaster_user;

-- Connect to disaster_db
\c disaster_db

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- For advanced geolocation
```

### 2.2 Enums (Custom Types)
```sql
-- User Roles
CREATE TYPE user_role AS ENUM ('CITIZEN', 'VOLUNTEER', 'ADMIN');

-- Volunteer Skills
CREATE TYPE volunteer_skill AS ENUM (
    'First Aid',
    'Medical Support',
    'Search & Rescue',
    'Logistics',
    'Food Distribution',
    'Shelter Management',
    'Other'
);

-- Availability Status
CREATE TYPE availability_status AS ENUM (
    'Available Anytime',
    'Weekends Only',
    'Emergency Only'
);

-- Vehicle Types
CREATE TYPE vehicle_type AS ENUM ('Bike', 'Car', 'Van', 'Boat');

-- Incident Status
CREATE TYPE incident_status AS ENUM (
    'REPORTED',
    'VERIFIED',
    'IN_PROGRESS',
    'RESOLVED',
    'ARCHIVED'
);

-- Assignment Types (for audit log)
CREATE TYPE assignment_type AS ENUM ('VOLUNTEER', 'RESOURCE');
CREATE TYPE action_type AS ENUM ('ASSIGNED', 'RELEASED');
```

### 2.3 Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    hashed_password VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    role user_role NOT NULL,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;
```

#### Citizens Table
```sql
CREATE TABLE citizens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    address TEXT,
    age INTEGER,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    preferred_language VARCHAR(50) DEFAULT 'en',
    allow_gps_location BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_citizens_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT chk_citizen_age CHECK (age >= 0 AND age <= 150)
);

-- Indexes for citizens
CREATE UNIQUE INDEX idx_citizens_user_id ON citizens(user_id);
CREATE INDEX idx_citizens_emergency_contact ON citizens(emergency_contact_phone);
```

#### Volunteers Table
```sql
CREATE TABLE volunteers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    skill volunteer_skill,
    experience_years INTEGER,
    availability availability_status,
    vehicle_availability BOOLEAN DEFAULT FALSE,
    vehicle_type vehicle_type,
    organization VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_volunteers_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    CONSTRAINT chk_experience_years CHECK (experience_years >= 0 AND experience_years <= 100)
);

-- Indexes for volunteers
CREATE UNIQUE INDEX idx_volunteers_user_id ON volunteers(user_id);
CREATE INDEX idx_volunteers_skill ON volunteers(skill);
CREATE INDEX idx_volunteers_availability ON volunteers(availability);
CREATE INDEX idx_volunteers_is_available ON volunteers(is_available);
CREATE INDEX idx_volunteers_location_skill ON volunteers(skill, is_available);
```

#### Incidents Table
```sql
CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    status incident_status DEFAULT 'REPORTED',
    severity VARCHAR(20) DEFAULT 'MEDIUM',  -- New field: LOW, MEDIUM, HIGH, CRITICAL
    reported_by INTEGER NOT NULL,
    verified_by INTEGER,  -- Admin who verified
    assigned_volunteer_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_incidents_reporter 
        FOREIGN KEY (reported_by) 
        REFERENCES users(id),
    CONSTRAINT fk_incidents_verifier 
        FOREIGN KEY (verified_by) 
        REFERENCES users(id),
    CONSTRAINT fk_incidents_volunteer 
        FOREIGN KEY (assigned_volunteer_id) 
        REFERENCES volunteers(id),
    CONSTRAINT chk_latitude CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT chk_longitude CHECK (longitude >= -180 AND longitude <= 180)
);

-- Indexes for incidents
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_location ON incidents(latitude, longitude);
CREATE INDEX idx_incidents_reporter ON incidents(reported_by);
CREATE INDEX idx_incidents_created ON incidents(created_at DESC);
CREATE INDEX idx_incidents_status_created ON incidents(status, created_at DESC);

-- Geospatial index (if using PostGIS)
-- CREATE INDEX idx_incidents_geo ON incidents USING GIST (
--     ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
-- );
```

#### Resources Table
```sql
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    is_available BOOLEAN DEFAULT TRUE,
    assigned_incident_id INTEGER,
    description TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_resources_incident 
        FOREIGN KEY (assigned_incident_id) 
        REFERENCES incidents(id) 
        ON DELETE SET NULL,
    CONSTRAINT chk_resource_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_resource_lat CHECK (location_lat >= -90 AND location_lat <= 90),
    CONSTRAINT chk_resource_lng CHECK (location_lng >= -180 AND location_lng <= 180)
);

-- Indexes for resources
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_available ON resources(is_available);
CREATE INDEX idx_resources_assigned ON resources(assigned_incident_id);
CREATE INDEX idx_resources_type_available ON resources(type, is_available);
```

#### Alerts Table
```sql
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'INFO',  -- INFO, WARNING, CRITICAL
    incident_id INTEGER,
    created_by INTEGER NOT NULL,
    sent_via_sms BOOLEAN DEFAULT FALSE,
    sent_via_push BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT fk_alerts_incident 
        FOREIGN KEY (incident_id) 
        REFERENCES incidents(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_alerts_creator 
        FOREIGN KEY (created_by) 
        REFERENCES users(id)
);

-- Indexes for alerts
CREATE INDEX idx_alerts_incident ON alerts(incident_id);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);
CREATE INDEX idx_alerts_expires ON alerts(expires_at);
CREATE INDEX idx_alerts_active ON alerts(created_at, expires_at) 
    WHERE expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP;
```

#### Incident Photos Table (New - Recommended)
```sql
CREATE TABLE incident_photos (
    id SERIAL PRIMARY KEY,
    incident_id INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    mime_type VARCHAR(100),
    file_size INTEGER,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by INTEGER NOT NULL,
    caption TEXT,
    is_primary BOOLEAN DEFAULT FALSE,  -- Primary photo for incident card
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_photos_incident 
        FOREIGN KEY (incident_id) 
        REFERENCES incidents(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_photos_uploader 
        FOREIGN KEY (uploaded_by) 
        REFERENCES users(id)
);

-- Indexes for photos
CREATE INDEX idx_photos_incident ON incident_photos(incident_id);
CREATE INDEX idx_photos_primary ON incident_photos(incident_id, is_primary) WHERE is_primary = TRUE;
```

#### Assignment History Table (New - Replaces In-Memory Store)
```sql
CREATE TABLE assignment_history (
    id SERIAL PRIMARY KEY,
    assignment_type assignment_type NOT NULL,
    action action_type NOT NULL,
    incident_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,  -- volunteer_id or resource_id
    subject_type VARCHAR(20) NOT NULL,  -- 'VOLUNTEER' or 'RESOURCE'
    admin_id INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_assignment_incident 
        FOREIGN KEY (incident_id) 
        REFERENCES incidents(id),
    CONSTRAINT fk_assignment_admin 
        FOREIGN KEY (admin_id) 
        REFERENCES users(id)
);

-- Indexes for assignment history
CREATE INDEX idx_assignment_incident ON assignment_history(incident_id);
CREATE INDEX idx_assignment_subject ON assignment_history(subject_id, subject_type);
CREATE INDEX idx_assignment_admin ON assignment_history(admin_id);
CREATE INDEX idx_assignment_created ON assignment_history(created_at DESC);
CREATE INDEX idx_assignment_type_action ON assignment_history(assignment_type, action);
```

#### Audit Log Table (New - Recommended)
```sql
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,  -- Big serial for high volume
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL,  -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by INTEGER,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    
    CONSTRAINT fk_audit_user 
        FOREIGN KEY (changed_by) 
        REFERENCES users(id)
);

-- Indexes for audit log
CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_changed_at ON audit_log(changed_at DESC);
CREATE INDEX idx_audit_user ON audit_log(changed_by);
```

---

## 3. Views for Common Queries

### Active Incidents View
```sql
CREATE VIEW active_incidents AS
SELECT i.*, u.full_name as reporter_name, v.skill as assigned_volunteer_skill
FROM incidents i
JOIN users u ON i.reported_by = u.id
LEFT JOIN volunteers v ON i.assigned_volunteer_id = v.id
WHERE i.status IN ('REPORTED', 'VERIFIED', 'IN_PROGRESS');
```

### Available Volunteers View
```sql
CREATE VIEW available_volunteers AS
SELECT 
    v.*, 
    u.full_name, 
    u.email, 
    u.phone_number, 
    u.city
FROM volunteers v
JOIN users u ON v.user_id = u.id
WHERE v.is_available = TRUE;
```

### Incident Summary View
```sql
CREATE VIEW incident_summary AS
SELECT 
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM incidents
GROUP BY status;
```

---

## 4. Functions & Triggers

### Auto-Update Updated_At Timestamp
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_citizens_updated_at BEFORE UPDATE ON citizens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON volunteers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Auto-Log Assignment Changes
```sql
CREATE OR REPLACE FUNCTION log_assignment_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Log volunteer assignment
        IF OLD.assigned_volunteer_id IS DISTINCT FROM NEW.assigned_volunteer_id THEN
            INSERT INTO assignment_history (
                assignment_type, action, incident_id, subject_id, 
                subject_type, admin_id, reason
            ) VALUES (
                'VOLUNTEER',
                CASE WHEN NEW.assigned_volunteer_id IS NULL THEN 'RELEASED' ELSE 'ASSIGNED' END,
                NEW.id,
                COALESCE(NEW.assigned_volunteer_id, OLD.assigned_volunteer_id),
                'VOLUNTEER',
                NEW.verified_by,  -- Assuming admin who last verified made the change
                'Auto-logged from incident update'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER incident_assignment_logger
    AFTER UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION log_assignment_change();
```

---

## 5. SQLAlchemy Model Updates

### Updated Database Connection (app/core/database.py)
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# PostgreSQL connection
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,              # Connection pool size
    max_overflow=30,           # Overflow connections
    pool_pre_ping=True,        # Verify connections before use
    pool_recycle=3600,         # Recycle connections after 1 hour
    echo=False                 # Set True for SQL logging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency
async def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Enum Handling (Important!)
```python
# SQLAlchemy models should use PostgreSQL native enums
# In your models, keep using SAEnum as is - SQLAlchemy handles the translation

# Example (no changes needed to existing models):
from sqlalchemy import Column, Integer, String, Enum as SAEnum

role = Column(SAEnum(Role), nullable=False)
```

---

## 6. Data Migration Steps

### Step 1: Export SQLite Data
```bash
# Export SQLite to SQL
sqlite3 disaster.db .dump > disaster_dump.sql

# Or export as CSV for each table
sqlite3 disaster.db -csv -header "SELECT * FROM users" > users.csv
sqlite3 disaster.db -csv -header "SELECT * FROM citizens" > citizens.csv
sqlite3 disaster.db -csv -header "SELECT * FROM volunteers" > volunteers.csv
sqlite3 disaster.db -csv -header "SELECT * FROM incidents" > incidents.csv
sqlite3 disaster.db -csv -header "SELECT * FROM resources" > resources.csv
sqlite3 disaster.db -csv -header "SELECT * FROM alerts" > alerts.csv
```

### Step 2: Transform & Import
```python
# Python script for data migration (migrate_data.py)
import csv
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.users.models import User
from app.citizens.models import Citizen
from app.volunteers.models import Volunteer
from app.incidents.models import Incident
from app.resources.models import Resource
from app.alerts.models import Alert

def migrate_users(db: Session):
    with open('users.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            user = User(
                id=int(row['id']),
                full_name=row['full_name'],
                email=row['email'],
                phone_number=row.get('phone_number'),
                hashed_password=row['hashed_password'],
                city=row.get('city'),
                role=row['role'],
                reset_token=row.get('reset_token'),
                reset_token_expires=row.get('reset_token_expires')
            )
            db.add(user)
    db.commit()

# Similar functions for other tables...

if __name__ == "__main__":
    db = SessionLocal()
    try:
        migrate_users(db)
        migrate_citizens(db)
        migrate_volunteers(db)
        migrate_incidents(db)
        migrate_resources(db)
        migrate_alerts(db)
        print("Migration complete!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()
```

### Step 3: Reset Sequences
```sql
-- After data import, reset sequences to avoid ID conflicts
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('citizens_id_seq', (SELECT MAX(id) FROM citizens));
SELECT setval('volunteers_id_seq', (SELECT MAX(id) FROM volunteers));
SELECT setval('incidents_id_seq', (SELECT MAX(id) FROM incidents));
SELECT setval('resources_id_seq', (SELECT MAX(id) FROM resources));
SELECT setval('alerts_id_seq', (SELECT MAX(id) FROM alerts));
```

---

## 7. Performance Optimization

### Query Optimization with EXPLAIN ANALYZE
```sql
-- Check slow queries
EXPLAIN ANALYZE SELECT * FROM incidents WHERE status = 'IN_PROGRESS';

-- Create partial index for active incidents
CREATE INDEX idx_active_incidents ON incidents(id) 
WHERE status IN ('REPORTED', 'VERIFIED', 'IN_PROGRESS');
```

### Connection Pooling (PgBouncer - Production)
```ini
; pgbouncer.ini
[databases]
disaster_db = host=localhost port=5432 dbname=disaster_db

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
```

---

## 8. Backup & Recovery

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

DB_NAME="disaster_db"
DB_USER="disaster_user"
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
pg_dump -U $DB_USER -Fc $DB_NAME > $BACKUP_DIR/disaster_db_$DATE.dump

# Keep only last 7 days
find $BACKUP_DIR -name "disaster_db_*.dump" -mtime +7 -delete
```

### Restore Command
```bash
pg_restore -U disaster_user -d disaster_db --clean --if-exists disaster_db_20250403_120000.dump
```

---

## 9. Monitoring Queries

### Check Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Index Usage
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Current Connections
```sql
SELECT 
    datname,
    usename,
    state,
    count(*)
FROM pg_stat_activity
GROUP BY datname, usename, state;
```

---

## 10. Summary of Changes from SQLite

| Aspect | SQLite | PostgreSQL | Impact |
|--------|--------|------------|--------|
| **Data Types** | Limited | Rich (JSONB, Arrays, INET) | Better data integrity |
| **Enums** | Strings | Native ENUM types | Type safety |
| **Indexes** | B-tree only | B-tree, GiST, GIN | Better geospatial support |
| **Constraints** | Basic | Full foreign key support | Data consistency |
| **Concurrency** | File locking | MVCC | Better performance |
| **Full-Text Search** | None | tsvector/tsquery | Searchable descriptions |
| **JSON** | Text | JSONB with indexing | Better metadata storage |
| **Backup** | File copy | pg_dump | Reliable backups |
| **Scaling** | Single file | Connection pooling | Production ready |

---

## Next Steps for ChatGPT Implementation

1. **Update `app/core/database.py`** - Change connection string and add pooling
2. **Install psycopg2-binary** - Add to requirements.txt
3. **Run DDL Script** - Execute SQL in PostgreSQL
4. **Migrate Data** - Run Python migration script
5. **Update `.env`** - Change DATABASE_URL
6. **Test Endpoints** - Verify all API calls work
7. **Set up Backups** - Configure automated backups

**Estimated Time**: 3-4 hours for complete migration and testing.

---

**Document Version**: 1.0  
**Created**: April 3, 2026  
**Target PostgreSQL Version**: 14+
