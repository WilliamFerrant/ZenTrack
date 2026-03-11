# MVP Backend Specification - Zentracker
*Version: 1.0 | Date: 2026-03-11 | Status: Implementation Ready*

## Executive Summary

This specification defines the **minimum viable backend implementation** for the Zentracker time tracking application, focusing on the core login → tracking → dashboard user flow. The specification leverages the existing comprehensive database schema while implementing only the essential API endpoints needed for MVP functionality.

## Core User Flow (MVP)

```
1. LOGIN → User authenticates via email/password
2. TRACKING → User starts timer, selects project, tracks time, stops timer
3. DASHBOARD → User views time summaries, recent entries, basic analytics
```

## Data Models (MVP Core)

Based on the existing database schema, the MVP focuses on these core entities:

### **Primary Models (MUST-HAVE)**

#### User Model
```python
# Core fields for MVP
- id: int (PK)
- email: str (unique)
- first_name: str
- last_name: str
- hashed_password: str
- is_active: bool
- role: Enum[ADMIN, MANAGER, MEMBER, VIEWER]
- organization_id: int (FK)
- hourly_rate: Decimal (optional)
- timezone: str (optional, default: UTC)
```

#### Organization Model
```python
# Minimal multi-tenancy
- id: int (PK)
- name: str
- slug: str (unique)
- is_active: bool
```

#### Project Model
```python
# Basic project organization
- id: int (PK)
- name: str
- description: str (optional)
- color: str (hex color, default: #3B82F6)
- is_active: bool
- is_billable: bool
- hourly_rate: Decimal (optional)
- organization_id: int (FK)
```

#### Timer Model
```python
# Active time tracking sessions
- id: int (PK)
- start_time: DateTime
- is_running: bool
- description: str (optional)
- user_id: int (FK)
- project_id: int (FK)
```

#### TimeEntry Model
```python
# Completed time tracking records
- id: int (PK)
- start_time: DateTime
- end_time: DateTime
- duration: int (seconds)
- description: str (optional)
- is_billable: bool
- hourly_rate: Decimal (optional)
- user_id: int (FK)
- project_id: int (FK)
```

### **Secondary Models (NICE-TO-HAVE)**
- Task Model (task-level tracking)
- Client Model (client association)
- Tag Models (categorization)

---

## API Endpoints Specification

Base URL: `http://localhost:8000/api/v1`
Authentication: Bearer token (JWT)
Content-Type: `application/json`

### **1. Authentication Endpoints (MUST-HAVE)**

