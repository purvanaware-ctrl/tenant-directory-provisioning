
CREATE DATABASE IF NOT EXISTS assignment131
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE assignment131;

CREATE TABLE IF NOT EXISTS tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_id VARCHAR(100) UNIQUE,
    name VARCHAR(200) NOT NULL,
    tenant_code VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    tenant_type VARCHAR(100),
    region VARCHAR(100),
    admin_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    provisioning_status VARCHAR(50) DEFAULT 'Not Started',
    readiness_notes TEXT,
    reviewed_by VARCHAR(100) DEFAULT 'Platform Admin'
);

CREATE TABLE IF NOT EXISTS organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_id VARCHAR(100) UNIQUE,
    tenant_source_id VARCHAR(100),
    name VARCHAR(200) NOT NULL,
    org_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active',
    details JSON NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    actor VARCHAR(100) DEFAULT 'Platform Admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id)
        REFERENCES tenants(id)
        ON DELETE SET NULL
);
