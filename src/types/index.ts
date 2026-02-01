/**
 * ============================================================================
 * TypeScript Types & Interfaces - SaaS Multi-Tenant
 * ============================================================================
 *
 * Definições de tipos para o sistema multi-tenant
 */

// ============================================================================
// CLINIC TYPES
// ============================================================================

export type ClinicPlanTier = 'basic' | 'professional' | 'enterprise';
export type ClinicStatus = 'active' | 'suspended' | 'trial' | 'cancelled';

export interface Clinic {
    id: number;
    name: string;
    slug: string;
    owner_id: number | null;
    plan_tier: ClinicPlanTier;
    status: ClinicStatus;
    max_users: number;
    max_patients: number;
    trial_ends_at: string | null;
    subscription_started_at: string;
    subscription_ends_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ClinicCreateInput {
    name: string;
    slug: string;
    owner_id?: number;
    plan_tier?: ClinicPlanTier;
    status?: ClinicStatus;
    max_users?: number;
    max_patients?: number;
}

export interface ClinicUpdateInput {
    name?: string;
    slug?: string;
    owner_id?: number;
    plan_tier?: ClinicPlanTier;
    status?: ClinicStatus;
    max_users?: number;
    max_patients?: number;
    trial_ends_at?: string | null;
    subscription_ends_at?: string | null;
}

// ============================================================================
// USER TYPES
// ============================================================================

export type UserRole = 'super_admin' | 'admin' | 'recepcao' | 'staff';

export interface User {
    id: number;
    name: string;
    username: string;
    password: string; // Hashed
    clinic_id: number | null;
    role: UserRole;
    is_owner: number; // 0 or 1 (SQLite boolean)
    created_at: string;
    updated_at: string;
}

export interface UserCreateInput {
    name: string;
    username: string;
    password: string;
    clinic_id: number;
    role?: UserRole;
    is_owner?: number;
}

export interface UserUpdateInput {
    name?: string;
    username?: string;
    password?: string;
    clinic_id?: number;
    role?: UserRole;
    is_owner?: number;
}

export interface UserPublic {
    id: number;
    name: string;
    username: string;
    email: string; // Alias for username
    clinic_id: number | null;
    role: UserRole;
    is_owner: boolean;
}

// ============================================================================
// LEAD TYPES
// ============================================================================

export type LeadStatus = 'novo' | 'em_atendimento' | 'agendado' | 'finalizado' | 'archived';
export type LeadType = 'geral' | 'primeira_consulta' | 'retorno' | 'urgencia' | 'rotina';
export type AttendanceStatus = 'aguardando' | 'em_atendimento' | 'atendido' | 'ausente';

export interface Lead {
    id: number;
    clinic_id: number;
    name: string;
    phone: string;
    type: LeadType;
    status: LeadStatus;
    created_at: string;
    appointment_date: string | null;
    doctor: string | null;
    notes: string | null;
    attendance_status: AttendanceStatus | null;
    archive_reason: string | null;
    source: string;
    value: number;
    updated_at: string | null;
    status_updated_at: string | null;
}

export interface LeadCreateInput {
    clinic_id: number;
    name: string;
    phone: string;
    type?: LeadType;
    status?: LeadStatus;
    appointment_date?: string;
    doctor?: string;
    notes?: string;
    source?: string;
    value?: number;
}

export interface LeadUpdateInput {
    name?: string;
    phone?: string;
    type?: LeadType;
    status?: LeadStatus;
    appointment_date?: string;
    doctor?: string;
    notes?: string;
    attendance_status?: AttendanceStatus;
    archive_reason?: string;
    source?: string;
    value?: number;
}

// ============================================================================
// PATIENT TYPES
// ============================================================================

export type PatientStatus = 'active' | 'inactive' | 'archived';
export type PatientGender = 'male' | 'female' | 'other';

export interface Patient {
    id: number;
    clinic_id: number;
    name: string;
    email: string | null;
    phone: string | null;
    cpf: string | null;
    birth_date: string | null;
    gender: PatientGender | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    notes: string | null;
    status: PatientStatus;
    created_at: string;
    updated_at: string;
}

export interface PatientCreateInput {
    clinic_id: number;
    name: string;
    email?: string;
    phone?: string;
    cpf?: string;
    birth_date?: string;
    gender?: PatientGender;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    notes?: string;
    status?: PatientStatus;
}

export interface PatientUpdateInput {
    name?: string;
    email?: string;
    phone?: string;
    cpf?: string;
    birth_date?: string;
    gender?: PatientGender;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    notes?: string;
    status?: PatientStatus;
}

// ============================================================================
// APPOINTMENT TYPES
// ============================================================================

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type AppointmentType = 'consulta' | 'retorno' | 'exame' | 'cirurgia' | 'emergencia';

export interface Appointment {
    id: number;
    clinic_id: number;
    patient_id: number;
    lead_id: number | null;
    doctor: string | null;
    appointment_date: string;
    duration_minutes: number;
    type: AppointmentType;
    status: AppointmentStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface AppointmentCreateInput {
    clinic_id: number;
    patient_id: number;
    lead_id?: number;
    doctor?: string;
    appointment_date: string;
    duration_minutes?: number;
    type?: AppointmentType;
    status?: AppointmentStatus;
    notes?: string;
}

export interface AppointmentUpdateInput {
    patient_id?: number;
    lead_id?: number;
    doctor?: string;
    appointment_date?: string;
    duration_minutes?: number;
    type?: AppointmentType;
    status?: AppointmentStatus;
    notes?: string;
}

// ============================================================================
// KANBAN COLUMN TYPES
// ============================================================================

export interface KanbanColumn {
    id: number;
    clinic_id: number;
    name: string;
    slug: string;
    position: number;
    color: string;
    is_default: number; // 0 or 1 (SQLite boolean)
    created_at: string;
    updated_at: string;
}

export interface KanbanColumnCreateInput {
    clinic_id: number;
    name: string;
    slug: string;
    position: number;
    color?: string;
    is_default?: number;
}

export interface KanbanColumnUpdateInput {
    name?: string;
    slug?: string;
    position?: number;
    color?: string;
    is_default?: number;
}

// ============================================================================
// JWT TOKEN TYPES
// ============================================================================

export interface JWTPayload {
    userId: number;
    username: string;
    name: string;
    role: UserRole;
    clinicId: number | null;
    isOwner: boolean;
    iat?: number;
    exp?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ============================================================================
// REQUEST TYPES (Express)
// ============================================================================

export interface AuthenticatedRequest {
    user?: {
        userId: number;
        username: string;
        name: string;
        role: UserRole;
        clinicId: number | null;
        isOwner: boolean;
    };
}

// ============================================================================
// TENANT CONTEXT TYPE
// ============================================================================

export interface TenantContext {
    clinicId: number;
    clinic: Clinic;
    user: UserPublic;
    permissions: {
        canManageUsers: boolean;
        canManageSettings: boolean;
        canViewAnalytics: boolean;
        canExportData: boolean;
    };
}
