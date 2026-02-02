/**
 * ============================================================================
 * DATABASE CONFIG - TechLog Clinic OS
 * ============================================================================
 *
 * Wrapper assíncrono para o SQLite.
 * Fornece interface Promise-based para queries.
 *
 * @usage
 * import { dbAsync } from '../config/database.config';
 * const user = await dbAsync.get<User>('SELECT * FROM users WHERE id = ?', [1]);
 */

import sqlite3 from 'sqlite3';
import path from 'path';

// ============================================================================
// DATABASE PATH SELECTION
// ============================================================================

function getDatabasePath(): string {
    const nodeEnv = process.env.NODE_ENV || 'development';

    let dbFileName: string;
    let envLabel: string;

    switch (nodeEnv) {
        case 'test':
            dbFileName = 'database.test.sqlite';
            envLabel = '🧪 TEST';
            break;
        case 'production':
            dbFileName = 'database.prod.sqlite';
            envLabel = '🏥 PRODUCTION';
            break;
        case 'development':
        default:
            dbFileName = 'database.dev.sqlite';
            envLabel = '💻 DEVELOPMENT';
            break;
    }

    // Suporte a TEST_DB_PATH para testes E2E
    const dbPath =
        nodeEnv === 'test' && process.env.TEST_DB_PATH
            ? process.env.TEST_DB_PATH
            : path.resolve(__dirname, '../../', dbFileName);

    console.log(`📊 Database environment: ${envLabel}`);
    console.log(`📁 Database path: ${dbPath}`);

    return dbPath;
}

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const DB_PATH = getDatabasePath();

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir banco de dados:', err.message);
        process.exit(1);
    } else {
        console.log(`✅ Conectado ao banco SQLite com sucesso!`);
    }
});

// ============================================================================
// ASYNC WRAPPER
// ============================================================================

/**
 * Interface de resultado para INSERT/UPDATE/DELETE
 */
export interface RunResult {
    lastID: number;
    changes: number;
}

/**
 * Wrapper assíncrono para operações de banco
 */
export const dbAsync = {
    /**
     * Busca um único registro
     * @param sql Query SQL com placeholders ?
     * @param params Parâmetros para a query
     * @returns Registro encontrado ou null
     */
    get<T>(sql: string, params: any[] = []): Promise<T | null> {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('DB Error (get):', err.message);
                    reject(err);
                } else {
                    resolve((row as T) || null);
                }
            });
        });
    },

    /**
     * Busca múltiplos registros
     * @param sql Query SQL com placeholders ?
     * @param params Parâmetros para a query
     * @returns Array de registros
     */
    all<T>(sql: string, params: any[] = []): Promise<T[]> {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('DB Error (all):', err.message);
                    reject(err);
                } else {
                    resolve((rows as T[]) || []);
                }
            });
        });
    },

    /**
     * Executa INSERT, UPDATE ou DELETE
     * @param sql Query SQL com placeholders ?
     * @param params Parâmetros para a query
     * @returns Objeto com lastID e changes
     */
    run(sql: string, params: any[] = []): Promise<RunResult> {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) {
                    console.error('DB Error (run):', err.message);
                    reject(err);
                } else {
                    resolve({
                        lastID: this.lastID,
                        changes: this.changes,
                    });
                }
            });
        });
    },

    /**
     * Executa múltiplas operações em transação
     * @param operations Array de operações SQL
     */
    async transaction(operations: { sql: string; params: any[] }[]): Promise<void> {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION', (err) => {
                    if (err) return reject(err);

                    let failed = false;

                    for (const op of operations) {
                        if (failed) break;

                        db.run(op.sql, op.params, (opErr) => {
                            if (opErr) {
                                failed = true;
                                db.run('ROLLBACK', () => {
                                    reject(opErr);
                                });
                            }
                        });
                    }

                    if (!failed) {
                        db.run('COMMIT', (commitErr) => {
                            if (commitErr) {
                                db.run('ROLLBACK', () => {
                                    reject(commitErr);
                                });
                            } else {
                                resolve();
                            }
                        });
                    }
                });
            });
        });
    },

    /**
     * Verifica se o banco está conectado
     */
    ping(): Promise<boolean> {
        return new Promise((resolve) => {
            db.get('SELECT 1', [], (err) => {
                resolve(!err);
            });
        });
    },
};

// ============================================================================
// EXPORTS
// ============================================================================

// Exportar db original para compatibilidade com código legado
export { db };

// Re-exportar path para uso em migrações
export { DB_PATH };

// Exportar função para fechar conexão (útil em testes)
export function closeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}
