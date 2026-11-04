# Assignment 131 – Tenant Directory & Provisioning

A Platform Admin application for managing tenant onboarding, organization boundaries, provisioning readiness and governance audit history.

## Technology Stack

- **Frontend:** React, JavaScript, Vite, CSS
- **Backend:** Python, FastAPI
- **Database:** MySQL 8.0
- **API:** REST APIs
- **API Documentation:** Swagger UI

## Project Structure

```text
Assignment131/
├── backend/
│   ├── main.py
│   ├── seed.json
│   ├── import_organizations.py
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
├── database/
│   └── schema.sql
├── docs/
│   ├── SETUP_GUIDE.md
│   ├── TECHNICAL_DOCUMENTATION.md
│   └── DATABASE_DOCUMENTATION.md
├── frontend/
│   ├── index.html
│   ├── package.json
│   └── src/
├── README.md
```

## Prerequisites

- Python 3.10 or later
- Node.js and npm
- MySQL Server 8.0
- MySQL Workbench (recommended)

## 1. Database Setup

1. Start MySQL Server.
2. Open MySQL Workbench.
3. Connect using an administrative MySQL account.
4. Open `database/schema.sql`.
5. Execute the SQL script.

This creates the `assignment131` database and the following tables:

- `tenants`
- `organizations`
- `audit_logs`

Configure the database connection in `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=assignment131_user
DB_PASSWORD=your_database_password
DB_NAME=assignment131
```

Use your own database credentials. Do not commit `.env` or expose database passwords.

## 2. Backend Setup

Open Command Prompt:

```cmd
cd /d C:\Assignment131\backend
```

Create and activate a virtual environment if one does not already exist:

```cmd
python -m venv venv
venv\Scripts\activate
```

Install dependencies:

```cmd
pip install -r requirements.txt
```

Start the FastAPI server:

```cmd
uvicorn main:app --reload
```

Backend URL:

http://127.0.0.1:8000

Interactive API documentation:

http://127.0.0.1:8000/docs

Verify the backend and database connection:

http://127.0.0.1:8000/api/health

## 3. Load Sample Data

Use Swagger UI:

1. Execute `POST /api/seed` to load the sample tenant records.
2. In another Command Prompt, run:

```cmd
cd /d C:\Assignment131\backend
venv\Scripts\activate
python import_organizations.py
```

The sample dataset contains 34 tenants and 57 organizations.

## 4. Frontend Setup

Open a second Command Prompt:

```cmd
cd /d C:\Assignment131\frontend
npm install
npm run dev
```

Open the local URL printed by Vite, for example:

http://localhost:5174/

Keep both frontend and backend servers running while using the application.

## 5. Application Features

### Tenant Directory
- View and search tenant records.
- Create new tenant requests.
- Review and update tenant status.
- Manage tenant lifecycle actions.

### Organization Directory
- View organization records and hierarchy.
- Review tenant associations and organization boundaries.
- View governance and organization details.
- Manage organization lifecycle status.

### Tenant Provisioning
- Track provisioning readiness.
- Update provisioning status.
- Record readiness notes and verification details.
- View provisioning summary counts.

### Governance & Audit
- Record tenant creation events.
- Track tenant status changes.
- Record provisioning updates.
- View administrative activity and timestamps.

## 6. REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Backend and database health |
| GET | `/api/tenants` | List and search tenants |
| POST | `/api/tenants` | Create tenant request |
| PATCH | `/api/tenants/{tenant_id}/status` | Update tenant status |
| GET | `/api/organizations` | List organizations |
| GET | `/api/organizations/{organization_id}` | View organization details |
| PATCH | `/api/organizations/{organization_id}/status` | Update organization lifecycle |
| PATCH | `/api/tenants/{tenant_id}/provisioning` | Update provisioning readiness |
| GET | `/api/provisioning/summary` | Provisioning summary |
| GET | `/api/audit` | View audit history |
| POST | `/api/seed` | Load sample tenant data |

## 7. Testing Performed

The following application workflows were tested:

- Backend health check and MySQL connectivity.
- Loading 34 sample tenant records.
- Importing 57 organization records.
- Tenant directory and organization directory display.
- Creating a tenant request.
- Approving a tenant request.
- Updating provisioning readiness to Ready.
- Recording tenant creation, approval and provisioning events in audit history.

## 8. Additional Documentation

Refer to the `docs/` folder:

- `SETUP_GUIDE.md` – Installation and execution instructions.
- `TECHNICAL_DOCUMENTATION.md` – Architecture, modules and API details.
- `DATABASE_DOCUMENTATION.md` – Database tables and relationships.

## 9. Conclusion

Assignment 131 demonstrates a tenant administration and provisioning application using React, FastAPI and MySQL. It provides administrative workflows for tenant onboarding, organization governance, provisioning readiness and audit tracking.