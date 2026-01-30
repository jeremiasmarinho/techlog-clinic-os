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
        runMigration();
    }
});
function runMigration() {
    console.log('\n🔧 INICIANDO MIGRAÇÃO: TIME IN STATUS FEATURE...\n');
    addStatusUpdatedAtColumn()
        .then(() => initializeExistingRows())
        .then(() => createTriggerForStatusChange())
        .then(() => {
        console.log('\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!\n');
        console.log('📊 Resumo:');
        console.log('   - Coluna "status_updated_at" adicionada');
        console.log('   - Registros existentes inicializados');
        console.log('   - Trigger de auto-update criado\n');
        db.close();
        process.exit(0);
    })
        .catch((err) => {
        console.error('\n❌ ERRO NA MIGRAÇÃO:', err.message);
        db.close();
        process.exit(1);
    });
}
function addStatusUpdatedAtColumn() {
    return new Promise((resolve, reject) => {
        console.log('📝 Step 1: Adicionando coluna "status_updated_at"...');
        db.all("PRAGMA table_info(leads)", (err, rows) => {
            if (err) {
                return reject(err);
            }
            const columnExists = rows.some(row => row.name === 'status_updated_at');
            if (columnExists) {
                console.log('   ⚠️  Coluna "status_updated_at" já existe. Pulando...');
                return resolve();
            }
            db.run(`ALTER TABLE leads ADD COLUMN status_updated_at DATETIME`, (err) => {
                if (err) {
                    return reject(err);
                }
                console.log('   ✅ Coluna "status_updated_at" adicionada com sucesso');
                resolve();
            });
        });
    });
}
function initializeExistingRows() {
    return new Promise((resolve, reject) => {
        console.log('\n📝 Step 2: Inicializando registros existentes...');
        db.run(`UPDATE leads 
             SET status_updated_at = created_at 
             WHERE status_updated_at IS NULL`, function (err) {
            if (err) {
                return reject(err);
            }
            console.log(`   ✅ ${this.changes} registro(s) inicializado(s) com created_at`);
            resolve();
        });
    });
}
function createTriggerForStatusChange() {
    return new Promise((resolve, reject) => {
        console.log('\n📝 Step 3: Criando trigger para auto-update...');
        db.run(`DROP TRIGGER IF EXISTS update_status_timestamp`, (err) => {
            if (err) {
                return reject(err);
            }
            db.run(`CREATE TRIGGER update_status_timestamp
                 AFTER UPDATE OF status ON leads
                 FOR EACH ROW
                 WHEN NEW.status != OLD.status
                 BEGIN
                     UPDATE leads 
                     SET status_updated_at = CURRENT_TIMESTAMP 
                     WHERE id = NEW.id;
                 END;`, (err) => {
                if (err) {
                    return reject(err);
                }
                console.log('   ✅ Trigger "update_status_timestamp" criado com sucesso');
                resolve();
            });
        });
    });
}
//# sourceMappingURL=add_status_updated_at.js.map