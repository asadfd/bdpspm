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

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    txn_no VARCHAR(100) NOT NULL UNIQUE,
    amount NUMERIC(19,4) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    property_id BIGINT REFERENCES properties(id),
    room_id BIGINT REFERENCES rooms(id),
    bed_unit_id BIGINT REFERENCES bed_units(id),
    created_by_user_id BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bed_units_room_id ON bed_units(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_property_id ON rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_by ON payments(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_payments_property_id ON payments(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_room_id ON payments(room_id);
CREATE INDEX IF NOT EXISTS idx_payments_bed_unit_id ON payments(bed_unit_id);
CREATE INDEX IF NOT EXISTS idx_users_username_email_active ON users(username, email) WHERE is_active = true;

-- Sample agent user (match with your Google email for OAuth2 + X-Agent-Username)
-- INSERT INTO users (username, email, role, is_active) VALUES ('agent1', 'your@gmail.com', 'AGENT', true);
