import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

const DB_PATH = path.resolve(__dirname, '../clinic.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir banco de dados:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Conectado ao banco SQLite');
        updateAdminPassword();
    }
});

async function updateAdminPassword() {
    console.log('\n🔒 ATUALIZANDO SENHA DO ADMIN...\n');
    
    const newPassword = 'Mudar123!';
    
    try {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update admin password
        db.run(
            "UPDATE users SET password = ? WHERE username = 'admin'",
            [hashedPassword],
            function(err) {
                if (err) {
                    console.error('❌ Erro ao atualizar senha:', err.message);
                    process.exit(1);
                }
                
                console.log(`✅ Senha do admin atualizada com sucesso!`);
                console.log(`\n📋 Credenciais de Login:`);
                console.log(`   E-mail: admin@medicalcrm.com`);
                console.log(`   Senha: ${newPassword}\n`);
                
                db.close();
                process.exit(0);
            }
        );
    } catch (error) {
        console.error('❌ Erro ao criar hash:', error);
        process.exit(1);
    }
}
