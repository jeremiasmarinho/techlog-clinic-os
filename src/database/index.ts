import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Determina qual banco de dados usar baseado no NODE_ENV
 * - test: database.test.sqlite (testes automatizados)
 * - production: database.prod.sqlite (produção)
 * - development (default): database.dev.sqlite (desenvolvimento)
 */
function getDatabasePath(): string {
    const nodeEnv = process.env.NODE_ENV || 'development';

    let dbFileName: string;
    let envLabel: string;

    switch (nodeEnv) {
        case 'test':
            dbFileName = 'database.test.sqlite';
            envLabel = '🧪 TEST';
            break;
        case 'production':
            dbFileName = 'database.prod.sqlite';
            envLabel = '🏥 PRODUCTION';
            break;
        case 'development':
        default:
            dbFileName = 'database.dev.sqlite';
            envLabel = '💻 DEVELOPMENT';
            break;
    }

    const dbPath = path.resolve(__dirname, '../../', dbFileName);
    console.log(`📊 Database environment: ${envLabel}`);
    console.log(`📁 Database path: ${dbPath}`);

    return dbPath;
}

const DB_PATH = getDatabasePath();

// Inicializar conexão com o banco de dados
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir banco de dados:', err.message);
        process.exit(1);
    } else {
        console.log(`✅ Conectado ao banco SQLite com sucesso!`);
        initDb();
    }
});

