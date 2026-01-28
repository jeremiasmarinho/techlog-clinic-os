import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

const DB_PATH = path.resolve(__dirname, '../../clinic.db');

// Inicializar conexão com o banco de dados
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir banco de dados:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Conectado ao banco SQLite em:', DB_PATH);
        initDb();
    }
});

// Função para criar tabelas
function initDb(): void {
    // Tabela de Leads
    db.run(`
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            type TEXT DEFAULT 'geral',
            status TEXT DEFAULT 'novo',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela leads:', err.message);
        } else {
            console.log('✅ Tabela "leads" pronta');
            
            // Adicionar novas colunas se não existirem (para upgrade)
            addColumnIfNotExists('appointment_date', 'DATETIME');
            addColumnIfNotExists('doctor', 'TEXT');
            addColumnIfNotExists('notes', 'TEXT');
            addColumnIfNotExists('attendance_status', 'TEXT');
            addColumnIfNotExists('archive_reason', 'TEXT');
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
            db.get("SELECT * FROM users WHERE username = 'admin'", [], (_err, row) => {
                if (!row) {
                    // Hash da senha antes de inserir
                    bcrypt.hash('123', 10).then((hashedPassword) => {
                        db.run(
                            "INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)",
                            ['Administrador', 'admin', hashedPassword, 'admin'],
                            (err) => {
                                if (err) {
                                    console.error('❌ Erro ao criar usuário admin:', err.message);
                                } else {
                                    console.log('✅ Usuário admin criado com credenciais padrão');
                                }
                            }
                        );
                    }).catch((err) => {
                        console.error('❌ Erro ao criar hash de senha:', err.message);
                    });
                } else {
                    console.log('✅ Usuário admin já existe');
                }
            });
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

export { db, initDb };
