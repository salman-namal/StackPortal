-- Master database only. Matches com.stackportal.entity.master.Tenant.
CREATE TABLE tenants (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    logo VARCHAR(255),
    email VARCHAR(150),
    website VARCHAR(255),
    phone VARCHAR(255),
    address VARCHAR(500),
    city VARCHAR(100),
    country VARCHAR(100),
    database_name VARCHAR(255) NOT NULL,
    database_url VARCHAR(255) NOT NULL,
    database_username VARCHAR(255) NOT NULL,
    database_password VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    CONSTRAINT uk_tenants_name UNIQUE (name),
    CONSTRAINT uk_tenants_code UNIQUE (code),
    CONSTRAINT uk_tenants_database_name UNIQUE (database_name)
);
