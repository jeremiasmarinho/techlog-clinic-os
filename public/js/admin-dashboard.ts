/**
 * Admin Dashboard - Painel de Métricas e KPIs
 * ES Module com imports dos services e componentes existentes
 */

import { requireAuth } from './services/api-service.js';
import * as CacheService from './services/cache-service.js';
import * as NotificationService from './services/notification-service.js';
import { calculateMetrics } from './components/metrics-calculator.js';

// Tipos locais
interface Lead {
    id: number;
    name: string;
    phone?: string;
    status: string;
    type?: string;
    created_at?: string;
    appointment_date?: string;
    [key: string]: unknown;
}

interface DashboardMetrics {
    total: number;
    byStatus: Record<string, number>;
    conversionRate: number;
    [key: string]: unknown;
}

declare global {
    interface Window {
        refreshDashboardMetrics: () => Promise<void>;
    }
}

// Estado do módulo
let leads: Lead[] = [];
let metrics: DashboardMetrics | null = null;

/**
 * Inicializa o dashboard
 */
async function init(): Promise<void> {
    requireAuth();
    setupEventListeners();
    await loadDashboardData();
}

/**
 * Carrega dados do dashboard via API
 */
async function loadDashboardData(): Promise<void> {
    showLoading();

    try {
        // Tenta cache primeiro
        const cached = CacheService.get<Lead[]>('dashboard_leads');
        if (cached) {
            leads = cached;
            updateMetrics(leads);
            hideLoading();
            return;
        }

        const token =
            sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('accessToken');

        const response = await fetch('/api/appointments', {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        leads = Array.isArray(data) ? data : data.appointments || [];

        // Salva no cache (5 minutos)
        CacheService.set('dashboard_leads', leads, 5 * 60 * 1000);

        updateMetrics(leads);
    } catch (error) {
        NotificationService.error('Erro ao carregar dados do dashboard');
    } finally {
        hideLoading();
    }
}

/**
 * Atualiza métricas baseado nos leads
 */
function updateMetrics(leadsList: Lead[]): void {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metrics = calculateMetrics(leadsList as any) as unknown as DashboardMetrics;
        renderMetrics(metrics);
    } catch (error) {
        clearMetrics();
    }
}

/**
 * Renderiza métricas no DOM
 */
function renderMetrics(_metrics: DashboardMetrics): void {
    // Rendering handled by page template
}

/**
 * Limpa display de métricas
 */
function clearMetrics(): void {
    // Clear handled by page template
}

/**
 * Configura event listeners
 */
function setupEventListeners(): void {
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => refreshMetrics());
    }

    const periodSelector = document.getElementById('dashboardPeriod') as HTMLSelectElement | null;
    if (periodSelector) {
        periodSelector.addEventListener('change', () => loadDashboardData());
    }
}

/**
 * Mostra indicador de carregamento
 */
function showLoading(): void {
    const loader = document.getElementById('dashboardLoader');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

/**
 * Esconde indicador de carregamento
 */
function hideLoading(): void {
    const loader = document.getElementById('dashboardLoader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

/**
 * Atualiza métricas (recarrega do servidor)
 */
async function refreshMetrics(): Promise<void> {
    CacheService.remove('dashboard_leads');
    await loadDashboardData();
    NotificationService.success('Dashboard atualizado!');
}

// Inicializar no DOM ready
document.addEventListener('DOMContentLoaded', () => {
    init();
});

// Exportar para uso externo e expor globalmente
export { refreshMetrics };

window.refreshDashboardMetrics = refreshMetrics;
window.openConfirmationQueue = function (): void {
    const modal = document.getElementById('confirmationQueueModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};
window.closeConfirmationQueue = function (): void {
    const modal = document.getElementById('confirmationQueueModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};