// Função para criar tabelas
function initDb(): void {
    // Tabela de Clínicas (Multi-Tenant)
    db.run(
        `
        CREATE TABLE IF NOT EXISTS clinics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            owner_id INTEGER,
            plan_tier TEXT DEFAULT 'basic' CHECK(plan_tier IN ('basic', 'professional', 'enterprise')),
            status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'trial', 'cancelled')),
            max_users INTEGER DEFAULT 5,
            max_patients INTEGER DEFAULT 1000,
            trial_ends_at DATETIME,
            subscription_started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            subscription_ends_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,
        (err) => {
            if (err) {
                console.error('❌ Erro ao criar tabela clinics:', err.message);
            } else {
                console.log('✅ Tabela "clinics" pronta');
                db.run('CREATE INDEX IF NOT EXISTS idx_clinics_slug ON clinics(slug)');
                db.run('CREATE INDEX IF NOT EXISTS idx_clinics_owner ON clinics(owner_id)');
                db.run('CREATE INDEX IF NOT EXISTS idx_clinics_status ON clinics(status)');

                db.run(
                    `INSERT OR IGNORE INTO clinics (id, name, slug, plan_tier, status, max_users, max_patients)
                     VALUES (1, 'Clínica Padrão', 'clinica-padrao', 'enterprise', 'active', 999, 999999)`
                );
            }
        }
    );

    // Tabela de Leads com schema completo
    db.run(
        `
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            type TEXT DEFAULT 'geral',
            status TEXT DEFAULT 'novo',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            clinic_id INTEGER NOT NULL DEFAULT 1,
            appointment_date DATETIME,
            doctor TEXT,
            notes TEXT,
            attendance_status TEXT,
            archive_reason TEXT,
            source TEXT DEFAULT 'Manual',
            value REAL DEFAULT 0,
            updated_at DATETIME,
            status_updated_at DATETIME
        )
    `,
        (err) => {
            if (err) {
                console.error('❌ Erro ao criar tabela leads:', err.message);
            } else {
                console.log('✅ Tabela "leads" pronta com schema completo');

                // Adicionar colunas se não existirem (backward compatibility)
                addColumnIfNotExists('appointment_date', 'DATETIME');
                addColumnIfNotExists('doctor', 'TEXT');
                addColumnIfNotExists('notes', 'TEXT');
                addColumnIfNotExists('attendance_status', 'TEXT');
                addColumnIfNotExists('archive_reason', 'TEXT');
                addColumnIfNotExists('source', "TEXT DEFAULT 'Manual'");
                addColumnIfNotExists('value', 'REAL DEFAULT 0');
                addColumnIfNotExists('updated_at', 'DATETIME');
                addColumnIfNotExists('status_updated_at', 'DATETIME');
                addColumnIfNotExists('clinic_id', 'INTEGER NOT NULL DEFAULT 1');

                db.run('CREATE INDEX IF NOT EXISTS idx_leads_clinic ON leads(clinic_id)');
                db.run(
                    'CREATE INDEX IF NOT EXISTS idx_leads_status_clinic ON leads(status, clinic_id)'
                );

                // Create triggers for auto-update timestamp
                createUpdateTrigger();
                createStatusUpdateTrigger();
            }
        }
    );

    // Tabela de Usuários (Team Management)
    db.run(
        `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'recepcao',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,
        (err) => {
            if (err) {
                console.error('❌ Erro ao criar tabela users:', err.message);
            } else {
                console.log('✅ Tabela "users" pronta');

                ensureUserClinicColumns();

                // Seed: Inserir usuário admin padrão com senha hasheada
                db.get("SELECT * FROM users WHERE username = 'admin'", [], async (_err, row) => {
                    if (!row) {
                        // Tabela de solicitações de upgrade de plano
                        db.run(
                            `
        CREATE TABLE IF NOT EXISTS upgrade_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clinic_id INTEGER NOT NULL,
            current_plan TEXT,
            requested_plan TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,
                            (err) => {
                                if (err) {
                                    console.error(
                                        '❌ Erro ao criar tabela upgrade_requests:',
                                        err.message
                                    );
                                } else {
                                    console.log('✅ Tabela "upgrade_requests" pronta');
                                    db.run(
                                        'CREATE INDEX IF NOT EXISTS idx_upgrade_requests_clinic ON upgrade_requests (clinic_id)'
                                    );
                                    db.run(
                                        'CREATE INDEX IF NOT EXISTS idx_upgrade_requests_status ON upgrade_requests (status)'
                                    );
                                }
                            }
                        );

                        // Tabela de auditoria
                        db.run(
                            `
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clinic_id INTEGER,
            user_id INTEGER,
            user_role TEXT,
            action TEXT NOT NULL,
            path TEXT NOT NULL,
            method TEXT NOT NULL,
            status_code INTEGER,
            ip_address TEXT,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,
                            (err) => {
                                if (err) {
                                    console.error(
                                        '❌ Erro ao criar tabela audit_logs:',
                                        err.message
                                    );
                                } else {
                                    console.log('✅ Tabela "audit_logs" pronta');
                                    db.run(
                                        'CREATE INDEX IF NOT EXISTS idx_audit_logs_clinic ON audit_logs (clinic_id)'
                                    );
                                    db.run(
                                        'CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id)'
                                    );
                                    db.run(
                                        'CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at)'
                                    );
                                }
                            }
                        );
                        const hashedPassword = await bcrypt.hash('123', 10);
                        db.run(
                            'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
                            ['Administrador', 'admin', hashedPassword, 'admin'],
                            (err) => {
                                if (err) {
                                    console.error('❌ Erro ao criar usuário admin:', err.message);
                                } else {
                                    console.log(
                                        '✅ Usuário admin criado (username: admin, password: 123)'
                                    );
                                }
                            }
                        );
                    } else {
                        console.log('✅ Usuário admin já existe');
                    }
                });
            }
        }
    );

    // Tabela de Configurações da Clínica
    db.run(
        `
        CREATE TABLE IF NOT EXISTS clinic_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clinic_id INTEGER DEFAULT 1,
            identity TEXT,
            hours TEXT,
            insurance_plans TEXT,
            chatbot TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,
        (err) => {
            if (err) {
                console.error('❌ Erro ao criar tabela clinic_settings:', err.message);
            } else {
                console.log('✅ Tabela "clinic_settings" pronta');
            }
        }
    );

    // Tabela de Transações Financeiras
    db.run(
        `
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clinic_id INTEGER NOT NULL DEFAULT 1,
            patient_id INTEGER,
            appointment_id INTEGER,
            type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
            amount DECIMAL(10, 2) NOT NULL,
            category TEXT NOT NULL,
            payment_method TEXT NOT NULL CHECK(payment_method IN ('pix', 'credit', 'debit', 'cash')),
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'cancelled')),
            due_date DATETIME,
            paid_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,
        (err) => {
            if (err) {
                console.error('❌ Erro ao criar tabela transactions:', err.message);
            } else {
                console.log('✅ Tabela "transactions" pronta');
                db.run(
                    'CREATE INDEX IF NOT EXISTS idx_transactions_clinic ON transactions(clinic_id)'
                );
                db.run('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)');
                db.run(
                    'CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)'
                );
                db.run(
                    'CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date)'
                );
                db.run(
                    'CREATE INDEX IF NOT EXISTS idx_transactions_paid_at ON transactions(paid_at)'
                );
                db.run(
                    'CREATE INDEX IF NOT EXISTS idx_transactions_patient ON transactions(patient_id)'
                );
                db.run(
                    'CREATE INDEX IF NOT EXISTS idx_transactions_appointment ON transactions(appointment_id)'
                );

                // Create trigger for auto-update timestamp
                db.run(`
                    CREATE TRIGGER IF NOT EXISTS update_transactions_timestamp
                    AFTER UPDATE ON transactions
                    BEGIN
                        UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                    END
                `);
            }
        }
    );

    ensurePatientStatusSchema();
    ensureUserClinicColumns();
    ensureUserDocumentColumns();
    ensureClinicDocumentColumns();
}

