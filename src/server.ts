// Load environment variables FIRST (before any imports)
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import helmet from 'helmet';
import leadRoutes from './routes/lead.routes'; // Importação sem chaves {} (Default)
import userRoutes from './routes/user.routes'; // Rotas de autenticação e usuários
import authRoutes from './routes/auth.routes'; // Rotas de autenticação JWT
import { errorHandler, notFoundHandler } from './middleware/error.middleware'; // Error handlers
import metricsRoutes from './routes/metrics.routes'; // Rotas de métricas
import saasRoutes from './routes/saas.routes'; // Rotas de gestão SaaS
import clinicRoutes from './routes/clinic.routes'; // Rotas de configurações da clínica
import prescriptionRoutes from './routes/prescription.routes'; // Rotas de receitas
import calendarRoutes from './routes/calendar.routes'; // Rotas de agendamentos
import appointmentsRoutes from './routes/appointments.routes'; // Rotas de appointments
import financialRoutes from './routes/financial.routes'; // Rotas financeiras
import './database'; // Inicia o banco de dados

export class Server {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.config();
        this.routes();
    }

    private config(): void {
        // ====================================================================
        // SECURITY MIDDLEWARE (Helmet) - Production only for full config
        // ====================================================================
        if (process.env.NODE_ENV === 'production') {
            this.app.use(
                helmet({
                    contentSecurityPolicy: false, // We configure CSP manually below
                    crossOriginEmbedderPolicy: false, // Allow loading external resources
                })
            );
        }

        // ====================================================================
        // COMPRESSION MIDDLEWARE - Compress responses for better performance
        // ====================================================================
        this.app.use(
            compression({
                filter: (req, res) => {
                    // Don't compress if client doesn't accept gzip
                    if (req.headers['x-no-compression']) {
                        return false;
                    }
                    // Use compression's default filter
                    return compression.filter(req, res);
                },
                level: 6, // Compression level (1-9, 6 is good balance)
                threshold: 1024, // Only compress responses larger than 1KB
            })
        );

        // ====================================================================
        // RATE LIMITING - Protect against abuse
        // ====================================================================
        const isProduction = process.env.NODE_ENV === 'production';

        // Strict rate limit for authentication endpoints
        const authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutos
            max: isProduction ? 5 : 100, // Strict in production, relaxed in dev
            message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
            standardHeaders: true,
            legacyHeaders: false,
            skip: () => process.env.NODE_ENV === 'test', // Skip in tests
        });

        // General rate limit for all API endpoints
        const apiLimiter = rateLimit({
            windowMs: 1 * 60 * 1000, // 1 minuto
            max: isProduction ? 100 : 1000, // 100 requests/min in prod, 1000 in dev
            message: { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
            standardHeaders: true,
            legacyHeaders: false,
            skip: () => process.env.NODE_ENV === 'test', // Skip in tests
        });

        // Apply rate limiting
        this.app.use('/api/auth/login', authLimiter);
        this.app.use('/api', apiLimiter);

        // ====================================================================
        // CORS Configuration - Restricted in production
        // ====================================================================
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

        // ====================================================================
        // CSP Configuration - Permissive for MVP/Development
        // ====================================================================
        this.app.use((_req, res, next) => {
            res.setHeader(
                'Content-Security-Policy',
                "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com; " +
                    "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com; " +
                    "font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
                    "img-src 'self' data: blob: https: http:; " +
                    "connect-src 'self' http: https: ws: wss:; " +
                    "frame-src 'self';"
            );
            next();
        });

        // ====================================================================
        // BODY PARSING & STATIC FILES
        // ====================================================================
        this.app.use(express.json({ limit: '10mb' })); // Limit JSON body size
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use(express.static(path.join(__dirname, '../public')));
        this.app.use('/shared', express.static(path.join(__dirname, '../shared')));
        this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
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

        // Debug PDF Test Endpoint (temporary - remove in production)
        this.app.get('/debug/pdf-test', async (_req, res) => {
            try {
                const { PrescriptionPdfService } =
                    await import('./services/PrescriptionPdfService');
                const buffer = await PrescriptionPdfService.generateTestPdfBuffer();

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', 'inline; filename="font-test.pdf"');
                res.send(buffer);
            } catch (error) {
                console.error('Erro ao gerar PDF de teste:', error);
                res.status(500).json({
                    error: 'Erro ao gerar PDF de teste',
                    message: error instanceof Error ? error.message : 'Erro desconhecido',
                    stack:
                        process.env.NODE_ENV === 'development'
                            ? error instanceof Error
                                ? error.stack
                                : undefined
                            : undefined,
                });
            }
        });

        // API Routes
        this.app.use('/api/leads', leadRoutes);
        this.app.use('/api', userRoutes); // Users CRUD (login removido - ver authRoutes)
        this.app.use('/api/auth', authRoutes); // JWT Authentication (guardião único)

        // Alias: /api/login -> /api/auth/login (compatibilidade)
        this.app.post('/api/login', (req, res, next) => {
            // Redireciona para o AuthController
            req.url = '/login';
            authRoutes(req, res, next);
        });

        this.app.use('/api/metrics', metricsRoutes); // Metrics
        this.app.use('/api/saas', saasRoutes); // SaaS Multi-Clinic Management
        this.app.use('/api', clinicRoutes); // Clinic Settings
        this.app.use('/api/prescriptions', prescriptionRoutes); // Prescriptions
        this.app.use('/api/calendar', calendarRoutes); // Calendar
        this.app.use('/api/appointments', appointmentsRoutes); // Appointments
        this.app.use('/api/financial', financialRoutes); // Financial

        // Rota de Teste (Usando _req para o TypeScript não reclamar)
        this.app.get('/api', (_req, res) => {
            res.json({ message: 'Medical CRM API Online 🚀' });
        });

        // Error Handlers - DEVEM ser os últimos middlewares
        this.app.use(notFoundHandler); // 404 para rotas não encontradas
        this.app.use(errorHandler); // Handler global de erros
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
