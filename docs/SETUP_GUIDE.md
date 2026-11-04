# Assignment 131 – Setup Guide
## Tenant Directory & Provisioning

### 1. Project Overview
This application provides a Platform Admin interface for tenant onboarding, tenant management, organization directory, provisioning readiness and governance audit tracking.

### 2. Technology Stack
- Frontend: React, Vite, JavaScript, CSS
- Backend: Python, FastAPI
- Database: MySQL
- API Documentation: Swagger UI
- Development tools: VS Code, MySQL Workbench

### 3. Prerequisites
- Python 3
- Node.js and npm
- MySQL Server
- MySQL Workbench (optional)

### 4. Database Setup
1. Start the MySQL80 service.
2. Open MySQL Workbench.
3. Connect using an administrative MySQL account.
4. Open and execute `database/schema.sql`.
5. Configure the database credentials in `backend/.env`.

Required environment variables:

DB_HOST=localhost
DB_PORT=3306
DB_USER=assignment131_user
DB_PASSWORD=your_database_password
DB_NAME=assignment131

### 5. Backend Setup

Open Command Prompt:

    cd /d C:\Assignment131\backend
    venv\Scripts\activate
    uvicorn main:app --reload

Backend URL:
http://127.0.0.1:8000

API documentation:
http://127.0.0.1:8000/docs

### 6. Load Sample Data

Use Swagger UI:
- Execute POST /api/seed to load tenant records.
- Run the organization import script:

    python import_organizations.py

### 7. Frontend Setup

Open another Command Prompt:

    cd /d C:\Assignment131\frontend
    npm install
    npm run dev

Open the local URL displayed by Vite, for example:
http://localhost:5174/

### 8. Health Check

Open:
http://127.0.0.1:8000/api/health

Expected response:

    {"status":"ok","database":"connected"}

### 9. Important Notes
- Keep the backend and frontend terminal windows running while using the application.
- Never share the real database password.
- Use the supplied sample data for testing.