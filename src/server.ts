// Load environment variables FIRST (before any imports)
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import leadRoutes from './routes/lead.routes'; // Importação sem chaves {} (Default)
import userRoutes from './routes/user.routes'; // Rotas de autenticação e usuários
import authRoutes from './routes/auth.routes'; // Rotas de autenticação JWT
import metricsRoutes from './routes/metrics.routes'; // Rotas de métricas
import saasRoutes from './routes/saas.routes'; // Rotas de gestão SaaS
import clinicRoutes from './routes/clinic.routes'; // Rotas de configurações da clínica
import patientRoutes from './routes/patient.routes'; // Rotas de pacientes
import prescriptionRoutes from './routes/prescription.routes'; // Rotas de receitas
import calendarRoutes from './routes/calendar.routes'; // Rotas de agendamentos
import appointmentsRoutes from './routes/appointments.routes'; // Rotas de appointments
import './database'; // Inicia o banco de dados

export class Server {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.config();
        this.routes();
    }

    private config(): void {
        // Rate Limiting for auth endpoints (production only)
        if (process.env.NODE_ENV === 'production') {
            const authLimiter = rateLimit({
                windowMs: 15 * 60 * 1000, // 15 minutos
                max: 5, // Máximo 5 tentativas
                message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
                standardHeaders: true,
                legacyHeaders: false,
            });

            // Apply rate limiting to auth routes
            this.app.use('/api/auth/login', authLimiter);
        }

        // CORS Configuration - Restricted in production
        const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',')
            : ['http://localhost:3001'];

        this.app.use(
            cors({
                origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
                methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', 'PUT'],
                allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
                credentials: true,
            })
        );

        // CSP Configuration - Permissive for MVP/Development
        this.app.use((_req, res, next) => {
            res.setHeader(
                'Content-Security-Policy',
                "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
                    "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://fonts.googleapis.com; " +
                    "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
                    "img-src 'self' data: https: http:; " +
                    "connect-src 'self' http: https: ws: wss:; " +
                    "frame-src 'self';"
            );
            next();
        });

        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../public')));
        this.app.use('/shared', express.static(path.join(__dirname, '../shared')));
    }

    private routes(): void {
        // Health Check Endpoint
        this.app.get('/health', (_req, res) => {
            res.json({
                status: 'ok',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
            });
        });

        // API Routes
        this.app.use('/api/leads', leadRoutes);
        this.app.use('/api', userRoutes); // Login e Users
        this.app.use('/api/auth', authRoutes); // JWT Authentication
        this.app.use('/api/metrics', metricsRoutes); // Metrics
        this.app.use('/api/saas', saasRoutes); // SaaS Multi-Clinic Management
        this.app.use('/api', clinicRoutes); // Clinic Settings
        this.app.use('/api/patients', patientRoutes); // Patients
        this.app.use('/api/prescriptions', prescriptionRoutes); // Prescriptions
        this.app.use('/api/calendar', calendarRoutes); // Calendar
        this.app.use('/api/appointments', appointmentsRoutes); // Appointments

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