function ensurePatientStatusSchema(): void {
    db.get(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='patients'",
        [],
        (err, row: { sql?: string }) => {
            if (err) {
                console.warn('⚠️ Não foi possível verificar schema de patients:', err.message);
                return;
            }

            if (!row?.sql) return;

            const sql = row.sql.toLowerCase();
            const hasNewStatuses =
                sql.includes('waiting') &&
                sql.includes('triage') &&
                sql.includes('consultation') &&
                sql.includes('finished');

            if (hasNewStatuses) return;

            console.log('🔁 Atualizando schema de status da tabela patients...');

            db.serialize(() => {
                db.run('ALTER TABLE patients RENAME TO patients_old');
                db.run(
                    `
                    CREATE TABLE patients (
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
                    )
                `
                );

                db.run(
                    `
                    INSERT INTO patients (
                        id, clinic_id, name, email, phone, cpf, birth_date, gender, address,
                        city, state, zip_code, notes, status, end_time, created_at, updated_at
                    )
                    SELECT 
                        id, clinic_id, name, email, phone, cpf, birth_date, gender, address,
                        city, state, zip_code, notes,
                        CASE 
                            WHEN status IN ('waiting', 'triage', 'consultation', 'finished') THEN status
                            ELSE 'waiting'
                        END as status,
                        NULL as end_time,
                        created_at, updated_at
                    FROM patients_old
                `
                );

                db.run('DROP TABLE patients_old');

                db.run('CREATE INDEX IF NOT EXISTS idx_patients_clinic ON patients(clinic_id)');
                db.run(
                    'CREATE INDEX IF NOT EXISTS idx_patients_status_clinic ON patients(status, clinic_id)'
                );
                db.run('CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name)');
                db.run('CREATE INDEX IF NOT EXISTS idx_patients_cpf ON patients(cpf)');

                db.run(`DROP TRIGGER IF EXISTS update_patients_timestamp`);
                db.run(
                    `
                    CREATE TRIGGER IF NOT EXISTS update_patients_timestamp
                    AFTER UPDATE ON patients
                    BEGIN
                        UPDATE patients SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
                    END;
                `
                );
            });
        }
    );
}

// COMMENTED OUT - Function declared but never used (TS6133)
// If needed in the future, uncomment and call from initDb()
// function ensurePatientEndTimeColumn(): void {
//     db.all('PRAGMA table_info(patients)', [], (err, rows: Array<{ name: string }>) => {
//         if (err) {
//             console.warn('⚠️ Não foi possível verificar colunas de patients:', err.message);
//             return;
//         }

//         const hasEndTime = rows?.some((row) => row.name === 'end_time');
//         if (hasEndTime) return;

//         db.run('ALTER TABLE patients ADD COLUMN end_time DATETIME', (alterErr) => {
//             if (alterErr) {
//                 console.warn('⚠️ Falha ao adicionar end_time em patients:', alterErr.message);
//             } else {
//                 console.log('✅ Coluna end_time adicionada em patients');
//             }
//         });
//     });
// }

function ensureUserDocumentColumns(): void {
    db.all('PRAGMA table_info(users)', [], (err, rows: Array<{ name: string }>) => {
        if (err) {
            console.warn('⚠️ Não foi possível verificar colunas de users:', err.message);
            return;
        }

        const columns = rows?.map((row) => row.name) || [];

        if (!columns.includes('crm')) {
            db.run('ALTER TABLE users ADD COLUMN crm TEXT');
        }
        if (!columns.includes('crm_state')) {
            db.run('ALTER TABLE users ADD COLUMN crm_state TEXT');
        }
        if (!columns.includes('signature_url')) {
            db.run('ALTER TABLE users ADD COLUMN signature_url TEXT');
        }
    });
}

