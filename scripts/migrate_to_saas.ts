import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.resolve(__dirname, '../../clinic.db');
const MIGRATION_SQL = path.resolve(__dirname, '../../migrations/001_saas_multi_tenancy.sql');

console.log('📍 DB Path:', DB_PATH);
console.log('📍 Migration Path:', MIGRATION_SQL);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco:', err.message);
        process.exit(1);
    }
    console.log('✅ Conectado ao banco SQLite');
});

async function runMigration() {
    console.log('\n🚀 INICIANDO MIGRAÇÃO MULTI-TENANCY\n');
    console.log('=' .repeat(60));

    try {
        // Read SQL file
        if (!fs.existsSync(MIGRATION_SQL)) {
            throw new Error(`Arquivo de migração não encontrado: ${MIGRATION_SQL}`);
        }

        const sql = fs.readFileSync(MIGRATION_SQL, 'utf-8');
        
        // Split SQL handling triggers (they have semicolons inside)
        const statements: string[] = [];
        let currentStatement = '';
        let inTrigger = false;

        const lines = sql.split('\n');
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Detect trigger start
            if (trimmedLine.toUpperCase().includes('CREATE TRIGGER')) {
                inTrigger = true;
            }

            currentStatement += line + '\n';

            // Detect trigger end
            if (inTrigger && trimmedLine === 'END;') {
                inTrigger = false;
                statements.push(currentStatement.trim());
                currentStatement = '';
                continue;
            }

            // Normal statement end (not in trigger)
            if (!inTrigger && trimmedLine.endsWith(';') && !trimmedLine.startsWith('--')) {
                statements.push(currentStatement.trim());
                currentStatement = '';
            }
        }

        // Add last statement if exists
        if (currentStatement.trim()) {
            statements.push(currentStatement.trim());
        }

        // Filter statements
        const filteredStatements = statements.filter(s => {
            const cleanStatement = s.replace(/--[^\n]*/g, '').trim();
            return cleanStatement.length > 0 && 
                   cleanStatement.toLowerCase() !== 'begin' &&
                   cleanStatement.toLowerCase() !== 'commit';
        });

        console.log(`📝 Total de statements a executar: ${filteredStatements.length}\n`);

        for (let i = 0; i < filteredStatements.length; i++) {
            await executeStatement(filteredStatements[i], i + 1);
        }

        console.log('\n' + '=' .repeat(60));
        console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!\n');
        
        await verifyMigration();
        
    } catch (error: any) {
        console.error('\n❌ ERRO NA MIGRAÇÃO:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        db.close(() => {
            console.log('\n👋 Conexão com banco fechada');
            process.exit(0);
        });
    }
}

function executeStatement(statement: string, step: number): Promise<void> {
    return new Promise((resolve, reject) => {
        // Skip empty or comment-only statements
        if (!statement || statement.trim().length === 0) {
            return resolve();
        }

        const preview = statement.substring(0, 80).replace(/\n/g, ' ');
        
        db.run(statement, (err) => {
            if (err) {
                // Ignore certain non-critical errors
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

async function verifyMigration(): Promise<void> {
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

        // Check clinics table
        db.get("SELECT COUNT(*) as count FROM clinics", [], (err, row: any) => {
            if (err) {
                console.error('❌ Erro ao verificar clinics:', err.message);
            } else {
                console.log(`✅ Clínicas cadastradas: ${row.count}`);
                
                // Show clinic details
                db.all("SELECT id, name, slug, status, plan_tier FROM clinics", [], (err, rows: any[]) => {
                    if (!err && rows.length > 0) {
                        rows.forEach(clinic => {
                            console.log(`   📍 #${clinic.id}: ${clinic.name} (${clinic.slug}) - ${clinic.plan_tier} [${clinic.status}]`);
                        });
                    }
                    checkComplete();
                });
            }
        });

        // Check users with clinic_id
        db.all("SELECT id, username, name, role, clinic_id, is_owner FROM users", [], (err, rows: any[]) => {
            if (err) {
                console.error('❌ Erro ao verificar users:', err.message);
                checkComplete();
            } else {
                console.log(`\n✅ Usuários migrados: ${rows.length}`);
                rows.forEach(user => {
                    const ownerBadge = user.is_owner ? '👑' : '  ';
                    console.log(`   ${ownerBadge} #${user.id}: ${user.username} (${user.name}) | Role: ${user.role} | Clinic: ${user.clinic_id}`);
                });
                checkComplete();
            }
        });

        // Check leads with clinic_id
        db.get("SELECT COUNT(*) as count, clinic_id FROM leads WHERE clinic_id = 1", [], (err, row: any) => {
            if (err) {
                console.error('❌ Erro ao verificar leads:', err.message);
            } else {
                console.log(`\n✅ Leads migrados para Clínica ID 1: ${row.count}`);
            }
            checkComplete();
        });
    });
}

// Run migration
runMigration().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
