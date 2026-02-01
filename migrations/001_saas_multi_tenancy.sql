-- ============================================================================
-- MIGRATION: SaaS Multi-Tenancy Transformation
-- Description: Transforma o sistema em SaaS Multi-Tenant
-- Version: 001
-- Date: 2026-02-01
-- Author: Senior Software Architect
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE CLINICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier (ex: clinica-a, clinica-b)
    owner_id INTEGER,
    plan_tier TEXT DEFAULT 'basic' CHECK(plan_tier IN ('basic', 'professional', 'enterprise')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'trial', 'cancelled')),
    max_users INTEGER DEFAULT 5,
    max_patients INTEGER DEFAULT 1000,
    trial_ends_at DATETIME,
    subscription_started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    subscription_ends_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_clinics_slug ON clinics(slug);
CREATE INDEX IF NOT EXISTS idx_clinics_owner ON clinics(owner_id);
CREATE INDEX IF NOT EXISTS idx_clinics_status ON clinics(status);

-- ============================================================================
-- STEP 2: ALTER USERS TABLE - ADD CLINIC_ID
-- ============================================================================

-- Add clinic_id column to users table
ALTER TABLE users ADD COLUMN clinic_id INTEGER REFERENCES clinics(id) ON DELETE CASCADE;

-- Add is_owner flag
ALTER TABLE users ADD COLUMN is_owner INTEGER DEFAULT 0;

-- Add updated_at timestamp (SQLite doesn't support DEFAULT CURRENT_TIMESTAMP on ALTER)
ALTER TABLE users ADD COLUMN updated_at DATETIME;

CREATE INDEX IF NOT EXISTS idx_users_clinic ON users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- STEP 3: ALTER LEADS TABLE - ADD CLINIC_ID (OBRIGATÓRIA)
-- ============================================================================

-- Add clinic_id column to leads table
ALTER TABLE leads ADD COLUMN clinic_id INTEGER NOT NULL DEFAULT 1 REFERENCES clinics(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_leads_clinic ON leads(clinic_id);
CREATE INDEX IF NOT EXISTS idx_leads_status_clinic ON leads(status, clinic_id);

-- ============================================================================
-- STEP 4: CREATE PATIENTS TABLE (NEW STRUCTURE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    cpf TEXT,
    birth_date DATE,
    gender TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    notes TEXT,
    status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting', 'triage', 'consultation', 'finished')),
    end_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_status_clinic ON patients(status, clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
CREATE INDEX IF NOT EXISTS idx_patients_cpf ON patients(cpf);

-- ============================================================================
-- STEP 5: CREATE APPOINTMENTS TABLE (NEW STRUCTURE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    doctor TEXT,
    appointment_date DATETIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    type TEXT DEFAULT 'consulta',
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_clinic ON appointments(appointment_date, clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status_clinic ON appointments(status, clinic_id);

-- ============================================================================
-- STEP 6: CREATE KANBAN_COLUMNS TABLE (NEW STRUCTURE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS kanban_columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    position INTEGER NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(clinic_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_kanban_clinic ON kanban_columns(clinic_id);
CREATE INDEX IF NOT EXISTS idx_kanban_position ON kanban_columns(position);

-- ============================================================================
-- STEP 7: SEED DEFAULT CLINIC (ID = 1) - For Migration Compatibility
-- ============================================================================

-- Insert default clinic to maintain backwards compatibility
-- This ensures existing data with clinic_id = 1 has a valid reference
INSERT OR IGNORE INTO clinics (id, name, slug, plan_tier, status, max_users, max_patients)
VALUES (1, 'Clínica Padrão', 'clinica-padrao', 'enterprise', 'active', 999, 999999);

-- Update existing users to belong to default clinic
UPDATE users SET clinic_id = 1 WHERE clinic_id IS NULL;

-- ============================================================================
-- STEP 8: CREATE TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

-- Trigger for clinics
CREATE TRIGGER IF NOT EXISTS update_clinics_timestamp
AFTER UPDATE ON clinics
BEGIN
    UPDATE clinics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger for users
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger for patients
CREATE TRIGGER IF NOT EXISTS update_patients_timestamp
AFTER UPDATE ON patients
BEGIN
    UPDATE patients SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger for appointments
CREATE TRIGGER IF NOT EXISTS update_appointments_timestamp
AFTER UPDATE ON appointments
BEGIN
    UPDATE appointments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger for kanban_columns
CREATE TRIGGER IF NOT EXISTS update_kanban_columns_timestamp
AFTER UPDATE ON kanban_columns
BEGIN
    UPDATE kanban_columns SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- STEP 9: SEED DEFAULT KANBAN COLUMNS FOR DEFAULT CLINIC
-- ============================================================================

INSERT OR IGNORE INTO kanban_columns (clinic_id, name, slug, position, color, is_default)
VALUES
    (1, 'Novo', 'novo', 1, '#3B82F6', 1),
    (1, 'Em Atendimento', 'em_atendimento', 2, '#8B5CF6', 1),
    (1, 'Agendado', 'agendado', 3, '#10B981', 1),
    (1, 'Finalizado', 'finalizado', 4, '#6B7280', 1);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verification queries (commented out - use for debugging)
-- SELECT 'Clinics:', COUNT(*) FROM clinics;
-- SELECT 'Users with clinic_id:', COUNT(*) FROM users WHERE clinic_id IS NOT NULL;
-- SELECT 'Leads with clinic_id:', COUNT(*) FROM leads WHERE clinic_id IS NOT NULL;
-- SELECT 'Patients:', COUNT(*) FROM patients;
-- SELECT 'Appointments:', COUNT(*) FROM appointments;
-- SELECT 'Kanban Columns:', COUNT(*) FROM kanban_columns;
