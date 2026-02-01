import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Seed Script para SaaS Multi-Tenant
 *
 * Cria duas clínicas diferentes com dados fictícios para testar isolamento
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

console.log('========================================');
console.log('🌱 SaaS Multi-Tenant Seed');
console.log('========================================');
console.log(`📊 Environment: ${DB_ENV}`);
console.log(`📁 Database: ${DB_PATH}`);
console.log('========================================\n');

async function seedDatabase(): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, async (err) => {
            if (err) {
                reject(new Error(`❌ Database connection failed: ${err.message}`));
                return;
            }

            console.log('✅ Connected to database\n');

            try {
                // Hash passwords
                const adminPasswordA = await bcrypt.hash('clinica-a-2026', 10);
                const adminPasswordB = await bcrypt.hash('clinica-b-2026', 10);
                const staffPassword = await bcrypt.hash('staff123', 10);

                db.serialize(() => {
                    db.run('BEGIN TRANSACTION');

                    // ============================================
                    // CLINIC A - Clínica Viva (Premium)
                    // ============================================
                    console.log('📍 Creating Clinic A (Clínica Viva)...');

                    db.run(
                        `INSERT OR REPLACE INTO clinics (id, name, slug, plan_tier, status, max_users, max_patients, subscription_started_at)
                         VALUES (2, 'Clínica Viva', 'clinica-viva', 'enterprise', 'active', 20, 10000, CURRENT_TIMESTAMP)`,
                        function (err) {
                            if (err) {
                                db.run('ROLLBACK');
                                reject(err);
                                return;
                            }

                            const clinicAId = 2;
                            console.log(`  ✅ Clinic A created (ID: ${clinicAId})`);

                            // Users for Clinic A
                            db.run(
                                `INSERT OR REPLACE INTO users (id, name, username, password, clinic_id, role, is_owner)
                                 VALUES (2, 'Dr. Carlos Silva', 'carlos@clinicaviva.com', ?, ?, 'admin', 1)`,
                                [adminPasswordA, clinicAId],
                                function (err) {
                                    if (err) {
                                        db.run('ROLLBACK');
                                        reject(err);
                                        return;
                                    }

                                    const ownerAId = 2;
                                    console.log(`  ✅ Admin user created for Clinic A`);

                                    // Update clinic owner_id
                                    db.run('UPDATE clinics SET owner_id = ? WHERE id = ?', [
                                        ownerAId,
                                        clinicAId,
                                    ]);

                                    // Staff users for Clinic A
                                    db.run(
                                        `INSERT OR REPLACE INTO users (id, name, username, password, clinic_id, role, is_owner)
                                         VALUES (3, 'Maria Santos (Receção)', 'maria@clinicaviva.com', ?, ?, 'recepcao', 0)`,
                                        [staffPassword, clinicAId]
                                    );

                                    db.run(
                                        `INSERT OR REPLACE INTO users (id, name, username, password, clinic_id, role, is_owner)
                                         VALUES (4, 'João Oliveira (Assistente)', 'joao@clinicaviva.com', ?, ?, 'recepcao', 0)`,
                                        [staffPassword, clinicAId]
                                    );

                                    console.log(`  ✅ Staff users created for Clinic A\n`);

                                    // Kanban columns for Clinic A
                                    db.run(
                                        `INSERT OR REPLACE INTO kanban_columns (clinic_id, name, slug, position, color, is_default) VALUES
                                         (?, 'Novo Lead', 'novo', 1, '#3B82F6', 1),
                                         (?, 'Em Avaliação', 'em_avaliacao', 2, '#F59E0B', 1),
                                         (?, 'Agendado', 'agendado', 3, '#10B981', 1),
                                         (?, 'Finalizado', 'finalizado', 4, '#6B7280', 1)`,
                                        [clinicAId, clinicAId, clinicAId, clinicAId]
                                    );

                                    console.log(`  ✅ Kanban columns created for Clinic A\n`);

                                    // Sample Leads for Clinic A
                                    db.run(
                                        `INSERT INTO leads (clinic_id, name, phone, type, status, created_at) VALUES
                                         (?, 'Ana Paula Costa', '(11) 98765-4321', 'primeira_consulta', 'novo', CURRENT_TIMESTAMP),
                                         (?, 'Roberto Fernandes', '(11) 97654-3210', 'retorno', 'em_avaliacao', CURRENT_TIMESTAMP),
                                         (?, 'Juliana Martins', '(11) 96543-2109', 'urgencia', 'agendado', CURRENT_TIMESTAMP),
                                         (?, 'Fernando Silva', '(11) 95432-1098', 'rotina', 'finalizado', datetime('now', '-2 hours'))`,
                                        [clinicAId, clinicAId, clinicAId, clinicAId]
                                    );

                                    console.log(`  ✅ Sample leads created for Clinic A\n`);

                                    // Sample Patients for Clinic A
                                    db.run(
                                        `INSERT INTO patients (clinic_id, name, email, phone, cpf, status, created_at) VALUES
                                         (?, 'Ana Paula Costa', 'ana@email.com', '(11) 98765-4321', '111.222.333-44', 'active', CURRENT_TIMESTAMP),
                                         (?, 'Roberto Fernandes', 'roberto@email.com', '(11) 97654-3210', '222.333.444-55', 'active', CURRENT_TIMESTAMP),
                                         (?, 'Juliana Martins', 'juliana@email.com', '(11) 96543-2109', '333.444.555-66', 'active', CURRENT_TIMESTAMP)`,
                                        [clinicAId, clinicAId, clinicAId]
                                    );

                                    console.log(`  ✅ Sample patients created for Clinic A\n`);
                                }
                            );
                        }
                    );

                    // ============================================
                    // CLINIC B - Saúde Total (Basic)
                    // ============================================
                    console.log('📍 Creating Clinic B (Saúde Total)...');

                    db.run(
                        `INSERT OR REPLACE INTO clinics (id, name, slug, plan_tier, status, max_users, max_patients, subscription_started_at)
                         VALUES (3, 'Saúde Total', 'saude-total', 'basic', 'active', 5, 1000, CURRENT_TIMESTAMP)`,
                        function (err) {
                            if (err) {
                                db.run('ROLLBACK');
                                reject(err);
                                return;
                            }

                            const clinicBId = 3;
                            console.log(`  ✅ Clinic B created (ID: ${clinicBId})`);

                            // Users for Clinic B
                            db.run(
                                `INSERT OR REPLACE INTO users (id, name, username, password, clinic_id, role, is_owner)
                                 VALUES (5, 'Dra. Patricia Alves', 'patricia@saudetotal.com', ?, ?, 'admin', 1)`,
                                [adminPasswordB, clinicBId],
                                function (err) {
                                    if (err) {
                                        db.run('ROLLBACK');
                                        reject(err);
                                        return;
                                    }

                                    const ownerBId = 5;
                                    console.log(`  ✅ Admin user created for Clinic B`);

                                    // Update clinic owner_id
                                    db.run('UPDATE clinics SET owner_id = ? WHERE id = ?', [
                                        ownerBId,
                                        clinicBId,
                                    ]);

                                    // Staff users for Clinic B
                                    db.run(
                                        `INSERT OR REPLACE INTO users (id, name, username, password, clinic_id, role, is_owner)
                                         VALUES (6, 'Pedro Costa (Atendente)', 'pedro@saudetotal.com', ?, ?, 'recepcao', 0)`,
                                        [staffPassword, clinicBId]
                                    );

                                    console.log(`  ✅ Staff users created for Clinic B\n`);

                                    // Kanban columns for Clinic B
                                    db.run(
                                        `INSERT OR REPLACE INTO kanban_columns (clinic_id, name, slug, position, color, is_default) VALUES
                                         (?, 'Aguardando', 'aguardando', 1, '#EF4444', 1),
                                         (?, 'Em Consulta', 'em_consulta', 2, '#8B5CF6', 1),
                                         (?, 'Confirmado', 'confirmado', 3, '#06B6D4', 1),
                                         (?, 'Concluído', 'concluido', 4, '#22C55E', 1)`,
                                        [clinicBId, clinicBId, clinicBId, clinicBId]
                                    );

                                    console.log(`  ✅ Kanban columns created for Clinic B\n`);

                                    // Sample Leads for Clinic B
                                    db.run(
                                        `INSERT INTO leads (clinic_id, name, phone, type, status, created_at) VALUES
                                         (?, 'Marcos Pereira', '(21) 91234-5678', 'checkup', 'aguardando', CURRENT_TIMESTAMP),
                                         (?, 'Carla Souza', '(21) 92345-6789', 'emergencia', 'em_consulta', CURRENT_TIMESTAMP),
                                         (?, 'Lucas Mendes', '(21) 93456-7890', 'rotina', 'confirmado', CURRENT_TIMESTAMP),
                                         (?, 'Beatriz Lima', '(21) 94567-8901', 'exame', 'concluido', datetime('now', '-3 hours'))`,
                                        [clinicBId, clinicBId, clinicBId, clinicBId]
                                    );

                                    console.log(`  ✅ Sample leads created for Clinic B\n`);

                                    // Sample Patients for Clinic B
                                    db.run(
                                        `INSERT INTO patients (clinic_id, name, email, phone, cpf, status, created_at) VALUES
                                         (?, 'Marcos Pereira', 'marcos@email.com', '(21) 91234-5678', '444.555.666-77', 'active', CURRENT_TIMESTAMP),
                                         (?, 'Carla Souza', 'carla@email.com', '(21) 92345-6789', '555.666.777-88', 'active', CURRENT_TIMESTAMP),
                                         (?, 'Lucas Mendes', 'lucas@email.com', '(21) 93456-7890', '666.777.888-99', 'active', CURRENT_TIMESTAMP)`,
                                        [clinicBId, clinicBId, clinicBId],
                                        (err) => {
                                            if (err) {
                                                db.run('ROLLBACK');
                                                reject(err);
                                                return;
                                            }

                                            console.log(
                                                `  ✅ Sample patients created for Clinic B\n`
                                            );

                                            // Commit transaction
                                            db.run('COMMIT', (err) => {
                                                if (err) {
                                                    reject(err);
                                                    return;
                                                }

                                                printSummary(db)
                                                    .then(() => {
                                                        db.close();
                                                        resolve();
                                                    })
                                                    .catch(reject);
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    );
                });
            } catch (error) {
                reject(error);
            }
        });
    });
}

async function printSummary(db: sqlite3.Database): Promise<void> {
    return new Promise((resolve) => {
        console.log('========================================');
        console.log('📊 Database Summary');
        console.log('========================================\n');

        db.all(
            'SELECT id, name, slug, plan_tier, status FROM clinics WHERE id > 1',
            [],
            (err, clinics: any[]) => {
                if (err) {
                    console.error('❌ Error fetching clinics:', err.message);
                    resolve();
                    return;
                }

                clinics.forEach((clinic) => {
                    console.log(`🏥 ${clinic.name} (${clinic.slug})`);
                    console.log(`   Plan: ${clinic.plan_tier} | Status: ${clinic.status}`);

                    // Count users
                    db.get(
                        'SELECT COUNT(*) as count FROM users WHERE clinic_id = ?',
                        [clinic.id],
                        (err, userCount: any) => {
                            if (!err) console.log(`   👥 Users: ${userCount.count}`);
                        }
                    );

                    // Count leads
                    db.get(
                        'SELECT COUNT(*) as count FROM leads WHERE clinic_id = ?',
                        [clinic.id],
                        (err, leadCount: any) => {
                            if (!err) console.log(`   📋 Leads: ${leadCount.count}`);
                        }
                    );

                    // Count patients
                    db.get(
                        'SELECT COUNT(*) as count FROM patients WHERE clinic_id = ?',
                        [clinic.id],
                        (err, patientCount: any) => {
                            if (!err) console.log(`   🏥 Patients: ${patientCount.count}`);
                        }
                    );

                    // Count kanban columns
                    db.get(
                        'SELECT COUNT(*) as count FROM kanban_columns WHERE clinic_id = ?',
                        [clinic.id],
                        (err, columnCount: any) => {
                            if (!err) {
                                console.log(`   📊 Kanban Columns: ${columnCount.count}\n`);
                            }
                        }
                    );
                });

                setTimeout(() => {
                    console.log('========================================');
                    console.log('🔐 Login Credentials');
                    console.log('========================================\n');
                    console.log('Clinic A (Clínica Viva):');
                    console.log('  👤 Username: carlos@clinicaviva.com');
                    console.log('  🔑 Password: clinica-a-2026\n');
                    console.log('Clinic B (Saúde Total):');
                    console.log('  👤 Username: patricia@saudetotal.com');
                    console.log('  🔑 Password: clinica-b-2026\n');
                    console.log('Staff (both clinics):');
                    console.log('  🔑 Password: staff123\n');
                    console.log('========================================\n');
                    resolve();
                }, 500);
            }
        );
    });
}

// Execute seed
seedDatabase()
    .then(() => {
        console.log('🎉 Seed completed successfully!\n');
        console.log('Next steps:');
        console.log('  1. Restart server: npm run dev');
        console.log('  2. Test isolation by logging in as different clinics\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Seed failed:', error.message);
        process.exit(1);
    });
