"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const DB_PATH = path_1.default.resolve(__dirname, '../clinic.db');
const db = new sqlite3_1.default.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir banco de dados:', err.message);
        process.exit(1);
    }
    else {
        console.log('✅ Conectado ao banco SQLite');
        updateAdminPassword();
    }
});
async function updateAdminPassword() {
    console.log('\n🔒 ATUALIZANDO SENHA DO ADMIN...\n');
    const newPassword = 'Mudar123!';
    try {
        const hashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        db.run("UPDATE users SET password = ? WHERE username = 'admin'", [hashedPassword], function (err) {
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
        });
    }
    catch (error) {
        console.error('❌ Erro ao criar hash:', error);
        process.exit(1);
    }
}
//# sourceMappingURL=update_admin_password.js.map