/**
 * Shared TypeScript Types and Interfaces
 * These types are used across the frontend application
 */

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
    meta?: {
        page?: number;
        perPage?: number;
        total?: number;
    };
}

// ============================================
// Patient Types
// ============================================

export type PatientStatus = 'waiting' | 'triage' | 'consultation' | 'finished';

export interface Patient {
    id: number;
    name: string;
    phone: string;
    email?: string;
    cpf?: string;
    birth_date?: string;
    clinic_id: number;
    status: PatientStatus;
    notes?: string;
    created_at: string;
    updated_at?: string;
    deleted_at?: string;
}

// ============================================
// Lead Types
// ============================================

export type LeadStatus = 'novo' | 'em_atendimento' | 'agendado' | 'finalizado' | 'archived';

export interface Lead {
    id: number;
    name: string;
    phone: string;
    email?: string;
    type?: string;
    status: LeadStatus;
    clinic_id: number;
    notes?: string;
    created_at: string;
    updated_at?: string;
}

// ============================================
// Appointment Types
// ============================================

export interface Appointment {
    id: number;
    patient_id: number;
    clinic_id: number;
    doctor_name?: string;
    appointment_date: string;
    appointment_time: string;
    duration?: number;
    notes?: string;
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
    created_at: string;
    updated_at?: string;
}

// ============================================
// User Types
// ============================================

export interface User {
    id: number;
    username: string;
    email?: string;
    clinic_id: number;
    role: 'admin' | 'user' | 'superadmin';
    created_at: string;
    updated_at?: string;
}

// ============================================
// Clinic Types
// ============================================

export interface Clinic {
    id: number;
    name: string;
    cnpj?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    status: 'active' | 'suspended' | 'inactive';
    created_at: string;
    updated_at?: string;
}

// ============================================
// Metrics Types
// ============================================

export interface DashboardMetrics {
    total_leads: number;
    new_leads: number;
    in_progress_leads: number;
    scheduled_leads: number;
    finished_leads: number;
    conversion_rate?: number;
    [key: string]: number | undefined;
}

// ============================================
// Cache Types
// ============================================

export interface CacheOptions {
    ttl?: number; // Time to live in milliseconds
    key: string;
}

// ============================================
// Form Types
// ============================================

export interface FormField {
    name: string;
    value: string | number | boolean;
    type?: 'text' | 'number' | 'email' | 'tel' | 'date' | 'select' | 'textarea';
    required?: boolean;
    validation?: (value: any) => boolean | string;
}

// ============================================
// Table Types
// ============================================

export interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    formatter?: (value: any, row: any) => string;
}

export interface PaginationInfo {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
}

// ============================================
// Notification Types
// ============================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id?: string;
    type: NotificationType;
    message: string;
    duration?: number;
    action?: {
        label: string;
        callback: () => void;
    };
}

// ============================================
// Theme Types
// ============================================

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
    mode: ThemeMode;
    primaryColor?: string;
    secondaryColor?: string;
}
