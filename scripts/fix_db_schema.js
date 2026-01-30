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
    console.log('\n🔧 INICIANDO MIGRAÇÃO DE SCHEMA...\n');
    const migrations = [
        {
            name: 'value',
            type: 'REAL DEFAULT 0',
            description: 'Valor estimado do procedimento (receita potencial)'
        },
        {
            name: 'source',
            type: "TEXT DEFAULT 'Manual'",
            description: 'Origem do lead (Site, WhatsApp, Manual)'
        },
        {
            name: 'appointment_date',
            type: 'DATETIME',
            description: 'Data e hora do agendamento (ISO 8601)'
        },
        {
            name: 'doctor',
            type: 'TEXT',
            description: 'Nome do profissional responsável'
        },
        {
            name: 'notes',
            type: 'TEXT',
            description: 'Observações adicionais'
        },
        {
            name: 'attendance_status',
            type: 'TEXT',
            description: 'Status de comparecimento (compareceu, nao_compareceu, etc)'
        },
        {
            name: 'archive_reason',
            type: 'TEXT',
            description: 'Motivo do arquivamento'
        },
        {
            name: 'updated_at',
            type: 'DATETIME DEFAULT CURRENT_TIMESTAMP',
            description: 'Timestamp de última atualização'
        }
    ];
    let completed = 0;
    let errors = 0;
    migrations.forEach((migration) => {
        db.run(`ALTER TABLE leads ADD COLUMN ${migration.name} ${migration.type}`, (err) => {
            if (err) {
                if (err.message.includes('duplicate column name')) {
                    console.log(`⏭️  Coluna "${migration.name}" já existe`);
                }
                else {
                    console.error(`❌ Erro ao adicionar "${migration.name}":`, err.message);
                    errors++;
                }
            }
            else {
                console.log(`✅ Coluna "${migration.name}" adicionada: ${migration.description}`);
            }
            completed++;
            if (completed === migrations.length) {
                console.log('\n' + '='.repeat(80));
                console.log(`📊 MIGRAÇÃO CONCLUÍDA: ${migrations.length - errors} sucesso(s), ${errors} erro(s)`);
                console.log('='.repeat(80) + '\n');
                verifySchema();
            }
        });
    });
}
function verifySchema() {
    console.log('🔍 VERIFICANDO SCHEMA FINAL...\n');
    db.all("PRAGMA table_info(leads)", [], (err, rows) => {
        if (err) {
            console.error('❌ Erro ao verificar schema:', err.message);
            db.close();
            return;
        }
        console.log('📋 COLUNAS EXISTENTES NA TABELA "leads":\n');
        rows.forEach(col => {
            console.log(`  - ${col.name.padEnd(20)} | ${col.type.padEnd(15)} | Default: ${col.dflt_value || 'NULL'}`);
        });
        console.log('\n✅ Verificação de schema concluída!\n');
        db.close((err) => {
            if (err) {
                console.error('❌ Erro ao fechar banco:', err.message);
            }
            else {
                console.log('🔒 Conexão com banco fechada.\n');
            }
        });
    });
}
//# sourceMappingURL=fix_db_schema.js.map