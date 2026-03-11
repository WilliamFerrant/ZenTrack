# Zentracker Backend API
*FastAPI-based time tracking application backend*

## Project Status
✅ **AUTHENTICATION IMPLEMENTED** - Ready for testing and further development

## Quick Reference

### **API Endpoints (MVP)**
```
Authentication:
POST   /api/v1/auth/login      - User login
POST   /api/v1/auth/refresh    - Token refresh
GET    /api/v1/auth/me         - Current user profile
POST   /api/v1/auth/logout     - Logout

Time Tracking:
GET    /api/v1/timers/current  - Get running timer
POST   /api/v1/timers/start    - Start timer
POST   /api/v1/timers/stop     - Stop timer
GET    /api/v1/time-entries    - List time entries
POST   /api/v1/time-entries    - Create time entry
PUT    /api/v1/time-entries/{id} - Update time entry
DELETE /api/v1/time-entries/{id} - Delete time entry

Dashboard & Projects:
GET    /api/v1/dashboard/summary - Dashboard data
GET    /api/v1/projects        - List projects
```

### **Core User Flow**
1. `POST /auth/login` → Get JWT token
2. `POST /timers/start` → Start time tracking
3. `POST /timers/stop` → Stop timer, create time entry
4. `GET /dashboard/summary` → View time summaries

## Implementation Status

### ✅ **COMPLETED**
- Database schema (comprehensive PostgreSQL schema)
- Database migration (`migrations/versions/001_initial_migration.py`)
- **FastAPI application** (`app/main.py`) - ✅ Implemented
- **Authentication system** (`app/core/security.py`) - ✅ JWT + password hashing
- **Authentication endpoints** (`app/api/v1/endpoints/auth.py`) - ✅ Login, refresh, logout, me
- **Data models** (`app/models/`) - ✅ User and Organization models
- **Business services** (`app/services/auth_service.py`) - ✅ Authentication logic
- **Request/response schemas** (`app/schemas/`) - ✅ Pydantic validation

### 🔧 **NEEDS IMPLEMENTATION**
- **Time tracking endpoints** - Timer start/stop, time entries CRUD
- **Dashboard endpoints** - Summary data and reporting
- **Project management** - Projects and tasks endpoints
- **Advanced validation** - Business rule constraints
- **Automated testing** - Unit and integration tests

## Getting Started

### **Prerequisites**
- Python 3.12+
- PostgreSQL 14+
- Git

### **Environment Setup**
```bash
# Clone and navigate to project
cd backend/

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies (after requirements.txt is created)
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env  # Create this file
# Edit .env with your database connection and secrets
```

### **Required Environment Variables**
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/zentracker_dev

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# App
DEBUG=True
API_V1_STR=/api/v1
PROJECT_NAME=Zentracker
```

### **Database Setup**
```bash
# Create database
createdb zentracker_dev

# Run migrations
alembic upgrade head

# Verify tables created
psql zentracker_dev -c "\dt"
```

### **Development Server**
```bash
# Start API server (after implementation)
uvicorn app.main:app --reload --port 8000

# API Documentation will be available at:
# http://localhost:8000/docs
```

## Implementation Guide

### **Phase 1: Foundation Setup**
Follow the [Implementation Roadmap](../docs/implementation-roadmap.md) for step-by-step development.

**Start with these files:**
1. `app/main.py` - FastAPI application entry point
2. `app/core/config.py` - Configuration management
3. `app/db/database.py` - Database connection
4. `app/models/base.py` - Base model class

### **Key Implementation Notes**
- **Database Schema**: Already complete, use existing migration
- **Authentication**: JWT tokens with organization-scoped access
- **Data Isolation**: All queries must be organization-scoped
- **Frontend Integration**: API client expects Bearer token auth

## Database Schema

### **Core Tables (MVP)**
- `organizations` - Multi-tenant organization management
- `users` - User authentication and profiles
- `projects` - Project organization for time tracking
- `timers` - Active time tracking sessions
- `time_entries` - Completed time tracking records

### **Relationships**
```
Organization 1-to-many Users
Organization 1-to-many Projects
User 1-to-many Timers
User 1-to-many TimeEntries
Project 1-to-many Timers
Project 1-to-many TimeEntries
```

**Note**: Full schema includes tasks, clients, tags - see migration file for complete structure.

## API Design Principles

### **Authentication**
- JWT Bearer tokens in Authorization header
- Organization-scoped data access for all endpoints
- Role-based permissions (ADMIN, MANAGER, MEMBER, VIEWER)

### **Error Handling**
- Consistent JSON error format across all endpoints
- Appropriate HTTP status codes (400, 401, 403, 404, 422)
- User-friendly error messages for frontend display

### **Data Validation**
- Pydantic models for request/response validation
- Business rule validation (single timer per user, etc.)
- Input sanitization for security

## Testing Strategy

### **Test Coverage Requirements**
- **Authentication flows**: Login, token validation, permissions
- **Timer workflows**: Start/stop timer, time entry creation
- **Business rules**: Single timer constraint, data validation
- **Database integrity**: Model relationships, constraints

### **Test Setup**
```bash
# Run tests (after implementation)
pytest -v

# With coverage
pytest --cov=app tests/

# Test specific module
pytest tests/test_auth.py
```

## Security Considerations

### **Authentication**
- bcrypt password hashing (cost factor 12+)
- JWT tokens with reasonable expiration (1 hour)
- Refresh tokens for session management
- Secure token storage recommendations for frontend

### **Data Protection**
- Organization-level data isolation
- Input validation and sanitization
- SQL injection prevention via ORM
- CORS configuration for frontend origins

## Production Deployment

### **Environment Requirements**
- Python 3.12+ runtime
- PostgreSQL 14+ database
- Redis (future caching/sessions)
- SSL/TLS termination

### **Configuration**
- Environment-based configuration
- Secret management for production
- Database connection pooling
- Logging configuration

### **Performance**
- Database indexes optimized for common queries
- Response caching for dashboard aggregations
- API rate limiting (post-MVP)

## Development Tools

### **Recommended Tools**
- **API Testing**: Postman, HTTPie, or curl
- **Database**: pgAdmin, DBeaver, or psql
- **Code Quality**: black, isort, mypy
- **API Documentation**: Built-in Swagger UI at `/docs`

### **VS Code Extensions**
- Python
- Python Docstring Generator
- SQLTools PostgreSQL
- Thunder Client (API testing)

## Troubleshooting

### **Common Issues**
1. **Database Connection**: Verify PostgreSQL running and credentials
2. **Migration Errors**: Check database exists and has proper permissions
3. **Import Errors**: Ensure virtual environment activated
4. **CORS Issues**: Verify frontend origin in CORS configuration

### **Debug Mode**
```bash
# Enable debug logging
export DEBUG=True
uvicorn app.main:app --reload --log-level debug
```

## Contributing

### **Code Style**
- Follow PEP 8 Python style guide
- Use type hints for all function parameters and returns
- Document complex business logic with docstrings
- Keep functions focused and testable

### **Git Workflow**
- Feature branches for new functionality
- Descriptive commit messages
- PR reviews for code quality
- Tests required for new features

## Support

### **Documentation**
- **API Spec**: `docs/mvp-backend-spec.md` - Complete API documentation
- **Roadmap**: `docs/implementation-roadmap.md` - Development guide
- **Database**: `migrations/versions/001_initial_migration.py` - Schema reference

### **Getting Help**
- Check implementation roadmap for development sequence
- Reference API specification for endpoint contracts
- Review database migration for schema understanding
- Test with API documentation at `/docs` endpoint