"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const DB_PATH = path_1.default.resolve(__dirname, '../../clinic.db');
const MIGRATION_SQL = path_1.default.resolve(__dirname, '../../migrations/001_saas_multi_tenancy.sql');
console.log('📍 DB Path:', DB_PATH);
console.log('📍 Migration Path:', MIGRATION_SQL);
const db = new sqlite3_1.default.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco:', err.message);
        process.exit(1);
    }
    console.log('✅ Conectado ao banco SQLite');
});
async function runMigration() {
    console.log('\n🚀 INICIANDO MIGRAÇÃO MULTI-TENANCY\n');
    console.log('='.repeat(60));
    try {
        if (!fs_1.default.existsSync(MIGRATION_SQL)) {
            throw new Error(`Arquivo de migração não encontrado: ${MIGRATION_SQL}`);
        }
        const sql = fs_1.default.readFileSync(MIGRATION_SQL, 'utf-8');
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => {
            const cleanStatement = s.replace(/--[^\n]*/g, '').trim();
            return cleanStatement.length > 0 &&
                !cleanStatement.startsWith('--') &&
                cleanStatement.toLowerCase() !== 'begin' &&
                cleanStatement.toLowerCase() !== 'commit';
        });
        console.log(`📝 Total de statements a executar: ${statements.length}\n`);
        for (let i = 0; i < statements.length; i++) {
            await executeStatement(statements[i], i + 1);
        }
        console.log('\n' + '='.repeat(60));
        console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!\n');
        await verifyMigration();
    }
    catch (error) {
        console.error('\n❌ ERRO NA MIGRAÇÃO:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
    finally {
        db.close(() => {
            console.log('\n👋 Conexão com banco fechada');
            process.exit(0);
        });
    }
}
function executeStatement(statement, step) {
    return new Promise((resolve, reject) => {
        if (!statement || statement.trim().length === 0) {
            return resolve();
        }
        const preview = statement.substring(0, 80).replace(/\n/g, ' ');
        db.run(statement, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name') ||
                    err.message.includes('already exists')) {
                    console.log(`⏭️  Step ${step}: Já existe, pulando... (${preview})`);
                    return resolve();
                }
                console.error(`\n❌ Step ${step} FALHOU:`);
                console.error(`   SQL: ${preview}...`);
                console.error(`   Erro: ${err.message}`);
                return reject(err);
            }
            console.log(`✅ Step ${step}: ${preview}...`);
            resolve();
        });
    });
}
async function verifyMigration() {
    console.log('\n🔍 VERIFICANDO MIGRAÇÃO...\n');
    return new Promise((resolve) => {
        let completedChecks = 0;
        const totalChecks = 3;
        function checkComplete() {
            completedChecks++;
            if (completedChecks === totalChecks) {
                resolve();
            }
        }
        db.get("SELECT COUNT(*) as count FROM clinics", [], (err, row) => {
            if (err) {
                console.error('❌ Erro ao verificar clinics:', err.message);
            }
            else {
                console.log(`✅ Clínicas cadastradas: ${row.count}`);
                db.all("SELECT id, name, slug, status, plan_tier FROM clinics", [], (err, rows) => {
                    if (!err && rows.length > 0) {
                        rows.forEach(clinic => {
                            console.log(`   📍 #${clinic.id}: ${clinic.name} (${clinic.slug}) - ${clinic.plan_tier} [${clinic.status}]`);
                        });
                    }
                    checkComplete();
                });
            }
        });
        db.all("SELECT id, username, name, role, clinic_id, is_owner FROM users", [], (err, rows) => {
            if (err) {
                console.error('❌ Erro ao verificar users:', err.message);
                checkComplete();
            }
            else {
                console.log(`\n✅ Usuários migrados: ${rows.length}`);
                rows.forEach(user => {
                    const ownerBadge = user.is_owner ? '👑' : '  ';
                    console.log(`   ${ownerBadge} #${user.id}: ${user.username} (${user.name}) | Role: ${user.role} | Clinic: ${user.clinic_id}`);
                });
                checkComplete();
            }
        });
        db.get("SELECT COUNT(*) as count, clinic_id FROM leads WHERE clinic_id = 1", [], (err, row) => {
            if (err) {
                console.error('❌ Erro ao verificar leads:', err.message);
            }
            else {
                console.log(`\n✅ Leads migrados para Clínica ID 1: ${row.count}`);
            }
            checkComplete();
        });
    });
}
runMigration().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
//# sourceMappingURL=migrate_to_saas.js.map