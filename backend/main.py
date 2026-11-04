
import json
import os
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(
    title="Assignment 131 - Tenant Provisioning API",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


def db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "assignment131")
    )


def write_audit(cur, action, details, tenant_id=None):
    cur.execute(
        """
        INSERT INTO audit_logs (tenant_id, action, details)
        VALUES (%s, %s, %s)
        """,
        (tenant_id, action, details)
    )


class TenantIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    tenant_code: str = ""
    tenant_type: str = "Standard"
    region: str = "India"
    admin_email: str = ""


class ProvisioningUpdate(BaseModel):
    provisioning_status: str
    readiness_notes: str = ""
    reviewed_by: str = "Platform Admin"


class OrganizationStatusUpdate(BaseModel):
    status: str
    reason: str = ""
    reviewed_by: str = "Platform Admin"


@app.get("/api/health")
def health():
    try:
        c = db()
        c.close()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(503, f"Database connection failed: {e}")


@app.get("/api/tenants")
def tenants(search: str = ""):
    c = db()
    cur = c.cursor(dictionary=True)
    try:
        cur.execute(
            """
            SELECT * FROM tenants
            WHERE name LIKE %s OR tenant_code LIKE %s
            ORDER BY id DESC
            """,
            (f"%{search}%", f"%{search}%")
        )
        return cur.fetchall()
    finally:
        cur.close()
        c.close()


@app.post("/api/tenants")
def create_tenant(t: TenantIn):
    c = db()
    cur = c.cursor()
    try:
        cur.execute(
            """
            INSERT INTO tenants
            (name, tenant_code, tenant_type, region, admin_email, status)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                t.name, t.tenant_code, t.tenant_type,
                t.region, t.admin_email, "Pending"
            )
        )
        tid = cur.lastrowid

        write_audit(
            cur,
            "TENANT_CREATED",
            f"Tenant request created: {t.name}",
            tid
        )

        c.commit()
        return {"id": tid, "message": "Tenant request created"}
    except mysql.connector.Error as e:
        c.rollback()
        raise HTTPException(400, str(e))
    finally:
        cur.close()
        c.close()


@app.patch("/api/tenants/{tenant_id}/status")
def update_status(tenant_id: int, payload: dict):
    status = payload.get("status")
    reason = payload.get("reason", "")

    allowed = [
        "Pending", "Approved", "Rejected", "Returned",
        "Provisioning", "Active", "Suspended",
        "Decommissioned", "Draft Request", "Archived"
    ]

    if status not in allowed:
        raise HTTPException(400, "Invalid tenant status")

    c = db()
    cur = c.cursor()
    try:
        cur.execute(
            "SELECT name FROM tenants WHERE id = %s",
            (tenant_id,)
        )
        tenant = cur.fetchone()

        if not tenant:
            raise HTTPException(404, "Tenant not found")

        cur.execute(
            "UPDATE tenants SET status = %s WHERE id = %s",
            (status, tenant_id)
        )

        write_audit(
            cur,
            "STATUS_CHANGED",
            f"Status changed to {status}. {reason}",
            tenant_id
        )

        c.commit()
        return {"message": "Status updated", "status": status}
    except Exception:
        c.rollback()
        raise
    finally:
        cur.close()
        c.close()


@app.patch("/api/tenants/{tenant_id}/provisioning")
def update_provisioning(tenant_id: int, payload: ProvisioningUpdate):
    allowed = [
        "Not Started", "In Progress", "Ready",
        "Blocked", "Completed"
    ]

    if payload.provisioning_status not in allowed:
        raise HTTPException(400, "Invalid provisioning status")

    c = db()
    cur = c.cursor()
    try:
        cur.execute(
            "SELECT name FROM tenants WHERE id = %s",
            (tenant_id,)
        )
        tenant = cur.fetchone()

        if not tenant:
            raise HTTPException(404, "Tenant not found")

        cur.execute(
            """
            UPDATE tenants
            SET provisioning_status = %s,
                readiness_notes = %s,
                reviewed_by = %s
            WHERE id = %s
            """,
            (
                payload.provisioning_status,
                payload.readiness_notes,
                payload.reviewed_by,
                tenant_id
            )
        )

        write_audit(
            cur,
            "PROVISIONING_UPDATED",
            (
                f"Provisioning status changed to "
                f"{payload.provisioning_status}. "
                f"Notes: {payload.readiness_notes}. "
                f"Reviewed by {payload.reviewed_by}"
            ),
            tenant_id
        )

        c.commit()
        return {
            "message": "Provisioning readiness updated",
            "provisioning_status": payload.provisioning_status
        }
    except Exception:
        c.rollback()
        raise
    finally:
        cur.close()
        c.close()


@app.get("/api/provisioning/summary")
def provisioning_summary():
    c = db()
    cur = c.cursor(dictionary=True)
    try:
        cur.execute(
            """
            SELECT provisioning_status, COUNT(*) AS total
            FROM tenants
            GROUP BY provisioning_status
            ORDER BY provisioning_status
            """
        )
        return cur.fetchall()
    finally:
        cur.close()
        c.close()


@app.get("/api/audit")
def audit():
    c = db()
    cur = c.cursor(dictionary=True)
    try:
        cur.execute(
            """
            SELECT a.*, t.name AS tenant_name
            FROM audit_logs a
            LEFT JOIN tenants t ON t.id = a.tenant_id
            ORDER BY a.created_at DESC
            LIMIT 200
            """
        )
        return cur.fetchall()
    finally:
        cur.close()
        c.close()


@app.post("/api/seed")
def seed():
    data = json.loads(
        Path(__file__).with_name("seed.json").read_text(encoding="utf-8")
    )

    c = db()
    cur = c.cursor()
    count = 0

    try:
        for t in data.get("tenants", []):
            name = (
                t.get("name")
                or t.get("tenant_name")
                or t.get("display_name")
            )

            if not name:
                continue

            sid = str(
                t.get("id")
                or t.get("tenant_id")
                or t.get("tenant_code")
                or name
            )

            cur.execute(
                """
                INSERT IGNORE INTO tenants
                (source_id, name, tenant_code, status,
                 tenant_type, region, admin_email)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    sid,
                    name,
                    str(t.get("tenant_code", "")),
                    str(t.get("status", "Pending")),
                    str(t.get("tenant_type", "Standard")),
                    str(t.get("region", "India")),
                    str(t.get("admin_email", ""))
                )
            )
            count += cur.rowcount

        c.commit()
        return {
            "seeded": count,
            "source_tenants": len(data.get("tenants", []))
        }
    except Exception:
        c.rollback()
        raise
    finally:
        cur.close()
        c.close()


