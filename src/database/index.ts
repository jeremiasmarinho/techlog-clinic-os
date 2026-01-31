import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

// Use test database in E2E test mode, otherwise use production database
const isTestMode = process.env.TEST_MODE === 'true';
const DB_PATH = isTestMode 
    ? path.resolve(__dirname, '../../clinic.test.db')
    : path.resolve(__dirname, '../../clinic.db');

// Inicializar conexão com o banco de dados
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir banco de dados:', err.message);
        process.exit(1);
    } else {
        const dbType = isTestMode ? '🧪 TEST' : '🏥 PRODUCTION';
        console.log(`✅ Conectado ao banco SQLite (${dbType}):`, DB_PATH);
        initDb();
    }
});

// Função para criar tabelas
function initDb(): void {
    // Tabela de Leads com schema completo
    db.run(`
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            type TEXT DEFAULT 'geral',
            status TEXT DEFAULT 'novo',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
    `, (err) => {
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
            
            // Create triggers for auto-update timestamp
            createUpdateTrigger();
            createStatusUpdateTrigger();
        }
    });

    // Tabela de Usuários (Team Management)
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'recepcao',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela users:', err.message);
        } else {
            console.log('✅ Tabela "users" pronta');
            
            // Seed: Inserir usuário admin padrão com senha hasheada
            db.get("SELECT * FROM users WHERE username = 'admin'", [], async (_err, row) => {
                if (!row) {
                    const hashedPassword = await bcrypt.hash('123', 10);
                    db.run(
                        "INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)",
                        ['Administrador', 'admin', hashedPassword, 'admin'],
                        (err) => {
                            if (err) {
                                console.error('❌ Erro ao criar usuário admin:', err.message);
                            } else {
                                console.log('✅ Usuário admin criado (username: admin, password: 123)');
                            }
                        }
                    );
                } else {
                    console.log('✅ Usuário admin já existe');
                }
            });
        }
    });

    // Tabela de Configurações da Clínica
    db.run(`
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
    `, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela clinic_settings:', err.message);
        } else {
            console.log('✅ Tabela "clinic_settings" pronta');
        }
    });
}

// Função auxiliar para adicionar coluna com segurança
function addColumnIfNotExists(columnName: string, columnType: string): void {
    db.run(`ALTER TABLE leads ADD COLUMN ${columnName} ${columnType}`, (err) => {
        if (err) {
            // Coluna já existe ou outro erro (ignorar silenciosamente)
            if (!err.message.includes('duplicate column name')) {
                console.warn(`⚠️ Aviso ao adicionar coluna ${columnName}:`, err.message);
            }
        } else {
            console.log(`✅ Coluna "${columnName}" adicionada`);
        }
    });
}

// Função para criar trigger de auto-update timestamp
function createUpdateTrigger(): void {
    db.run(`DROP TRIGGER IF EXISTS update_leads_timestamp`, (err) => {
        if (err && !err.message.includes('no such trigger')) {
            console.warn('⚠️ Aviso ao remover trigger:', err.message);
        }
        
        db.run(`
            CREATE TRIGGER IF NOT EXISTS update_leads_timestamp 
            AFTER UPDATE ON leads
            BEGIN
                UPDATE leads SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END;
        `, (err) => {
            if (err) {
                console.warn('⚠️ Aviso ao criar trigger:', err.message);
            } else {
                console.log('✅ Trigger de timestamp configurado');
            }
        });
    });
}

// Trigger para atualizar status_updated_at quando status mudar
function createStatusUpdateTrigger(): void {
    db.run(`DROP TRIGGER IF EXISTS update_status_timestamp`, (err) => {
        if (err && !err.message.includes('no such trigger')) {
            console.warn('⚠️ Aviso ao remover trigger de status:', err.message);
        }
        
        db.run(`
            CREATE TRIGGER IF NOT EXISTS update_status_timestamp
            AFTER UPDATE OF status ON leads
            FOR EACH ROW
            WHEN NEW.status != OLD.status
            BEGIN
                UPDATE leads 
                SET status_updated_at = CURRENT_TIMESTAMP 
                WHERE id = NEW.id;
            END;
        `, (err) => {
            if (err) {
                console.warn('⚠️ Aviso ao criar trigger de status:', err.message);
            } else {
                console.log('✅ Trigger de status_updated_at configurado');
            }
        });
    });
}

export { db, initDb };
