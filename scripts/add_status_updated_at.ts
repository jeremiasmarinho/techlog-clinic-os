import sqlite3 from 'sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

function getDatabasePath(): string {
    const nodeEnv = process.env.NODE_ENV || 'development';

    switch (nodeEnv) {
        case 'test':
            return path.resolve(__dirname, '../database.test.sqlite');
        case 'production':
            return path.resolve(__dirname, '../database.prod.sqlite');
        case 'development':
        default:
            return path.resolve(__dirname, '../database.dev.sqlite');
    }
}

const DB_PATH = getDatabasePath();
console.log(`🔧 Adding status_updated_at to: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir banco de dados:', err.message);
        process.exit(1);
    } else {
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

function addStatusUpdatedAtColumn(): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log('📝 Step 1: Adicionando coluna "status_updated_at"...');

        // First check if column already exists
        db.all('PRAGMA table_info(leads)', (err, rows: any[]) => {
            if (err) {
                return reject(err);
            }

            const columnExists = rows.some((row) => row.name === 'status_updated_at');

            if (columnExists) {
                console.log('   ⚠️  Coluna "status_updated_at" já existe. Pulando...');
                return resolve();
            }

            // Add the column
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

function initializeExistingRows(): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log('\n📝 Step 2: Inicializando registros existentes...');

        db.run(
            `UPDATE leads 
             SET status_updated_at = created_at 
             WHERE status_updated_at IS NULL`,
            function (err) {
                if (err) {
                    return reject(err);
                }
                console.log(`   ✅ ${this.changes} registro(s) inicializado(s) com created_at`);
                resolve();
            }
        );
    });
}

function createTriggerForStatusChange(): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log('\n📝 Step 3: Criando trigger para auto-update...');

        // Drop trigger if exists
        db.run(`DROP TRIGGER IF EXISTS update_status_timestamp`, (err) => {
            if (err) {
                return reject(err);
            }

            // Create new trigger
            db.run(
                `CREATE TRIGGER update_status_timestamp
                 AFTER UPDATE OF status ON leads
                 FOR EACH ROW
                 WHEN NEW.status != OLD.status
                 BEGIN
                     UPDATE leads 
                     SET status_updated_at = CURRENT_TIMESTAMP 
                     WHERE id = NEW.id;
                 END;`,
                (err) => {
                    if (err) {
                        return reject(err);
                    }
                    console.log('   ✅ Trigger "update_status_timestamp" criado com sucesso');
                    resolve();
                }
            );
        });
    });
}
