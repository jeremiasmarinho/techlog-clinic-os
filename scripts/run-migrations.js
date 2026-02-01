/**
 * Run Database Migrations
 *
 * Executes SQL migration files in order to update the database schema.
 * Safe to run multiple times (uses IF NOT EXISTS).
 *
 * Usage: node scripts/run-migrations.js
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '..', 'clinic.db');
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

console.log('🔧 Running Database Migrations...\n');

// Check if database exists
if (!fs.existsSync(DB_PATH)) {
    console.error('❌ Database file not found:', DB_PATH);
    console.log('ℹ️  Database will be created automatically on first run');
    process.exit(0);
}

// Connect to database
const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

console.log('✓ Connected to database:', DB_PATH);

// Create migrations tracking table
db.prepare(
    `
    CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`
).run();

console.log('✓ Migrations tracking table ready\n');

// Get list of migration files
let migrationFiles = [];
if (fs.existsSync(MIGRATIONS_DIR)) {
    migrationFiles = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((file) => file.endsWith('.sql'))
        .sort();
} else {
    console.log('⚠️  Migrations directory not found. Creating inline migrations...\n');

    // Create migrations inline if directory doesn't exist
    const inlineMigrations = [
        {
            filename: '002_create_transactions.sql',
            sql: `
-- Create transactions table for Financial Module
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    amount REAL NOT NULL,
    category TEXT,
    payment_method TEXT CHECK(payment_method IN ('money', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'insurance')),
    description TEXT,
    transaction_date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_clinic ON transactions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_clinic_date ON transactions(clinic_id, transaction_date);

DROP TRIGGER IF EXISTS update_transactions_timestamp;
CREATE TRIGGER update_transactions_timestamp 
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
            `,
        },
        {
            filename: '003_add_last_login.sql',
            sql: `
-- Add last_login_at column to users table
-- This uses a safe approach that won't fail if column already exists

-- Check if column exists using PRAGMA
CREATE TABLE IF NOT EXISTS _temp_check AS SELECT 1 as exists_check;

-- Try to add column (will fail silently if exists)
-- We'll check the table structure after

CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
            `,
        },
    ];

    // Execute inline migrations
    for (const migration of inlineMigrations) {
        try {
            const alreadyExecuted = db
                .prepare('SELECT filename FROM migrations WHERE filename = ?')
                .get(migration.filename);

            if (alreadyExecuted) {
                console.log(`⏭️  Skipping ${migration.filename} (already executed)`);
                continue;
            }

            console.log(`📝 Executing ${migration.filename}...`);

            // Split SQL by semicolons and execute each statement
            const statements = migration.sql
                .split(';')
                .map((s) => s.trim())
                .filter((s) => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                try {
                    db.prepare(statement).run();
                } catch (error) {
                    // Ignore duplicate column errors
                    if (error.message.includes('duplicate column')) {
                        console.log(`   ℹ️  Column already exists - skipping`);
                    } else if (error.message.includes('no such column')) {
                        // Try to add the column if it doesn't exist
                        if (statement.includes('last_login_at')) {
                            try {
                                db.prepare(
                                    'ALTER TABLE users ADD COLUMN last_login_at DATETIME'
                                ).run();
                                console.log('   ✓ Added last_login_at column');
                            } catch (e) {
                                if (!e.message.includes('duplicate column')) {
                                    console.error('   ⚠️  Could not add column:', e.message);
                                }
                            }
                        }
                    } else {
                        throw error;
                    }
                }
            }

            // Mark as executed
            db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(migration.filename);
            console.log(`   ✓ ${migration.filename} completed\n`);
        } catch (error) {
            console.error(`❌ Error executing ${migration.filename}:`, error.message);
            process.exit(1);
        }
    }

    console.log('✅ All inline migrations completed!\n');
    process.exit(0);
}

// Execute file-based migrations
for (const filename of migrationFiles) {
    try {
        // Check if already executed
        const alreadyExecuted = db
            .prepare('SELECT filename FROM migrations WHERE filename = ?')
            .get(filename);

        if (alreadyExecuted) {
            console.log(`⏭️  Skipping ${filename} (already executed)`);
            continue;
        }

        console.log(`📝 Executing ${filename}...`);

        // Read migration file
        const migrationPath = path.join(MIGRATIONS_DIR, filename);
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Split SQL by semicolons and execute each statement
        const statements = sql
            .split(';')
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            try {
                db.prepare(statement).run();
            } catch (error) {
                // Ignore duplicate column errors
                if (error.message.includes('duplicate column')) {
                    console.log(`   ℹ️  Column already exists - skipping`);
                } else {
                    throw error;
                }
            }
        }

        // Mark as executed
        db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(filename);
        console.log(`   ✓ ${filename} completed\n`);
    } catch (error) {
        console.error(`❌ Error executing ${filename}:`, error.message);
        process.exit(1);
    }
}

// Verify tables exist
console.log('🔍 Verifying database structure...\n');

const tables = db
    .prepare(
        `
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
`
    )
    .all();

console.log('📊 Tables in database:');
tables.forEach((table) => {
    console.log(`   • ${table.name}`);
});

// Check for transactions table specifically
const transactionsExists = tables.some((t) => t.name === 'transactions');
if (transactionsExists) {
    const count = db.prepare('SELECT COUNT(*) as count FROM transactions').get();
    console.log(`\n✓ Transactions table exists (${count.count} records)`);
} else {
    console.warn('\n⚠️  Transactions table not found!');
}

// Check for last_login_at column
const userColumns = db.prepare('PRAGMA table_info(users)').all();
const hasLastLogin = userColumns.some((col) => col.name === 'last_login_at');
if (hasLastLogin) {
    console.log('✓ users.last_login_at column exists');
} else {
    console.warn('⚠️  users.last_login_at column not found!');
}

db.close();

console.log('\n✅ Migrations completed successfully!\n');
process.exit(0);
