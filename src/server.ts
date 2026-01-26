import express from 'express';
import cors from 'cors';
import path from 'path';
import leadRoutes from './routes/lead.routes'; // Importação sem chaves {} (Default)
import './database'; // Inicia o banco de dados

export class Server {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.config();
        this.routes();
    }

    private config(): void {
        // CORS Liberado Geral
        this.app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'x-access-token']
        }));

        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../public')));
    }

    private routes(): void {
        this.app.use('/api/leads', leadRoutes);

        // Rota de Teste (Usando _req para o TypeScript não reclamar)
        this.app.get('/api', (_req, res) => {
            res.json({ message: 'TechLog API Online 🚀' });
        });
    }

    public start(): void {
        const PORT = process.env.PORT || 3001;
        this.app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
        });
    }
}

const server = new Server();
server.start();