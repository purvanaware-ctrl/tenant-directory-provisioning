# Assignment 131 – Technical Documentation
## Tenant Directory & Provisioning

### 1. Project Overview
The application is designed for Platform Administrators to manage tenant onboarding, organization boundaries, provisioning readiness and governance activities.

### 2. System Architecture

The application follows a three-layer architecture:

- **Frontend:** React application providing the administrative user interface.
- **Backend:** Python FastAPI application exposing REST APIs.
- **Database:** MySQL storing tenant, organization and audit information.

Frontend requests are sent to the FastAPI backend, which performs database operations and returns JSON responses.

### 3. Main Modules

**Tenant Directory**
- Displays tenant records.
- Supports tenant search.
- Allows administrators to create tenant requests.
- Supports tenant status review and lifecycle actions.

**Organization Directory**
- Displays organization hierarchy.
- Shows tenant association, organization type and region.
- Provides organization boundary and governance details.
- Supports organization lifecycle management.

**Tenant Provisioning**
- Tracks provisioning readiness.
- Supports Ready and other provisioning states.
- Stores readiness notes.
- Displays provisioning summaries.

**Governance & Audit**
- Records tenant creation.
- Records tenant status changes.
- Records provisioning updates.
- Tracks administrative actions and timestamps.

### 4. REST API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend and database connectivity |
| GET | `/api/tenants` | Retrieve tenant records |
| POST | `/api/tenants` | Create a tenant request |
| PATCH | `/api/tenants/{tenant_id}/status` | Update tenant status |
| GET | `/api/organizations` | Retrieve organizations |
| GET | `/api/organizations/{organization_id}` | Retrieve organization details |
| PATCH | `/api/organizations/{organization_id}/status` | Update organization lifecycle |
| PATCH | `/api/tenants/{tenant_id}/provisioning` | Update provisioning readiness |
| GET | `/api/provisioning/summary` | Retrieve provisioning statistics |
| GET | `/api/audit` | Retrieve governance audit records |
| POST | `/api/seed` | Load sample tenant data |

### 5. Data Flow

1. Administrator performs an action in the React interface.
2. Frontend sends an HTTP request to the FastAPI backend.
3. Backend validates and processes the request.
4. MySQL stores or retrieves the required information.
5. Backend returns a JSON response.
6. Frontend refreshes the displayed information.

### 6. Security and Governance
- Database credentials are stored in the backend environment configuration.
- Administrative operations are processed through backend API endpoints.
- Audit records capture important tenant and provisioning changes.
- Organization records are associated with tenant identifiers.

### 7. Testing Performed
- Backend health and MySQL connectivity verified.
- 34 sample tenant records loaded.
- 57 organization records imported.
- Tenant creation tested.
- Tenant approval workflow tested.
- Provisioning readiness updated and verified.
- Organization directory and lifecycle details inspected.
- Governance audit records verified.

### 8. Conclusion
The application demonstrates tenant directory management, onboarding, provisioning readiness, organization governance and audit tracking through a React, FastAPI and MySQL-based application.