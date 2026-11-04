# Assignment 131 – Database Documentation
## Tenant Directory & Provisioning

### 1. Database Overview
Database name: `assignment131`

Database engine: MySQL

Character set: `utf8mb4`

The database stores tenant records, organization information and governance audit history.

### 2. Database Tables

#### Table: tenants
Stores tenant directory and provisioning information.

| Column | Description |
|---|---|
| id | Primary key, auto-increment |
| source_id | Original tenant identifier |
| name | Tenant name |
| tenant_code | Unique tenant code where supplied |
| status | Tenant lifecycle or review status |
| tenant_type | Tenant category |
| region | Tenant region |
| admin_email | Administrator email |
| created_at | Record creation timestamp |
| updated_at | Last update timestamp |
| provisioning_status | Provisioning readiness status |
| readiness_notes | Provisioning notes and evidence |
| reviewed_by | Administrative reviewer |

#### Table: organizations
Stores organization hierarchy and boundary information.

| Column | Description |
|---|---|
| id | Primary key, auto-increment |
| source_id | Original organization identifier |
| tenant_source_id | Associated tenant source identifier |
| name | Organization name |
| org_type | Organization type |
| status | Organization lifecycle status |
| details | Additional organization details stored as JSON |

#### Table: audit_logs
Stores administrative activity and governance history.

| Column | Description |
|---|---|
| id | Primary key, auto-increment |
| tenant_id | Associated tenant ID |
| action | Type of action recorded |
| details | Description of the action |
| actor | User or administrative actor |
| created_at | Event timestamp |

### 3. Relationships
- `tenants.id` is the primary key for tenant records.
- `organizations.tenant_source_id` associates an organization with its source tenant identifier.
- `audit_logs.tenant_id` references `tenants.id`.
- The audit foreign key uses `ON DELETE SET NULL` to preserve audit records if a tenant is deleted.

### 4. Sample Data
The application was tested with:
- 34 tenant records.
- 57 organization records.
- Audit records generated through tenant creation, approval and provisioning operations.

### 5. Database Setup
Execute the SQL script:

`database/schema.sql`

Configure database connection details in:

`backend/.env`

Do not include real database passwords in submitted documentation or source control.

### 6. Conclusion
The MySQL database supports tenant administration, organization directory management, provisioning tracking and governance audit operations.