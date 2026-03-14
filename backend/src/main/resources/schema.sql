-- BDSPM schema for PostgreSQL
-- Run after creating database: CREATE DATABASE bdspm;

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS properties (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bed_units (
    id BIGSERIAL PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tenancy_contracts (
    id BIGSERIAL PRIMARY KEY,
    tenant_name VARCHAR(200) NOT NULL,
    tenant_government_id VARCHAR(100) NOT NULL,
    tenant_phone_number VARCHAR(30) NOT NULL,
    property_id BIGINT NOT NULL REFERENCES properties(id),
    room_id BIGINT NOT NULL REFERENCES rooms(id),
    bed_unit_id BIGINT NOT NULL REFERENCES bed_units(id),
    rent_amount NUMERIC(19,4) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    ended_immediately BOOLEAN NOT NULL DEFAULT false,
    actual_end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    txn_no VARCHAR(100) NOT NULL UNIQUE,
    amount NUMERIC(19,4) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    tenancy_contract_id BIGINT REFERENCES tenancy_contracts(id),
    property_id BIGINT REFERENCES properties(id),
    room_id BIGINT REFERENCES rooms(id),
    bed_unit_id BIGINT REFERENCES bed_units(id),
    due_date DATE NOT NULL,
    amount_paid NUMERIC(19,4) NOT NULL DEFAULT 0,
    amount_pending NUMERIC(19,4) NOT NULL DEFAULT 0,
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bed_units_room_id ON bed_units(room_id);
CREATE INDEX IF NOT EXISTS idx_tenancy_contracts_property_id ON tenancy_contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_tenancy_contracts_room_id ON tenancy_contracts(room_id);
CREATE INDEX IF NOT EXISTS idx_tenancy_contracts_bed_unit_id ON tenancy_contracts(bed_unit_id);
CREATE INDEX IF NOT EXISTS idx_tenancy_contracts_status_end_date ON tenancy_contracts(status, end_date);
CREATE INDEX IF NOT EXISTS idx_rooms_property_id ON rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_by ON payments(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenancy_contract_id ON payments(tenancy_contract_id);
CREATE INDEX IF NOT EXISTS idx_payments_property_id ON payments(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_room_id ON payments(room_id);
CREATE INDEX IF NOT EXISTS idx_payments_bed_unit_id ON payments(bed_unit_id);
CREATE INDEX IF NOT EXISTS idx_users_username_email_active ON users(username, email) WHERE is_active = true;

-- Sample agent user (match with your Google email for OAuth2 + X-Agent-Username)
-- INSERT INTO users (username, email, role, is_active) VALUES ('agent1', 'your@gmail.com', 'AGENT', true);
