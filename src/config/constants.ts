/**
 * ============================================================================
 * CONSTANTES CENTRALIZADAS - TechLog Clinic OS
 * ============================================================================
 *
 * TODAS as constantes do sistema devem estar aqui.
 * NUNCA hardcode valores em outros arquivos.
 *
 * @usage import { APP_CONFIG, PATIENT_STATUSES } from '../config/constants';
 */

// ============================================================================
// APP CONFIG
// ============================================================================

export const APP_CONFIG = {
    NAME: 'TechLog Clinic OS',
    VERSION: '1.0.0',
    DEFAULT_CLINIC_ID: 1,
    TOKEN_EXPIRY: '8h',
    SALT_ROUNDS: 10,
    RATE_LIMIT: {
        MAX_ATTEMPTS: 5,
        LOCKOUT_TIME_MS: 15 * 60 * 1000, // 15 minutos
    },
    CACHE: {
        DEFAULT_TTL_MS: 5 * 60 * 1000, // 5 minutos
        LEADS_TTL_MS: 2 * 60 * 1000, // 2 minutos
    },
} as const;

// ============================================================================
// STORAGE KEYS
// ============================================================================

export const CACHE_KEYS = {
    TOKEN: 'MEDICAL_CRM_TOKEN',
    USER: 'MEDICAL_CRM_USER',
    CLINIC: 'MEDICAL_CRM_CLINIC',
    LEADS_CACHE: 'leads-data',
} as const;

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    SERVER_ERROR: 500,
} as const;

// ============================================================================
// PATIENT STATUSES (Kanban)
// ============================================================================

export const PATIENT_STATUSES = {
    WAITING: 'waiting',
    TRIAGE: 'triage',
    CONSULTATION: 'consultation',
    FINISHED: 'finished',
} as const;

export const PATIENT_STATUS_VALUES = Object.values(PATIENT_STATUSES);
export type PatientStatus = (typeof PATIENT_STATUSES)[keyof typeof PATIENT_STATUSES];

export const PATIENT_STATUS_LABELS: Record<PatientStatus, string> = {
    [PATIENT_STATUSES.WAITING]: 'Aguardando',
    [PATIENT_STATUSES.TRIAGE]: 'Triagem',
    [PATIENT_STATUSES.CONSULTATION]: 'Em Consulta',
    [PATIENT_STATUSES.FINISHED]: 'Finalizado',
};

// ============================================================================
// LEAD STATUSES (CRM)
// ============================================================================

export const LEAD_STATUSES = {
    NEW: 'novo',
    IN_PROGRESS: 'em_atendimento',
    SCHEDULED: 'agendado',
    FINISHED: 'finalizado',
    ARCHIVED: 'archived',
} as const;

export const LEAD_STATUS_VALUES = Object.values(LEAD_STATUSES);
export type LeadStatus = (typeof LEAD_STATUSES)[keyof typeof LEAD_STATUSES];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
    [LEAD_STATUSES.NEW]: 'Novo',
    [LEAD_STATUSES.IN_PROGRESS]: 'Em Atendimento',
    [LEAD_STATUSES.SCHEDULED]: 'Agendado',
    [LEAD_STATUSES.FINISHED]: 'Finalizado',
    [LEAD_STATUSES.ARCHIVED]: 'Arquivado',
};

// ============================================================================
// USER ROLES
// ============================================================================

export const USER_ROLES = {
    SUPER_ADMIN: 'super_admin',
    CLINIC_ADMIN: 'clinic_admin',
    ADMIN: 'admin',
    STAFF: 'staff',
    RECEPCAO: 'recepcao',
} as const;

export const USER_ROLE_VALUES = Object.values(USER_ROLES);
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// ============================================================================
// CLINIC STATUS & PLANS
// ============================================================================

export const CLINIC_STATUSES = {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    TRIAL: 'trial',
    CANCELLED: 'cancelled',
} as const;

export const CLINIC_PLANS = {
    BASIC: 'basic',
    PROFESSIONAL: 'professional',
    ENTERPRISE: 'enterprise',
} as const;

export const PLAN_LIMITS: Record<string, { maxUsers: number; maxPatients: number }> = {
    [CLINIC_PLANS.BASIC]: { maxUsers: 5, maxPatients: 1000 },
    [CLINIC_PLANS.PROFESSIONAL]: { maxUsers: 15, maxPatients: 5000 },
    [CLINIC_PLANS.ENTERPRISE]: { maxUsers: 999, maxPatients: 999999 },
};

// ============================================================================
// FRONTEND ROUTES
// ============================================================================

export const ROUTES = {
    LOGIN: '/login.html',
    ADMIN: '/admin.html',
    KANBAN: '/kanban.html',
    AGENDA: '/agenda.html',
    PATIENTS: '/patients.html',
    SETTINGS: '/settings.html',
    SAAS_ADMIN: '/saas-admin.html',
} as const;

// ============================================================================
// API ENDPOINTS
// ============================================================================