@app.get("/api/organizations")
def organizations(search: str = ""):
    c = db()
    cur = c.cursor(dictionary=True)
    try:
        query = """
            SELECT
                o.id,
                o.source_id,
                o.tenant_source_id,
                o.name,
                o.org_type,
                o.status,
                o.details,
                t.name AS tenant_name
            FROM organizations o
            LEFT JOIN tenants t
                ON t.source_id = o.tenant_source_id
            WHERE o.name LIKE %s
               OR o.org_type LIKE %s
               OR o.tenant_source_id LIKE %s
            ORDER BY o.id
        """

        term = f"%{search}%"
        cur.execute(query, (term, term, term))
        rows = cur.fetchall()

        for row in rows:
            if isinstance(row.get("details"), str):
                row["details"] = json.loads(row["details"])

        return rows
    finally:
        cur.close()
        c.close()


@app.get("/api/organizations/{organization_id}")
def organization_detail(organization_id: int):
    c = db()
    cur = c.cursor(dictionary=True)
    try:
        cur.execute(
            "SELECT * FROM organizations WHERE id = %s",
            (organization_id,)
        )
        row = cur.fetchone()

        if not row:
            raise HTTPException(404, "Organization not found")

        if isinstance(row.get("details"), str):
            row["details"] = json.loads(row["details"])

        return row
    finally:
        cur.close()
        c.close()


@app.patch("/api/organizations/{organization_id}/status")
def update_organization_status(
    organization_id: int,
    payload: OrganizationStatusUpdate
):
    allowed = [
        "Active", "Suspended", "Archived",
        "Draft", "Validation Pending", "Decommissioned"
    ]

    if payload.status not in allowed:
        raise HTTPException(400, "Invalid organization status")

    c = db()
    cur = c.cursor(dictionary=True)
    try:
        cur.execute(
            """
            SELECT id, name, tenant_source_id, details
            FROM organizations
            WHERE id = %s
            """,
            (organization_id,)
        )
        org = cur.fetchone()

        if not org:
            raise HTTPException(404, "Organization not found")

        details = org.get("details")
        if isinstance(details, str):
            details = json.loads(details)

        if not isinstance(details, dict):
            details = {}

        details["lifecycleStatus"] = payload.status

        cur.execute(
            """
            UPDATE organizations
            SET status = %s, details = %s
            WHERE id = %s
            """,
            (payload.status, json.dumps(details), organization_id)
        )

        cur.execute(
            "SELECT id FROM tenants WHERE source_id = %s",
            (org["tenant_source_id"],)
        )
        tenant = cur.fetchone()
        tenant_id = tenant["id"] if tenant else None

        write_audit(
            cur,
            "ORGANIZATION_STATUS_CHANGED",
            (
                f"Organization {org['name']} status changed to "
                f"{payload.status}. {payload.reason} "
                f"Reviewed by {payload.reviewed_by}"
            ),
            tenant_id
        )

        c.commit()
        return {
            "message": "Organization lifecycle updated",
            "organization_id": organization_id,
            "status": payload.status
        }
    except Exception:
        c.rollback()
        raise
    finally:
        cur.close()
        c.close()
