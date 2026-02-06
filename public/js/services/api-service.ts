/**
 * ============================================
 * API SERVICE
 * Serviço centralizado para chamadas de API
 * ============================================
 */

import type { ApiResponse } from '../types/models';

/**
 * Obtém token JWT do sessionStorage
 */
export function getToken(): string | null {
    return sessionStorage.getItem('MEDICAL_CRM_TOKEN');
}

/**
 * Verifica se usuário está autenticado
 */
export function isAuthenticated(): boolean {
    return !!getToken();
}

/**
 * Redireciona para login se não autenticado
 */
export function requireAuth(): void {
    if (!isAuthenticated()) {
        alert('Sessão inválida. Faça login novamente.');
        window.location.href = '/login.html';
    }
}

/**
 * Realiza requisição GET
 */
export async function get<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Realiza requisição POST
 */
export async function post<T = unknown>(
    endpoint: string,
    data: unknown,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        },
        body: JSON.stringify(data),
        ...options,
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Realiza requisição PUT
 */
export async function put<T = unknown>(
    endpoint: string,
    data: unknown,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        },
        body: JSON.stringify(data),
        ...options,
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Realiza requisição DELETE
 */
export async function del<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();

    const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

/**
 * API específica para Leads
 */
export const LeadsAPI = {
    async getAll(): Promise<ApiResponse> {
        return get('/api/leads');
    },

    async getById(id: number): Promise<ApiResponse> {
        return get(`/api/leads/${id}`);
    },

    async create(leadData: Record<string, unknown>): Promise<ApiResponse> {
        return post('/api/leads', leadData);
    },

    async update(id: number, leadData: Record<string, unknown>): Promise<ApiResponse> {
        return put(`/api/leads/${id}`, leadData);
    },

    async delete(id: number): Promise<ApiResponse> {
        return del(`/api/leads/${id}`);
    },
};

/**
 * API específica para Configurações da Clínica
 */
export const ClinicAPI = {
    async getSettings(): Promise<ApiResponse> {
        return get('/api/clinic/settings');
    },

    async updateSettings(settings: Record<string, unknown>): Promise<ApiResponse> {
        return put('/api/clinic/settings', settings);
    },
};

/**
 * API específica para Métricas
 */
export const MetricsAPI = {
    async getDashboard(): Promise<ApiResponse> {
        return get('/api/metrics/dashboard');
    },
};