export const API_ENDPOINTS = {
    HEALTH: '/health',

    AUTH: {
        LOGIN: '/api/auth/login',
        LOGOUT: '/api/auth/logout',
        REFRESH: '/api/auth/refresh',
    },

    USERS: {
        BASE: '/api/users',
        BY_ID: (id: number) => `/api/users/${id}`,
        LOGIN: '/api/login', // Legacy endpoint
    },

    LEADS: {
        BASE: '/api/leads',
        BY_ID: (id: number) => `/api/leads/${id}`,
        DASHBOARD: '/api/leads/dashboard',
        ARCHIVE: (id: number) => `/api/leads/${id}/archive`,
        UNARCHIVE: (id: number) => `/api/leads/${id}/unarchive`,
    },

    PATIENTS: {
        BASE: '/api/patients',
        BY_ID: (id: number) => `/api/patients/${id}`,
        STATUS: (id: number) => `/api/patients/${id}/status`,
        HISTORY: (id: number) => `/api/patients/${id}/history`,
        FINISH: (id: number) => `/api/patients/${id}/finish`,
    },

    CALENDAR: {
        BASE: '/api/calendar',
        APPOINTMENTS: '/api/calendar/appointments',
    },

    APPOINTMENTS: {
        BASE: '/api/appointments',
        BY_ID: (id: number) => `/api/appointments/${id}`,
    },

    CLINIC: {
        SETTINGS: '/api/clinic/settings',
        INFO: '/api/clinic-info',
    },

    PRESCRIPTIONS: {
        BASE: '/api/prescriptions',
        BY_ID: (id: number) => `/api/prescriptions/${id}`,
        PDF: (id: number) => `/api/prescriptions/${id}/pdf`,
    },

    METRICS: {
        BASE: '/api/metrics',
        DASHBOARD: '/api/metrics/dashboard',
    },

    SAAS: {
        CLINICS: '/api/saas/clinics',
        USERS: '/api/saas/users',
        STATS: '/api/saas/stats',
    },

    FINANCIAL: {
        BASE: '/api/financial',
        SUMMARY: '/api/financial/summary',
    },
} as const;

// ============================================================================
// ERROR MESSAGES (Portuguese)
// ============================================================================

export const ERROR_MESSAGES = {
    AUTH: {
        TOKEN_MISSING: 'Token de autenticação não fornecido',
        TOKEN_INVALID: 'Token inválido ou expirado',
        CREDENTIALS_INVALID: 'Credenciais inválidas',
        SESSION_EXPIRED: 'Sessão expirada. Faça login novamente.',
        TOO_MANY_ATTEMPTS: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
        EMAIL_PASSWORD_REQUIRED: 'E-mail e senha são obrigatórios',
    },

    CLINIC: {
        NOT_FOUND: 'Clínica não identificada',
        SUSPENDED: 'Clínica suspensa ou inativa. Entre em contato com o suporte.',
        LIMIT_USERS: 'Limite de usuários atingido para este plano',
        LIMIT_PATIENTS: 'Limite de pacientes atingido para este plano',
    },

    PATIENT: {
        NOT_FOUND: 'Paciente não encontrado',
        INVALID_STATUS: 'Status inválido',
        INVALID_ID: 'ID de paciente inválido',
    },

    LEAD: {
        NOT_FOUND: 'Lead não encontrado',
        INVALID_DATA: 'Dados do lead inválidos',
    },

    USER: {
        NOT_FOUND: 'Usuário não encontrado',
        USERNAME_EXISTS: 'Este nome de usuário já está em uso',
        INVALID_ROLE: 'Role de usuário inválido',
    },

    APPOINTMENT: {
        NOT_FOUND: 'Agendamento não encontrado',
        CONFLICT: 'Já existe um agendamento neste horário',
        PAST_DATE: 'Não é possível agendar para uma data passada',
    },

    GENERAL: {
        SERVER_ERROR: 'Erro interno do servidor',
        VALIDATION_ERROR: 'Erro de validação',
        NOT_FOUND: 'Recurso não encontrado',
        FORBIDDEN: 'Acesso negado',
        BAD_REQUEST: 'Requisição inválida',
    },
} as const;

// ============================================================================
// SUCCESS MESSAGES (Portuguese)
// ============================================================================

export const SUCCESS_MESSAGES = {
    PATIENT: {
        CREATED: 'Paciente cadastrado com sucesso',
        UPDATED: 'Paciente atualizado com sucesso',
        DELETED: 'Paciente removido com sucesso',
        STATUS_UPDATED: 'Status atualizado com sucesso',
    },

    LEAD: {
        CREATED: 'Lead cadastrado com sucesso',
        UPDATED: 'Lead atualizado com sucesso',
        ARCHIVED: 'Lead arquivado com sucesso',
        UNARCHIVED: 'Lead restaurado com sucesso',
    },

    APPOINTMENT: {
        CREATED: 'Agendamento criado com sucesso',
        UPDATED: 'Agendamento atualizado com sucesso',
        CANCELLED: 'Agendamento cancelado com sucesso',
    },

    AUTH: {
        LOGIN_SUCCESS: 'Login realizado com sucesso',
        LOGOUT_SUCCESS: 'Logout realizado com sucesso',
    },
} as const;

// ============================================================================
// DATE/TIME FORMATS
// ============================================================================

export const DATE_FORMATS = {
    API: 'YYYY-MM-DD',
    API_DATETIME: 'YYYY-MM-DDTHH:mm:ss',
    DISPLAY: 'DD/MM/YYYY',
    DISPLAY_DATETIME: 'DD/MM/YYYY HH:mm',
    DISPLAY_TIME: 'HH:mm',
} as const;

// ============================================================================
// PAGINATION DEFAULTS
// ============================================================================

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PER_PAGE: 20,
    MAX_PER_PAGE: 100,
} as const;