#### `POST /auth/login`
**Purpose**: User authentication with email/password

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Success Response (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "MEMBER",
    "organization_id": 1
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
- `422 Validation Error`: Invalid input format

---

#### `POST /auth/refresh`
**Purpose**: Refresh access token using refresh token

**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

---

#### `POST /auth/logout`
**Purpose**: Invalidate current session tokens

**Headers**: `Authorization: Bearer <access_token>`

**Success Response (204)**: No content

---

#### `GET /auth/me`
**Purpose**: Get current user profile

**Headers**: `Authorization: Bearer <access_token>`

**Success Response (200)**:
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "MEMBER",
  "organization_id": 1,
  "hourly_rate": 50.00,
  "timezone": "UTC"
}
```

### **2. Time Tracking Endpoints (MUST-HAVE)**

#### `GET /timers/current`
**Purpose**: Get user's currently running timer (max 1 per user)

**Headers**: `Authorization: Bearer <access_token>`

**Success Response (200)** - Timer running:
```json
{
  "id": 123,
  "start_time": "2026-03-11T09:00:00Z",
  "is_running": true,
  "description": "Working on user authentication",
  "project": {
    "id": 5,
    "name": "Zentracker MVP",
    "color": "#3B82F6"
  },
  "elapsed_seconds": 3600
}
```

**Success Response (200)** - No timer running:
```json
{
  "timer": null
}
```

---

#### `POST /timers/start`
**Purpose**: Start a new timer (stops any existing timer)

**Request Body**:
```json
{
  "project_id": 5,
  "description": "Working on user authentication"  // optional
}
```

**Success Response (201)**:
```json
{
  "id": 124,
  "start_time": "2026-03-11T10:30:00Z",
  "is_running": true,
  "description": "Working on user authentication",
  "project": {
    "id": 5,
    "name": "Zentracker MVP",
    "color": "#3B82F6"
  }
}
```

**Business Rules**:
- Only one active timer per user allowed
- Starting new timer automatically stops previous timer and creates time_entry
- Project must exist and belong to user's organization

---

#### `POST /timers/stop`
**Purpose**: Stop current timer and create time entry

**Headers**: `Authorization: Bearer <access_token>`

**Request Body**:
```json
{
  "description": "Completed user authentication implementation"  // optional
}
```

**Success Response (201)** - Created time entry:
```json
{
  "time_entry": {
    "id": 456,
    "start_time": "2026-03-11T09:00:00Z",
    "end_time": "2026-03-11T10:30:00Z",
    "duration": 5400,  // seconds
    "description": "Completed user authentication implementation",
    "is_billable": true,
    "project": {
      "id": 5,
      "name": "Zentracker MVP"
    }
  }
}
```

**Error Response (400)**: No running timer found

---

#### `GET /time-entries`
**Purpose**: List user's time entries with filtering

**Query Parameters**:
- `limit`: int (default: 20, max: 100)
- `offset`: int (default: 0)
- `start_date`: ISO date (optional)
- `end_date`: ISO date (optional)
- `project_id`: int (optional)

**Success Response (200)**:
```json
{
  "items": [
    {
      "id": 456,
      "start_time": "2026-03-11T09:00:00Z",
      "end_time": "2026-03-11T10:30:00Z",
      "duration": 5400,
      "description": "Completed user authentication",
      "is_billable": true,
      "project": {
        "id": 5,
        "name": "Zentracker MVP",
        "color": "#3B82F6"
      }
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

---

#### `POST /time-entries`
**Purpose**: Manually create time entry (non-timer based)

**Request Body**:
```json
{
  "project_id": 5,
  "start_time": "2026-03-11T09:00:00Z",
  "end_time": "2026-03-11T10:30:00Z",
  "description": "Manual entry for client meeting",
  "is_billable": true
}
```

**Success Response (201)**: Same as time entry object above

---

#### `PUT /time-entries/{id}`
**Purpose**: Edit existing time entry

**Request Body**: Same as POST, all fields optional

**Success Response (200)**: Updated time entry object

**Error Response (404)**: Time entry not found or not owned by user

---

#### `DELETE /time-entries/{id}`
**Purpose**: Delete time entry

**Success Response (204)**: No content

### **3. Dashboard & Reporting Endpoints (MUST-HAVE)**

#### `GET /dashboard/summary`
**Purpose**: Get time tracking summary for dashboard

**Query Parameters**:
- `period`: enum[today, week, month] (default: today)
- `start_date`: ISO date (optional, overrides period)
- `end_date`: ISO date (optional, overrides period)

**Success Response (200)**:
```json
{
  "period": "today",
  "date_range": {
    "start": "2026-03-11",
    "end": "2026-03-11"
  },
  "summary": {
    "total_hours": 7.5,
    "billable_hours": 6.0,
    "total_entries": 4,
    "total_revenue": 300.00
  },
  "by_project": [
    {
      "project": {
        "id": 5,
        "name": "Zentracker MVP",
        "color": "#3B82F6"
      },
      "hours": 5.5,
      "entries": 3,
      "revenue": 275.00
    }
  ],
  "recent_entries": [
    {
      "id": 456,
      "start_time": "2026-03-11T09:00:00Z",
      "duration": 5400,
      "description": "Authentication implementation",
      "project": {
        "id": 5,
        "name": "Zentracker MVP"
      }
    }
  ]
}
```

---

#### `GET /projects`
**Purpose**: List projects for project selection

**Query Parameters**:
- `is_active`: bool (default: true)

**Success Response (200)**:
```json
{
  "items": [
    {
      "id": 5,
      "name": "Zentracker MVP",
      "description": "Time tracking application",
      "color": "#3B82F6",
      "is_active": true,
      "is_billable": true,
      "hourly_rate": 50.00
    }
  ]
}
```

---

## Validation Rules

### **Input Validation (MUST-HAVE)**

#### Authentication
- **Email**: Valid email format, max 255 chars
- **Password**: Min 8 chars (login only, registration out of MVP scope)

#### Time Tracking
- **Start/End Times**: Valid ISO 8601 format
- **Duration**: Positive integer (seconds), max 24 hours per entry
- **Description**: Max 500 characters
- **Project ID**: Must exist and belong to user's organization

#### Pagination
- **Limit**: 1-100 range
- **Offset**: Non-negative integer

### **Business Rules (MUST-HAVE)**

#### Timer Constraints
- **Single Active Timer**: Only one running timer per user
- **Automatic Stop**: Starting new timer stops existing timer
- **Minimum Duration**: Timer must run at least 1 minute to create entry

#### Data Integrity
- **Organization Isolation**: Users can only access their org's data
- **Time Entry Validation**: end_time > start_time
- **Project Association**: All entries must link to accessible projects

---

## Error Handling

### **Standard Error Format**
```json
{
  "detail": "Validation error message",
  "type": "validation_error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### **HTTP Status Codes**
- `200 OK`: Successful GET/PUT operations
- `201 Created`: Successful POST operations
- `204 No Content`: Successful DELETE operations
- `400 Bad Request`: Invalid request data or business rule violation
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Valid auth but insufficient permissions
- `404 Not Found`: Resource doesn't exist or not accessible
- `422 Unprocessable Entity`: Validation errors
- `500 Internal Server Error`: Unexpected server errors

---

## MVP Priority Classification

### **MUST-HAVE (MVP Blockers)**
✅ **Authentication**:
- Login/logout functionality
- JWT token management
- User profile access

✅ **Core Time Tracking**:
- Start/stop timer with single-timer constraint
- Manual time entry creation
- Basic time entry editing/deletion

✅ **Basic Dashboard**:
- Today's time summary
- Recent time entries list
- Project selection for timers

✅ **Data Management**:
- Organization-scoped data isolation
- Basic project CRUD (read-only MVP acceptable)
- Input validation and error handling

### **NICE-TO-HAVE (Post-MVP)**
🔮 **Advanced Features**:
- User registration/password reset
- Task-level time tracking
- Advanced reporting (weekly/monthly analytics)
- Bulk time entry operations
- Export functionality
- Time entry templates
- Mobile optimizations

🔮 **Enterprise Features**:
- Client management
- Advanced user roles and permissions
- Audit logging
- API rate limiting
- Advanced search and filtering

---

## Implementation Notes

### **Database Dependencies**
- PostgreSQL database must be running
- Alembic migration `001_initial_migration.py` must be applied
- At minimum, requires: organizations, users, projects, timers, time_entries tables

### **Security Requirements**
- JWT tokens with 1-hour expiration
- Refresh tokens with 30-day expiration
- bcrypt password hashing (cost factor 12+)
- Organization-level data isolation in all queries
- Input sanitization for all text fields

### **Performance Considerations**
- Database indexes already optimized for MVP queries (per migration)
- Dashboard queries should use date range limits
- Time entry lists should implement cursor-based pagination for large datasets

### **Frontend Integration**
- API client expects Bearer token in Authorization header
- Frontend stores tokens in localStorage (MVP acceptable)
- Error responses should match format expected by existing api.ts

---

## Development Sequence

### **Phase 1: Foundation** (~2 days)
1. FastAPI application setup with database connection
2. Authentication JWT implementation
3. Basic user/organization models with middleware

### **Phase 2: Core Tracking** (~2 days)
1. Timer start/stop endpoints with business logic
2. Time entry CRUD operations
3. Project listing for UI

### **Phase 3: Dashboard** (~1-2 days)
1. Dashboard summary aggregations
2. Recent activity endpoints
3. Basic reporting queries

### **Phase 4: Polish** (~1 day)
1. Input validation and error handling
2. API documentation (OpenAPI/Swagger)
3. Basic testing

**Total Estimated Time: 6-7 days for MVP-ready backend**

---

## Conclusion

This specification provides a **production-ready foundation** for the Zentracker MVP while maintaining the existing database schema investments. The API design supports the core user flow (login → tracking → dashboard) with clear upgrade paths for post-MVP features.

**Success Criteria**: A user can log in, track time with project association, and view daily summaries - covering the complete MVP user journey with reliable data persistence and appropriate error handling.