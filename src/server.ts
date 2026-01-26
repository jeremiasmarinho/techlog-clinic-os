import express, { Request, Response, Application } from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import path from 'path';

// Configurações
const PORT = process.env.PORT || 3001;
const DB_PATH = path.resolve(__dirname, '../clinic.db');

// Interfaces
interface LeadBody {
    name: string;
    phone: string;
    type?: string;
}

interface Lead {
    id: number;
    name: string;
    phone: string;
    type: string;
    status: string;
    created_at: string;
}

// Classe do Servidor
class Server {
    private app: Application;
    private db: sqlite3.Database;

    constructor() {
        this.app = express();
        this.db = this.initDatabase();
        this.setupMiddleware();
        this.setupRoutes();
    }

    private initDatabase(): sqlite3.Database {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('❌ Erro ao abrir banco de dados:', err.message);
                process.exit(1);
            } else {
                console.log('✅ Conectado ao banco SQLite em:', DB_PATH);
                this.createTables();
            }
        });
        return db;
    }

    private createTables(): void {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                type TEXT DEFAULT 'geral',
                status TEXT DEFAULT 'novo',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('❌ Erro ao criar tabela:', err.message);
            } else {
                console.log('✅ Tabela "leads" pronta');
            }
        });
    }

    private setupMiddleware(): void {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }

    private setupRoutes(): void {
        // Rota de health check
        this.app.get('/', this.healthCheck);
        
        // Rotas de leads
        this.app.post('/api/leads', this.createLead.bind(this));
        this.app.get('/api/leads', this.getLeads.bind(this));
    }

    private healthCheck = (_req: Request, res: Response): void => {
        res.json({ 
            message: 'TechLog Clinic OS - Sistema Online 🚀',
            status: 'healthy',
            timestamp: new Date().toISOString()
        });
    };

    private createLead(req: Request<{}, {}, LeadBody>, res: Response): void {
        const { name, phone, type } = req.body;

        // Validação
        if (!name || !phone) {
            res.status(400).json({ 
                error: 'Nome e Telefone são obrigatórios' 
            });
            return;
        }

        // Sanitização do telefone
        const sanitizedPhone = phone.replace(/\D/g, '');
        
        if (sanitizedPhone.length < 10) {
            res.status(400).json({ 
                error: 'Telefone inválido. Use formato com DDD.' 
            });
            return;
        }

        const stmt = this.db.prepare(
            "INSERT INTO leads (name, phone, type) VALUES (?, ?, ?)"
        );

        stmt.run(
            name.trim(), 
            sanitizedPhone, 
            type || 'geral', 
            function(this: sqlite3.RunResult, err: Error | null): void {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                res.status(201).json({ 
                    id: this.lastID, 
                    message: 'Lead cadastrado com sucesso!',
                    whatsapp_link: `https://wa.me/55${sanitizedPhone}`
                });
            }
        );

        stmt.finalize();
    }

    private getLeads(_req: Request, res: Response): void {
        this.db.all(
            "SELECT * FROM leads ORDER BY created_at DESC", 
            [], 
            (err: Error | null, rows: Lead[]): void => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ 
                    total: rows.length,
                    leads: rows 
                });
            }
        );
    }

    public start(): void {
        this.app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📍 http://localhost:${PORT}`);
        });
    }

    public close(): void {
        this.db.close((err) => {
            if (err) {
                console.error('❌ Erro ao fechar banco:', err.message);
            } else {
                console.log('✅ Conexão com banco fechada');
            }
        });
    }
}

// Instanciar e iniciar o servidor
const server = new Server();
server.start();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏳ Encerrando servidor...');
    server.close();
    process.exit(0);
});

export default server;
