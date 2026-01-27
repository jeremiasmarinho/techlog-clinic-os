import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import leadRoutes from './routes/lead.routes'; // Importação sem chaves {} (Default)
import userRoutes from './routes/user.routes'; // Rotas de autenticação e usuários
import authRoutes from './routes/auth.routes'; // Rotas de autenticação JWT
import './database'; // Inicia o banco de dados

// Load environment variables
dotenv.config();

export class Server {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.config();
        this.routes();
    }

    private config(): void {
        // CORS Configuration - Restricted in production
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',') 
            : ['http://localhost:3001'];
        
        this.app.use(cors({
            origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
            methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
            allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
            credentials: true
        }));

        // CSP Configuration - Permissive for MVP/Development
        this.app.use((_req, res, next) => {
            res.setHeader(
                'Content-Security-Policy',
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
                "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://fonts.googleapis.com; " +
                "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
                "img-src 'self' data: https: http:; " +
                "connect-src 'self' http://localhost:3001 ws://localhost:3001; " +
                "frame-src 'self';"
            );
            next();
        });

        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../public')));
    }

    private routes(): void {
        // API Routes
        this.app.use('/api/leads', leadRoutes);
        this.app.use('/api', userRoutes); // Login e Users
        this.app.use('/api/auth', authRoutes); // JWT Authentication

        // Rota de Teste (Usando _req para o TypeScript não reclamar)
        this.app.get('/api', (_req, res) => {
            res.json({ message: 'Medical CRM API Online 🚀' });
        });
    }

    public start(): void {
        const PORT = process.env.PORT || 3001;
        this.app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
        });
    }
}

const server = new Server();
server.start();