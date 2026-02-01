import sqlite3 from 'sqlite3';
import path from 'path';
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
console.log(`⚡ Quick reset database: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir banco de dados:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Conectado ao banco SQLite');
        quickReset();
    }
});

function quickReset() {
    console.log('\n⚡ RESET RÁPIDO (apenas leads)...\n');

    db.run('DELETE FROM leads', (err) => {
        if (err) {
            console.error('❌ Erro ao limpar leads:', err.message);
            db.close();
            process.exit(1);
        } else {
            console.log('✅ Leads removidos');

            // Resetar autoincrement
            db.run("DELETE FROM sqlite_sequence WHERE name='leads'", (err) => {
                if (err && !err.message.includes('no such table')) {
                    console.warn('⚠️ Aviso ao resetar autoincrement:', err.message);
                }

                db.close((err) => {
                    if (err) {
                        console.error('❌ Erro ao fechar banco:', err.message);
                    } else {
                        console.log('✅ Reset concluído!\n');
                    }
                });
            });
        }
    });
}
