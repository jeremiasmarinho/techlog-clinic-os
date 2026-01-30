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
        addUpdatedAtColumn();
    }
});
function addUpdatedAtColumn() {
    console.log('\n🔧 ADICIONANDO COLUNA updated_at...\n');
    db.run(`ALTER TABLE leads ADD COLUMN updated_at DATETIME`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('⏭️  Coluna "updated_at" já existe');
                createTrigger();
            }
            else {
                console.error('❌ Erro ao adicionar coluna:', err.message);
                db.close();
            }
        }
        else {
            console.log('✅ Coluna "updated_at" adicionada');
            db.run(`UPDATE leads SET updated_at = created_at WHERE updated_at IS NULL`, (err) => {
                if (err) {
                    console.error('❌ Erro ao inicializar valores:', err.message);
                }
                else {
                    console.log('✅ Valores iniciais definidos (updated_at = created_at)');
                }
                createTrigger();
            });
        }
    });
}
function createTrigger() {
    console.log('\n🔧 CRIANDO TRIGGER PARA AUTO-UPDATE...\n');
    db.run(`DROP TRIGGER IF EXISTS update_leads_timestamp`, (err) => {
        if (err) {
            console.error('⚠️ Aviso ao remover trigger:', err.message);
        }
        db.run(`
            CREATE TRIGGER update_leads_timestamp 
            AFTER UPDATE ON leads
            BEGIN
                UPDATE leads SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END;
        `, (err) => {
            if (err) {
                console.error('❌ Erro ao criar trigger:', err.message);
            }
            else {
                console.log('✅ Trigger criado com sucesso!');
                console.log('   → updated_at será atualizado automaticamente em cada UPDATE');
            }
            console.log('\n' + '='.repeat(80));
            console.log('✅ CONFIGURAÇÃO DE TIMESTAMP CONCLUÍDA!');
            console.log('='.repeat(80) + '\n');
            db.close((err) => {
                if (err) {
                    console.error('❌ Erro ao fechar banco:', err.message);
                }
                else {
                    console.log('🔒 Conexão com banco fechada.\n');
                }
            });
        });
    });
}
//# sourceMappingURL=add_updated_at_trigger.js.map