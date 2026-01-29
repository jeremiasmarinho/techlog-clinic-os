import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.resolve(__dirname, '../clinic.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir banco de dados:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Conectado ao banco SQLite');
        resetDatabase();
    }
});

function resetDatabase() {
    console.log('\n🗑️  LIMPANDO DADOS EXISTENTES...\n');

    // Limpar apenas a tabela de leads (preserva users)
    db.run("DELETE FROM leads", (err) => {
        if (err) {
            console.error('❌ Erro ao limpar leads:', err.message);
            db.close();
            process.exit(1);
        } else {
            console.log('✅ Tabela "leads" limpa com sucesso');
            console.log('ℹ️  Tabela "users" preservada (admin mantido)');
            
            // Resetar autoincrement
            db.run("DELETE FROM sqlite_sequence WHERE name='leads'", (err) => {
                if (err && !err.message.includes('no such table')) {
                    console.warn('⚠️ Aviso ao resetar autoincrement:', err.message);
                }
                
                db.close((err) => {
                    if (err) {
                        console.error('❌ Erro ao fechar banco:', err.message);
                    } else {
                        console.log('\n✅ Banco resetado! Reinicie o servidor para recarregar os dados de seed.');
                        console.log('💡 Execute: npm start\n');
                    }
                });
            });
        }
    });
}
