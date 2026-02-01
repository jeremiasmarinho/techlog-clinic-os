import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script de Migração para SaaS Multi-Tenancy
 *
 * Executa a migração SQL que transforma o sistema em multi-tenant
 */

const DB_ENV = process.env.NODE_ENV || 'development';
const DB_FILES = {
    test: 'database.test.sqlite',
    production: 'database.prod.sqlite',
    development: 'database.dev.sqlite',
};

const DB_PATH = path.resolve(
    __dirname,
    '../',
    DB_FILES[DB_ENV as keyof typeof DB_FILES] || DB_FILES.development
);
const MIGRATION_PATH = path.resolve(__dirname, '../migrations/001_saas_multi_tenancy.sql');

console.log('========================================');
console.log('🚀 SaaS Multi-Tenancy Migration');
console.log('========================================');
console.log(`📊 Environment: ${DB_ENV}`);
console.log(`📁 Database: ${DB_PATH}`);
console.log(`📄 Migration: ${MIGRATION_PATH}`);
console.log('========================================\n');

async function runMigration(): Promise<void> {
    return new Promise((resolve, reject) => {
        // Verificar se arquivo de migração existe
        if (!fs.existsSync(MIGRATION_PATH)) {
            reject(new Error(`❌ Migration file not found: ${MIGRATION_PATH}`));
            return;
        }

        // Ler SQL da migração
        const migrationSQL = fs.readFileSync(MIGRATION_PATH, 'utf8');

        // Conectar ao banco
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                reject(new Error(`❌ Database connection failed: ${err.message}`));
                return;
            }

            console.log('✅ Connected to database\n');

            // Executar migração em uma transação
            db.serialize(() => {
                db.run('BEGIN TRANSACTION', (err) => {
                    if (err) {
                        reject(new Error(`❌ Failed to start transaction: ${err.message}`));
                        return;
                    }

                    console.log('📦 Starting migration transaction...\n');

                    // Execute SQL file directly (not split by ;)
                    db.exec(migrationSQL, (err) => {
                        if (
                            err &&
                            !err.message.includes('duplicate column name') &&
                            !err.message.includes('already exists')
                        ) {
                            db.run('ROLLBACK', () => {
                                reject(new Error(`❌ Migration failed: ${err.message}`));
                            });
                            return;
                        }

                        // Commit transaction
                        db.run('COMMIT', (err) => {
                            if (err) {
                                reject(
                                    new Error(`❌ Failed to commit transaction: ${err.message}`)
                                );
                                return;
                            }

                            console.log('✅ Migration completed successfully!\n');

                            // Verificar resultados
                            verifyMigration(db)
                                .then(() => {
                                    db.close();
                                    resolve();
                                })
                                .catch(reject);
                        });
                    });
                });
            });
        });
    });
}

async function verifyMigration(db: sqlite3.Database): Promise<void> {
    return new Promise((resolve) => {
        console.log('========================================');
        console.log('🔍 Verifying Migration Results');
        console.log('========================================\n');

        const queries = [
            { name: 'Clinics', query: 'SELECT COUNT(*) as count FROM clinics' },
            {
                name: 'Users with clinic_id',
                query: 'SELECT COUNT(*) as count FROM users WHERE clinic_id IS NOT NULL',
            },
            {
                name: 'Leads with clinic_id',
                query: 'SELECT COUNT(*) as count FROM leads WHERE clinic_id IS NOT NULL',
            },
            { name: 'Patients', query: 'SELECT COUNT(*) as count FROM patients' },
            { name: 'Appointments', query: 'SELECT COUNT(*) as count FROM appointments' },
            { name: 'Kanban Columns', query: 'SELECT COUNT(*) as count FROM kanban_columns' },
        ];

        let completed = 0;

        queries.forEach(({ name, query }) => {
            db.get(query, [], (err, row: any) => {
                if (err) {
                    console.log(`❌ ${name}: Error - ${err.message}`);
                } else {
                    console.log(`✅ ${name}: ${row.count}`);
                }

                completed++;
                if (completed === queries.length) {
                    console.log('\n========================================');
                    console.log('✅ Migration verification complete!');
                    console.log('========================================\n');
                    resolve();
                }
            });
        });
    });
}

// Execute migration
runMigration()
    .then(() => {
        console.log('🎉 Migration completed successfully!\n');
        console.log('Next steps:');
        console.log('  1. Run: npm run seed:multi-tenant');
        console.log('  2. Restart server: npm run dev\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    });
