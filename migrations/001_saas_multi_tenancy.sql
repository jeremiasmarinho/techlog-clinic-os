-- ============================================
-- MIGRATION: Multi-Tenancy (SaaS Architecture)
-- Date: 2026-01-30
-- Description: Transform single-tenant to multi-tenant system
-- ============================================

-- Step 1: Create Clinics Table
CREATE TABLE IF NOT EXISTS clinics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
    plan_tier TEXT DEFAULT 'free' CHECK(plan_tier IN ('free', 'pro', 'enterprise')),
    config_json TEXT,
    owner_email TEXT,
    owner_phone TEXT,
    max_users INTEGER DEFAULT 3,
    max_leads_per_month INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Insert Default Clinic (For existing data)
INSERT OR IGNORE INTO clinics (id, name, slug, status, plan_tier, config_json) 
VALUES (
    1, 
    'Clínica Viva', 
    'clinica-viva', 
    'active', 
    'pro',
    '{"logo": null, "primary_color": "#06b6d4", "secondary_color": "#10B981", "working_hours": "08:00-18:00"}'
);

-- Step 3: Backup users table structure
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;

-- Step 4: Create new users table with multi-tenancy columns
CREATE TABLE IF NOT EXISTS users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    clinic_id INTEGER DEFAULT 1 REFERENCES clinics(id),
    role TEXT DEFAULT 'staff' CHECK(role IN ('super_admin', 'clinic_admin', 'staff')),
    is_owner INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 5: Copy data from old users table to new users table
INSERT INTO users_new (id, name, username, password, clinic_id, role, is_owner, created_at)
SELECT id, name, username, password, 1, 'clinic_admin', 1, created_at FROM users;

-- Step 6: Drop old users table and rename new one
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Step 7: Update first user to super_admin
UPDATE users SET role = 'super_admin', is_owner = 1 WHERE id = 1;

-- Step 8: Backup leads table
CREATE TABLE IF NOT EXISTS leads_backup AS SELECT * FROM leads;

-- Step 9: Add clinic_id to leads table
CREATE TABLE IF NOT EXISTS leads_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    type TEXT DEFAULT 'agendamento',
    status TEXT DEFAULT 'novo',
    notes TEXT,
    source TEXT DEFAULT 'Manual',
    clinic_id INTEGER DEFAULT 1 REFERENCES clinics(id),
    appointment_date DATETIME,
    doctor TEXT,
    attendance_status TEXT,
    archive_reason TEXT,
    value REAL DEFAULT 0,
    status_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 10: Copy leads data with clinic_id
INSERT INTO leads_new 
SELECT id, name, phone, type, status, notes, source, 1, appointment_date, doctor, attendance_status, archive_reason, value, status_updated_at, created_at, updated_at 
FROM leads;

-- Step 11: Drop old leads table and rename new one
DROP TABLE leads;
ALTER TABLE leads_new RENAME TO leads;

-- Step 12: Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_leads_clinic_id ON leads(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinics_slug ON clinics(slug);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 13: Create Trigger for clinics updated_at
CREATE TRIGGER IF NOT EXISTS update_clinics_timestamp 
AFTER UPDATE ON clinics
BEGIN
    UPDATE clinics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Step 14: Create Trigger for users updated_at
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================
-- VERIFICATION QUERIES (Run these after migration)
-- ============================================
-- SELECT * FROM clinics;
-- SELECT id, username, role, clinic_id, is_owner FROM users;
-- SELECT COUNT(*) as total_leads, clinic_id FROM leads GROUP BY clinic_id;