function ensureUserClinicColumns(): void {
    db.all('PRAGMA table_info(users)', [], (err, rows: Array<{ name: string }>) => {
        if (err) {
            console.warn('⚠️ Não foi possível verificar colunas de users:', err.message);
            return;
        }

        const columns = rows?.map((row) => row.name) || [];

        if (!columns.includes('clinic_id')) {
            db.run('ALTER TABLE users ADD COLUMN clinic_id INTEGER');
        }
        if (!columns.includes('is_owner')) {
            db.run('ALTER TABLE users ADD COLUMN is_owner INTEGER DEFAULT 0');
        }
        if (!columns.includes('updated_at')) {
            db.run('ALTER TABLE users ADD COLUMN updated_at DATETIME');
        }
        if (!columns.includes('last_login_at')) {
            db.run('ALTER TABLE users ADD COLUMN last_login_at DATETIME', (loginErr) => {
                if (loginErr) {
                    console.warn('⚠️ Falha ao adicionar last_login_at em users:', loginErr.message);
                } else {
                    console.log('✅ Coluna last_login_at adicionada em users');
                }
            });
        }

        db.run('CREATE INDEX IF NOT EXISTS idx_users_clinic ON users(clinic_id)');
        db.run('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
        db.run('CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at)');
    });
}

function ensureClinicDocumentColumns(): void {
    db.all('PRAGMA table_info(clinics)', [], (err, rows: Array<{ name: string }>) => {
        if (err) {
            console.warn('⚠️ Não foi possível verificar colunas de clinics:', err.message);
            return;
        }

        const columns = rows?.map((row) => row.name) || [];

        if (!columns.includes('logo_url')) {
            db.run('ALTER TABLE clinics ADD COLUMN logo_url TEXT');
        }
        if (!columns.includes('primary_color')) {
            db.run('ALTER TABLE clinics ADD COLUMN primary_color TEXT');
        }
        if (!columns.includes('address_full')) {
            db.run('ALTER TABLE clinics ADD COLUMN address_full TEXT');
        }
    });
}

// Função auxiliar para adicionar coluna com segurança
function addColumnIfNotExists(columnName: string, columnType: string): void {
    db.all('PRAGMA table_info(leads)', [], (err, rows: Array<{ name: string }>) => {
        if (err) {
            console.warn('⚠️ Não foi possível verificar colunas de leads:', err.message);
            return;
        }

        const columns = rows?.map((row) => row.name) || [];
        if (columns.includes(columnName)) return;

        db.run(`ALTER TABLE leads ADD COLUMN ${columnName} ${columnType}`, (alterErr) => {
            if (alterErr) {
                console.warn(`⚠️ Aviso ao adicionar coluna ${columnName}:`, alterErr.message);
            } else {
                console.log(`✅ Coluna "${columnName}" adicionada`);
            }
        });
    });
}

// Função para criar trigger de auto-update timestamp
function createUpdateTrigger(): void {
    db.run(`DROP TRIGGER IF EXISTS update_leads_timestamp`, (err) => {
        if (err && !err.message.includes('no such trigger')) {
            console.warn('⚠️ Aviso ao remover trigger:', err.message);
        }

        db.run(
            `
            CREATE TRIGGER IF NOT EXISTS update_leads_timestamp 
            AFTER UPDATE ON leads
            BEGIN
                UPDATE leads SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END;
        `,
            (err) => {
                if (err) {
                    console.warn('⚠️ Aviso ao criar trigger:', err.message);
                } else {
                    console.log('✅ Trigger de timestamp configurado');
                }
            }
        );
    });
}

// Trigger para atualizar status_updated_at quando status mudar
function createStatusUpdateTrigger(): void {
    db.run(`DROP TRIGGER IF EXISTS update_status_timestamp`, (err) => {
        if (err && !err.message.includes('no such trigger')) {
            console.warn('⚠️ Aviso ao remover trigger de status:', err.message);
        }

        db.run(
            `
            CREATE TRIGGER IF NOT EXISTS update_status_timestamp
            AFTER UPDATE OF status ON leads
            FOR EACH ROW
            WHEN NEW.status != OLD.status
            BEGIN
                UPDATE leads 
                SET status_updated_at = CURRENT_TIMESTAMP 
                WHERE id = NEW.id;
            END;
        `,
            (err) => {
                if (err) {
                    console.warn('⚠️ Aviso ao criar trigger de status:', err.message);
                } else {
                    console.log('✅ Trigger de status_updated_at configurado');
                }
            }
        );
    });
}

export { db, initDb };
