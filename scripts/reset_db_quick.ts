import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '../clinic.db');

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

    db.run("DELETE FROM leads", (err) => {
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
