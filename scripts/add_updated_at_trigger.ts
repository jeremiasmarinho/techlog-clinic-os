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
console.log(`🔧 Adding updated_at trigger to: ${DB_PATH}`);

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir banco de dados:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Conectado ao banco SQLite');
        addUpdatedAtColumn();
    }
});

function addUpdatedAtColumn() {
    console.log('\n🔧 ADICIONANDO COLUNA updated_at...\n');

    // First, try to add the column without DEFAULT
    db.run(`ALTER TABLE leads ADD COLUMN updated_at DATETIME`, (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log('⏭️  Coluna "updated_at" já existe');
                createTrigger();
            } else {
                console.error('❌ Erro ao adicionar coluna:', err.message);
                db.close();
            }
        } else {
            console.log('✅ Coluna "updated_at" adicionada');

            // Set initial values for existing rows
            db.run(`UPDATE leads SET updated_at = created_at WHERE updated_at IS NULL`, (err) => {
                if (err) {
                    console.error('❌ Erro ao inicializar valores:', err.message);
                } else {
                    console.log('✅ Valores iniciais definidos (updated_at = created_at)');
                }
                createTrigger();
            });
        }
    });
}

function createTrigger() {
    console.log('\n🔧 CRIANDO TRIGGER PARA AUTO-UPDATE...\n');

    // Drop existing trigger if any
    db.run(`DROP TRIGGER IF EXISTS update_leads_timestamp`, (err) => {
        if (err) {
            console.error('⚠️ Aviso ao remover trigger:', err.message);
        }

        // Create trigger to auto-update timestamp
        db.run(
            `
            CREATE TRIGGER update_leads_timestamp 
            AFTER UPDATE ON leads
            BEGIN
                UPDATE leads SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
            END;
        `,
            (err) => {
                if (err) {
                    console.error('❌ Erro ao criar trigger:', err.message);
                } else {
                    console.log('✅ Trigger criado com sucesso!');
                    console.log('   → updated_at será atualizado automaticamente em cada UPDATE');
                }

                console.log('\n' + '='.repeat(80));
                console.log('✅ CONFIGURAÇÃO DE TIMESTAMP CONCLUÍDA!');
                console.log('='.repeat(80) + '\n');

                db.close((err) => {
                    if (err) {
                        console.error('❌ Erro ao fechar banco:', err.message);
                    } else {
                        console.log('🔒 Conexão com banco fechada.\n');
                    }
                });
            }
        );
    });
}
