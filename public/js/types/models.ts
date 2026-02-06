/**
 * ============================================
 * SHARED TYPE DEFINITIONS
 * Tipos compartilhados entre o frontend
 * ============================================
 */

// ============================================
// PATIENT / LEAD TYPES
// ============================================

export type LeadStatus = 'novo' | 'em_atendimento' | 'agendado' | 'finalizado' | 'cancelado';

export type PatientStatus = 'waiting' | 'triage' | 'consultation' | 'finished';

export interface Patient {
    id: number;
    name: string;
    phone: string;
    email?: string;
    cpf?: string;
    birth_date?: string;
    insurance?: string;
    clinic_id: number;
    status: PatientStatus;
    notes?: string;
    created_at: string;
    updated_at?: string;
    deleted_at?: string | null;
}

export interface Lead {
    id: number;
    name: string;
    phone: string;
    email?: string;
    status: LeadStatus;
    source?: string;
    notes?: string;
    clinic_id: number;
    assigned_to?: number;
    appointment_date?: string;
    created_at: string;
    updated_at?: string;
    deleted_at?: string | null;
}

// ============================================
// APPOINTMENT TYPES
// ============================================

export type AppointmentStatus =
    | 'scheduled'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'no_show'
    | 'archived';

export type AppointmentType =
    | 'primeira_consulta'
    | 'retorno'
    | 'avaliacao'
    | 'procedimento'
    | 'exame'
    | 'urgencia'
    | 'teleconsulta';

export interface Appointment {
    id: number | string;
    composite_id?: string;
    patient_name?: string;
    patient_phone?: string;
    name?: string;
    phone?: string;
    email?: string;
    doctor?: string;
    type?: string;
    status: AppointmentStatus;
    start_time?: string;
    end_time?: string;
    appointment_date?: string;
    notes?: string;
    insurance?: string;
    source?: string;
    clinic_id: number;
    created_at?: string;
    updated_at?: string;
    archived_at?: string;
    deleted_at?: string | null;
}

export interface AppointmentFinancial {
    value?: number;
    paymentType?: string;
}

export interface ParsedNotes {
    cleanText: string;
    financial: AppointmentFinancial | null;
}

// ============================================
// STATUS DISPLAY
// ============================================

export interface StatusDisplay {
    label: string;
    color: string;
    icon: string;
}

// ============================================
// CLINIC TYPES
// ============================================

export type PlanTier = 'basic' | 'professional' | 'enterprise';

export interface Clinic {
    id: number;
    name: string;
    slug?: string;
    logo_url?: string;
    primary_color?: string;
    plan_tier: PlanTier;
    status: string;
    max_users: number;
    max_patients: number;
    trial_ends_at?: string;
    insurance_plans?: string[];
    created_at?: string;
}

export interface ClinicSettings {
    identity: {
        name: string;
        phone?: string;
        address?: string;
        logo?: string | null;
        primaryColor: string;
    };
    hours?: {
        opening: string;
        closing: string;
        lunchStart: string;
        lunchEnd: string;
        workingDays: string[];
    };
    insurancePlans: string[];
    chatbot?: {
        greeting: string;
        awayMessage: string;
        instructions: string;
    };
}

export interface ClinicInfo {
    id: string | null;
    name: string | null;
    slug: string | null;
    plan: string;
    status: string;
    maxUsers: number;
    maxPatients: number;
}

// ============================================
// USER TYPES
// ============================================

export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'nurse';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    clinic_id: number;
    is_active: boolean;
    created_at: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    total: number;
    page: number;
    limit: number;
}

// ============================================
// FINANCIAL TYPES
// ============================================

export type TransactionType = 'income' | 'expense';
export type PaymentMethod =
    | 'cash'
    | 'credit_card'
    | 'debit_card'
    | 'pix'
    | 'transfer'
    | 'insurance';

export interface Transaction {
    id: number;
    type: TransactionType;
    description: string;
    amount: number;
    payment_method?: PaymentMethod;
    category?: string;
    date: string;
    clinic_id: number;
    created_at: string;
}

// ============================================
// GROWTH/METRICS TYPES
// ============================================

export interface GrowthResult {
    value: number;
    formatted: string;
    isPositive: boolean;
}

// ============================================
// CACHE TYPES
// ============================================

export interface CacheItem<T = unknown> {
    value: T;
    timestamp: number;
    ttl: number;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

// ============================================
// LIMIT CHECK TYPES
// ============================================

export interface LimitCheck {
    canAdd: boolean;
    current: number;
    max: number;
}

// ============================================
// TRIAL INFO
// ============================================

export interface TrialInfo {
    daysLeft: number;
    message: string;
    urgent: boolean;
}

// ============================================
// PLAN BADGE CONFIG
// ============================================

export interface PlanBadgeConfig {
    label: string;
    color: string;
    icon: string;
}

// ============================================
// WINDOW GLOBAL EXTENSIONS
// ============================================

declare global {
    interface Window {
        // Formatters
        formatTime: (dateString: string | Date) => string;
        formatDateTime: (dateString: string | Date) => string;
        formatDate: (dateString: string | Date) => string;
        formatDateNumeric: (dateString: string | Date) => string;
        formatDateFull: (dateString: string | Date) => string;
        formatDateShort: (dateString: string | Date) => string;
        formatDateTimeShort: (dateString: string | Date) => string;
        formatCurrency: (value: number | string) => string;
        formatPhone: (phone: string) => string;
        formatText: (text: string) => string;
        getTimeAgo: (dateString: string | Date) => string;

        // Masks
        maskCurrency: (value: string) => string;
        maskPhone: (value: string) => string;
        parseCurrency: (value: string | number) => number;
        parsePhone: (value: string) => string;
        formatCurrencyValue: (value: number | string) => string;
        formatPhoneNumber: (phone: string) => string;
        initMaskDelegation: () => void;
        applyMasksToExistingInputs: () => void;

        // Services
        ClinicService?: typeof import('../services/clinic-service').ClinicService;
        AppointmentsService: typeof import('../services/appointments-service').AppointmentsService;

        // Global functions from appointments-service
        confirmAppointment: (id: string | number) => Promise<void>;
        archiveAppointment: (id: string | number) => Promise<void>;
        deleteAppointment: (id: string | number) => Promise<void>;
        completeAppointment: (id: string | number) => Promise<void>;
        markNoShow: (id: string | number) => Promise<void>;
        openViewModal: (id: string | number) => Promise<void>;
        closeViewModal: () => void;
        editAppointmentFromView: () => void;
        confirmAppointmentFromView: () => void;
        openWhatsAppFromView: () => void;
        archiveAppointmentFromView: () => void;
        deleteAppointmentFromView: () => void;
        openArchivedModal: () => Promise<void>;
        closeArchivedModal: () => void;
        searchArchivedAppointments: (term: string) => void;
        loadArchivedAppointments: (search?: string) => Promise<void>;
        restoreAppointment: (id: string) => Promise<void>;
        permanentlyDeleteAppointment: (id: string) => Promise<void>;

        // Calendar / Agenda
        calendar?: { refetchEvents: () => void };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        openEditModal?: (...args: any[]) => void;
        loadAgenda?: () => void;
        closeEditModal?: () => void;

        // Shared UI globals (declared here to avoid merge conflicts)
        API_URL?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        openConfirmationQueue?: (...args: any[]) => void;
        closeConfirmationQueue?: () => void;
        logout?: () => void;
        loadLeads?: () => void;
        deleteLead?: (id: number | string) => void;
        ThemeManager?: { toggle: () => void };
    }
}
