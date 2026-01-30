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
        resetDatabase();
    }
});
async function resetDatabase() {
    console.log('\n🗑️  RESETANDO BANCO DE DADOS...\n');
    try {
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM leads", (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
        console.log('✅ Tabela "leads" limpa com sucesso');
        await new Promise((resolve) => {
            db.run("DELETE FROM sqlite_sequence WHERE name='leads'", (err) => {
                if (err && !err.message.includes('no such table')) {
                    console.warn('⚠️ Aviso ao resetar autoincrement:', err.message);
                }
                resolve();
            });
        });
        const adminExists = await new Promise((resolve) => {
            db.get("SELECT * FROM users WHERE username = 'admin'", [], (_err, row) => {
                resolve(!!row);
            });
        });
        if (!adminExists) {
            console.log('\n👤 Criando usuário admin...');
            const hashedPassword = await bcrypt_1.default.hash('123', 10);
            await new Promise((resolve, reject) => {
                db.run("INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)", ['Administrador', 'admin', hashedPassword, 'admin'], (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
            console.log('✅ Usuário admin criado');
        }
        else {
            console.log('ℹ️  Usuário admin já existe');
        }
        console.log('ℹ️  Tabela "users" preservada');
        db.close((err) => {
            if (err) {
                console.error('❌ Erro ao fechar banco:', err.message);
            }
            else {
                console.log('\n✅ Banco resetado com sucesso!');
                console.log('💡 Execute "npm start" para iniciar o servidor\n');
            }
        });
    }
    catch (error) {
        console.error('❌ Erro ao resetar banco:', error.message);
        db.close();
        process.exit(1);
    }
}
//# sourceMappingURL=reset_db.js.map