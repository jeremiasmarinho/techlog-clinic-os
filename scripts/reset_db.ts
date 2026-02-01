import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

function getDatabasePath(): string {
    const nodeEnv = process.env.NODE_ENV || 'development';

    switch (nodeEnv) {
        case 'test':
            return path.resolve(__dirname, '../database.test.sqlite');
        case 'production':
            return path.resolve(__dirname, '../database.prod.sqlite');
        case 'development':
        default:
            return path.resolve(__dirname, '../database.dev.sqlite');
    }
}

const DB_PATH = getDatabasePath();
console.log(`🗑️  Resetting database: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir banco de dados:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Conectado ao banco SQLite');
        resetDatabase();
    }
});

async function resetDatabase() {
    console.log('\n🗑️  RESETANDO BANCO DE DADOS...\n');

    try {
        // Limpar apenas a tabela de leads (preserva users)
        await new Promise<void>((resolve, reject) => {
            db.run('DELETE FROM leads', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        console.log('✅ Tabela "leads" limpa com sucesso');

        // Resetar autoincrement
        await new Promise<void>((resolve) => {
            db.run("DELETE FROM sqlite_sequence WHERE name='leads'", (err) => {
                if (err && !err.message.includes('no such table')) {
                    console.warn('⚠️ Aviso ao resetar autoincrement:', err.message);
                }
                resolve();
            });
        });

        // Verificar se usuário admin existe
        const adminExists = await new Promise<boolean>((resolve) => {
            db.get("SELECT * FROM users WHERE username = 'admin'", [], (_err, row) => {
                resolve(!!row);
            });
        });

        if (!adminExists) {
            console.log('\n👤 Criando usuário admin...');
            const hashedPassword = await bcrypt.hash('123', 10);

            await new Promise<void>((resolve, reject) => {
                db.run(
                    'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
                    ['Administrador', 'admin', hashedPassword, 'admin'],
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
            console.log('✅ Usuário admin criado');
        } else {
            console.log('ℹ️  Usuário admin já existe');
        }

        console.log('ℹ️  Tabela "users" preservada');

        db.close((err) => {
            if (err) {
                console.error('❌ Erro ao fechar banco:', err.message);
            } else {
                console.log('\n✅ Banco resetado com sucesso!');
                console.log('💡 Execute "npm start" para iniciar o servidor\n');
            }
        });
    } catch (error: any) {
        console.error('❌ Erro ao resetar banco:', error.message);
        db.close();
        process.exit(1);
    }
}
