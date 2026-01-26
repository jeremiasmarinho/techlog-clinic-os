import sqlite3 from 'sqlite3';
import path from 'path';

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
            console.error('❌ Erro ao criar tabela:', err.message);
        } else {
            console.log('✅ Tabela "leads" pronta');
        }
    });
}

export { db, initDb };
