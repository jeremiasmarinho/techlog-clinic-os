"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
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
function resetDatabase() {
    console.log('\n🗑️  LIMPANDO DADOS EXISTENTES...\n');
    db.run("DELETE FROM leads", (err) => {
        if (err) {
            console.error('❌ Erro ao limpar leads:', err.message);
            db.close();
            process.exit(1);
        }
        else {
            console.log('✅ Tabela "leads" limpa com sucesso');
            console.log('ℹ️  Tabela "users" preservada (admin mantido)');
            db.run("DELETE FROM sqlite_sequence WHERE name='leads'", (err) => {
                if (err && !err.message.includes('no such table')) {
                    console.warn('⚠️ Aviso ao resetar autoincrement:', err.message);
                }
                db.close((err) => {
                    if (err) {
                        console.error('❌ Erro ao fechar banco:', err.message);
                    }
                    else {
                        console.log('\n✅ Banco resetado! Reinicie o servidor para recarregar os dados de seed.');
                        console.log('💡 Execute: npm start\n');
                    }
                });
            });
        }
    });
}
//# sourceMappingURL=reset_db_with_seed.js.map