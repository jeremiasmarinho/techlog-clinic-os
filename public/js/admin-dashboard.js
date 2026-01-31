/**
 * ============================================
 * ADMIN DASHBOARD - MAIN ENTRY POINT
 * Arquivo principal modular do dashboard
 * ============================================
 */

// Services
import { requireAuth, LeadsAPI } from './services/api-service.js';
import * as CacheService from './services/cache-service.js';
import * as NotificationService from './services/notification-service.js';

// Components
import { calculateMetrics } from './components/metrics-calculator.js';
import { renderMetrics, clearMetrics } from './components/metrics-renderer.js';
import * as ConfirmationModal from './components/confirmation-modal.js';

// Global state
let allLeads = [];

/**
 * Inicializa o dashboard
 */
async function init() {
    console.log('🚀 Initializing Admin Dashboard...');
    
    // Verificar autenticação
    requireAuth();
    
    // Inicializar serviços
    NotificationService.init();
    
    // Carregar dados
    await loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Admin Dashboard initialized');
}

/**
 * Carrega dados do dashboard
 */
async function loadDashboardData() {
    try {
        showLoading();
        
        // Usar cache ou buscar da API
        allLeads = await CacheService.getOrFetch(
            'leads-data',
            () => LeadsAPI.getAll(),
            2 * 60 * 1000 // 2 minutos de cache
        );
        
        console.log(`📊 Loaded ${allLeads.length} leads`);
        
        // Calcular e renderizar métricas
        updateMetrics(allLeads);
        
        hideLoading();
        
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        NotificationService.error('Erro ao carregar dados do dashboard');
        clearMetrics();
        hideLoading();
    }
}

/**
 * Atualiza métricas do dashboard
 * @param {Array} leads - Lista de leads
 */
function updateMetrics(leads) {
    if (!leads || !Array.isArray(leads)) {
        console.warn('⚠️ Invalid leads data');
        clearMetrics();
        return;
    }
    
    try {
        // Calcular métricas
        const metrics = calculateMetrics(leads);
        console.log('📊 Metrics calculated:', metrics);
        
        // Renderizar no DOM
        renderMetrics(metrics);
        
        // Armazenar globalmente para kanban
        window.allLeads = leads;
        window.dashboardMetrics = metrics;
        
        console.log('✅ Metrics updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating metrics:', error);
        clearMetrics();
    }
}

/**
 * Configura event listeners
 */
function setupEventListeners() {
    // Botão de refresh
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            CacheService.clear();
            await loadDashboardData();
            NotificationService.success('Dashboard atualizado!');
        });
    }
    
    // Click fora do modal fecha
    const modal = document.getElementById('confirmationQueueModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                ConfirmationModal.close();
            }
        });
    }
    
    // ESC fecha modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            ConfirmationModal.close();
        }
    });
}

/**
 * Mostra indicador de loading
 */
function showLoading() {
    const cards = document.querySelectorAll('[data-metric-card]');
    cards.forEach(card => {
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';
    });
}

/**
 * Esconde indicador de loading
 */
function hideLoading() {
    const cards = document.querySelectorAll('[data-metric-card]');
    cards.forEach(card => {
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
    });
}

/**
 * Força atualização das métricas (chamado externamente)
 */
export function refreshMetrics() {
    if (window.allLeads && Array.isArray(window.allLeads)) {
        updateMetrics(window.allLeads);
    } else {
        loadDashboardData();
    }
}

// Expor funções globalmente para compatibilidade
if (typeof window !== 'undefined') {
    window.refreshDashboardMetrics = refreshMetrics;
    window.openConfirmationQueue = ConfirmationModal.open;
    window.closeConfirmationQueue = ConfirmationModal.close;
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export para uso em outros módulos
export { init, loadDashboardData, updateMetrics, refreshMetrics };
