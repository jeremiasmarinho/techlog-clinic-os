/**
 * Super Admin Dashboard
 *
 * Sistema de gerenciamento de clínicas com design tech/dark glassmorphism
 * - KPI Dashboard: MRR, Clínicas Ativas, Pacientes, Crescimento
 * - Tabela de clínicas com ações de bloqueio/desbloqueio
 * - Login As (Impersonate) para suporte
 *
 * @author Super Admin
 * @date 2026-02-01
 */

const API_BASE = '/api/saas';
let currentClinics = [];
let currentStats = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    setupEventListeners();
});

async function initializeDashboard() {
    showLoading(true);

    try {
        // Load all data in parallel
        await Promise.all([loadSystemStats(), loadClinics()]);

        showLoading(false);
    } catch (error) {
        console.error('❌ Erro ao inicializar dashboard:', error);
        showNotification('Erro ao carregar dados do sistema', 'error');
        showLoading(false);
    }
}

function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => initializeDashboard());
    }

    // Search
    const searchInput = document.getElementById('searchClinics');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => filterClinics(e.target.value));
    }

    // Filter by status
    const statusFilter = document.getElementById('filterStatus');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => filterByStatus(e.target.value));
    }
}

// ============================================================================
// API CALLS
// ============================================================================

async function loadSystemStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/stats/system`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar estatísticas');
        }

        const stats = await response.json();
        currentStats = stats;
        renderKPICards(stats);

        console.log('📊 System Stats loaded:', stats);
        return stats;
    } catch (error) {
        console.error('❌ Erro ao carregar stats:', error);
        throw error;
    }
}

async function loadClinics() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/clinics`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar clínicas');
        }

        const data = await response.json();
        currentClinics = data.clinics || [];
        renderClinicsTable(currentClinics);

        console.log(`✅ ${currentClinics.length} clínicas carregadas`);
        return currentClinics;
    } catch (error) {
        console.error('❌ Erro ao carregar clínicas:', error);
        throw error;
    }
}

async function toggleClinicStatus(clinicId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'suspended' ? 'bloquear' : 'desbloquear';

    const confirmed = confirm(`Tem certeza que deseja ${action} esta clínica?`);
    if (!confirmed) return;

    const reason = prompt(
        `Motivo para ${action}:`,
        newStatus === 'suspended' ? 'Falta de pagamento' : 'Pagamento recebido'
    );

    if (!reason) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/clinics/${clinicId}/status`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus, reason }),
        });

        if (!response.ok) {
            throw new Error('Erro ao alterar status');
        }

        const result = await response.json();

        showNotification(
            `Clínica ${action === 'bloquear' ? 'bloqueada' : 'desbloqueada'} com sucesso`,
            'success'
        );

        // Reload clinics
        await loadClinics();

        console.log('✅ Status alterado:', result);
    } catch (error) {
        console.error('❌ Erro ao alterar status:', error);
        showNotification('Erro ao alterar status da clínica', 'error');
    }
}

async function impersonateClinic(clinicId, clinicName) {
    const confirmed = confirm(
        `Deseja gerar token de suporte para acessar "${clinicName}"?\n\n` +
            `Isso permitirá que você faça login como admin desta clínica.`
    );

    if (!confirmed) return;

    try {
        // For now, we'll use a simplified approach
        // In production, you'd want a dedicated endpoint that generates
        // a special impersonation token with limited scope

        showNotification(
            `Token de impersonação gerado! (Funcionalidade em desenvolvimento)\n` +
                `Clínica ID: ${clinicId}`,
            'info'
        );

        // TODO: Implement proper impersonation endpoint
        // const token = localStorage.getItem('token');
        // const response = await fetch(`${API_BASE}/clinics/${clinicId}/impersonate`, {
        //     method: 'POST',
        //     headers: { 'Authorization': `Bearer ${token}` }
        // });
    } catch (error) {
        console.error('❌ Erro ao impersonar:', error);
        showNotification('Erro ao gerar token de suporte', 'error');
    }
}

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================

function renderKPICards(stats) {
    // MRR Card
    const mrrCard = document.getElementById('kpiMRR');
    if (mrrCard) {
        const mrrValue = mrrCard.querySelector('.kpi-value');
        const mrrLabel = mrrCard.querySelector('.kpi-label');

        if (mrrValue) mrrValue.textContent = stats.mrr.formatted || 'R$ 0,00';
        if (mrrLabel)
            mrrLabel.textContent = `ARR: R$ ${(stats.mrr.arr || 0).toLocaleString('pt-BR')}`;
    }

    // Active Clinics Card
    const activeCard = document.getElementById('kpiActive');
    if (activeCard) {
        const value = activeCard.querySelector('.kpi-value');
        const label = activeCard.querySelector('.kpi-label');

        if (value) value.textContent = stats.clinics.active || 0;
        if (label) {
            const total = stats.clinics.total || 0;
            const percentage = total > 0 ? ((stats.clinics.active / total) * 100).toFixed(1) : 0;
            label.textContent = `${percentage}% do total (${total})`;
        }
    }

    // Total Patients Card
    const patientsCard = document.getElementById('kpiPatients');
    if (patientsCard) {
        const value = patientsCard.querySelector('.kpi-value');
        const label = patientsCard.querySelector('.kpi-label');

        if (value) value.textContent = (stats.patients.total || 0).toLocaleString('pt-BR');
        if (label)
            label.textContent = `Média: ${stats.patients.average_per_clinic || 0} por clínica`;
    }

    // Growth Card (Monthly churn as inverse indicator)
    const growthCard = document.getElementById('kpiGrowth');
    if (growthCard) {
        const value = growthCard.querySelector('.kpi-value');
        const label = growthCard.querySelector('.kpi-label');

        const churnRate = stats.churn.rate || 0;
        const growth = (100 - churnRate).toFixed(1); // Simplificado

        if (value) {
            value.textContent = `${growth}%`;
            value.className = value.className.replace(
                /text-\w+-400/,
                churnRate < 5
                    ? 'text-green-400'
                    : churnRate < 10
                      ? 'text-yellow-400'
                      : 'text-red-400'
            );
        }
        if (label) label.textContent = `Churn: ${stats.churn.formatted || '0%'}`;
    }

    // Update plan breakdown if exists
    const planBreakdown = document.getElementById('planBreakdown');
    if (planBreakdown && stats.mrr.breakdown) {
        planBreakdown.innerHTML = stats.mrr.breakdown
            .map(
                (plan) => `
            <div class="flex items-center justify-between py-2 border-b border-gray-700/30">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full ${getPlanColor(plan.plan)}"></div>
                    <span class="text-gray-300">${getPlanLabel(plan.plan)}</span>
                </div>
                <div class="text-right">
                    <div class="text-white font-semibold">R$ ${plan.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                    <div class="text-gray-400 text-xs">${plan.clinics} clínica(s)</div>
                </div>
            </div>
        `
            )
            .join('');
    }
}

function renderClinicsTable(clinics) {
    const tbody = document.getElementById('clinicsTableBody');
    if (!tbody) return;

    if (clinics.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-12 text-gray-400">
                    <i class="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                    <p class="text-lg">Nenhuma clínica encontrada</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = clinics
        .map((clinic) => {
            const isBlocked = clinic.status === 'suspended' || clinic.status === 'cancelled';
            const rowClass = isBlocked ? 'bg-gray-900/50 opacity-60' : 'hover:bg-gray-800/30';

            const lastLogin = clinic.last_login
                ? formatDateTime(clinic.last_login)
                : '<span class="text-gray-500">Nunca</span>';

            return `
            <tr class="${rowClass} transition-all duration-200 border-b border-gray-700/30">
                <td class="py-4 px-3">
                    <div>
                        <div class="font-semibold text-white">${escapeHtml(clinic.name)}</div>
                        <div class="text-sm text-gray-400">${escapeHtml(clinic.slug)}</div>
                    </div>
                </td>
                <td class="py-4 px-3">
                    <div>
                        <div class="text-gray-300">${clinic.owner_email || '-'}</div>
                        <div class="text-sm text-gray-500">${clinic.owner_phone || '-'}</div>
                    </div>
                </td>
                <td class="py-4 px-3">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${getPlanBadgeClass(clinic.plan_tier)}">
                        ${getPlanLabel(clinic.plan_tier)}
                    </span>
                </td>
                <td class="py-4 px-3">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(clinic.status)}">
                        ${getStatusLabel(clinic.status)}
                    </span>
                </td>
                <td class="py-4 px-3 text-gray-300 text-sm">
                    <div>${lastLogin}</div>
                    <div class="text-gray-500 text-xs">${clinic.user_count || 0} usuário(s)</div>
                </td>
                <td class="py-4 px-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                        ${renderActionButtons(clinic)}
                    </div>
                </td>
            </tr>
        `;
        })
        .join('');

    // Attach event listeners
    attachTableEventListeners();
}

function renderActionButtons(clinic) {
    const isBlocked = clinic.status === 'suspended' || clinic.status === 'cancelled';

    return `
        <button 
            class="action-btn-toggle px-3 py-2 rounded-lg transition-all duration-200 ${
                isBlocked
                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
            }"
            data-clinic-id="${clinic.id}"
            data-clinic-status="${clinic.status}"
            title="${isBlocked ? 'Desbloquear clínica' : 'Bloquear clínica'}">
            <i class="fas fa-${isBlocked ? 'unlock' : 'lock'}"></i>
            <span class="ml-1 text-xs">${isBlocked ? 'Desbloquear' : 'Bloquear'}</span>
        </button>
        
        <button 
            class="action-btn-impersonate px-3 py-2 rounded-lg transition-all duration-200 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400"
            data-clinic-id="${clinic.id}"
            data-clinic-name="${escapeHtml(clinic.name)}"
            title="Login As (Suporte)">
            <i class="fas fa-user-secret"></i>
            <span class="ml-1 text-xs">Login As</span>
        </button>
        
        <button 
            class="action-btn-details px-3 py-2 rounded-lg transition-all duration-200 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
            data-clinic-id="${clinic.id}"
            title="Ver detalhes">
            <i class="fas fa-eye"></i>
        </button>
    `;
}

function attachTableEventListeners() {
    // Toggle status buttons
    document.querySelectorAll('.action-btn-toggle').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const clinicId = e.currentTarget.dataset.clinicId;
            const currentStatus = e.currentTarget.dataset.clinicStatus;
            toggleClinicStatus(clinicId, currentStatus);
        });
    });

    // Impersonate buttons
    document.querySelectorAll('.action-btn-impersonate').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const clinicId = e.currentTarget.dataset.clinicId;
            const clinicName = e.currentTarget.dataset.clinicName;
            impersonateClinic(clinicId, clinicName);
        });
    });

    // Details buttons
    document.querySelectorAll('.action-btn-details').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const clinicId = e.currentTarget.dataset.clinicId;
            showClinicDetails(clinicId);
        });
    });
}

// ============================================================================
// FILTER & SEARCH
// ============================================================================

function filterClinics(searchTerm) {
    const filtered = currentClinics.filter((clinic) => {
        const term = searchTerm.toLowerCase();
        return (
            clinic.name.toLowerCase().includes(term) ||
            clinic.slug.toLowerCase().includes(term) ||
            (clinic.owner_email && clinic.owner_email.toLowerCase().includes(term))
        );
    });

    renderClinicsTable(filtered);
}

function filterByStatus(status) {
    if (!status || status === 'all') {
        renderClinicsTable(currentClinics);
        return;
    }

    const filtered = currentClinics.filter((clinic) => clinic.status === status);
    renderClinicsTable(filtered);
}

// ============================================================================
// MODAL & DETAILS
// ============================================================================

function showClinicDetails(clinicId) {
    const clinic = currentClinics.find((c) => c.id === parseInt(clinicId));
    if (!clinic) return;

    const modal = `
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" id="detailsModal">
            <div class="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
                <div class="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-6 border-b border-gray-700">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-2xl font-bold text-white">${escapeHtml(clinic.name)}</h3>
                            <p class="text-gray-400 mt-1">${escapeHtml(clinic.slug)}</p>
                        </div>
                        <button onclick="document.getElementById('detailsModal').remove()" 
                                class="text-gray-400 hover:text-white transition">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-6 space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="glass-card p-4 rounded-lg">
                            <div class="text-gray-400 text-sm mb-1">Status</div>
                            <span class="px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(clinic.status)}">
                                ${getStatusLabel(clinic.status)}
                            </span>
                        </div>
                        <div class="glass-card p-4 rounded-lg">
                            <div class="text-gray-400 text-sm mb-1">Plano</div>
                            <span class="px-3 py-1 rounded-full text-xs font-semibold ${getPlanBadgeClass(clinic.plan_tier)}">
                                ${getPlanLabel(clinic.plan_tier)}
                            </span>
                        </div>
                    </div>
                    
                    <div class="glass-card p-4 rounded-lg">
                        <div class="text-gray-400 text-sm mb-2">Responsável</div>
                        <div class="text-white">${clinic.owner_email || 'Não informado'}</div>
                        <div class="text-gray-400 text-sm">${clinic.owner_phone || 'Telefone não informado'}</div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4">
                        <div class="glass-card p-4 rounded-lg text-center">
                            <div class="text-2xl font-bold text-blue-400">${clinic.user_count || 0}</div>
                            <div class="text-gray-400 text-sm">Usuários</div>
                        </div>
                        <div class="glass-card p-4 rounded-lg text-center">
                            <div class="text-2xl font-bold text-green-400">${clinic.patient_count || 0}</div>
                            <div class="text-gray-400 text-sm">Pacientes</div>
                        </div>
                        <div class="glass-card p-4 rounded-lg text-center">
                            <div class="text-gray-400 text-xs">Último Login</div>
                            <div class="text-white text-sm mt-1">${
                                clinic.last_login ? formatDateTime(clinic.last_login) : 'Nunca'
                            }</div>
                        </div>
                    </div>
                    
                    <div class="glass-card p-4 rounded-lg">
                        <div class="text-gray-400 text-sm mb-2">Datas</div>
                        <div class="space-y-1 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-400">Criada em:</span>
                                <span class="text-white">${formatDateTime(clinic.created_at)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-400">Atualizada em:</span>
                                <span class="text-white">${formatDateTime(clinic.updated_at)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="p-6 bg-gray-800/50 border-t border-gray-700 flex justify-end gap-3">
                    <button onclick="document.getElementById('detailsModal').remove()" 
                            class="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modal);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function showLoading(show) {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.classList.toggle('hidden', !show);
    }
}

function showNotification(message, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500',
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-slide-in`;
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('animate-slide-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getStatusLabel(status) {
    const labels = {
        active: 'Ativa',
        trial: 'Trial',
        suspended: 'Suspensa',
        cancelled: 'Cancelada',
    };
    return labels[status] || status;
}

function getStatusBadgeClass(status) {
    const classes = {
        active: 'bg-green-500/20 text-green-400',
        trial: 'bg-blue-500/20 text-blue-400',
        suspended: 'bg-red-500/20 text-red-400',
        cancelled: 'bg-gray-500/20 text-gray-400',
    };
    return classes[status] || 'bg-gray-500/20 text-gray-400';
}

function getPlanLabel(plan) {
    const labels = {
        basic: 'Basic',
        professional: 'Professional',
        enterprise: 'Enterprise',
    };
    return labels[plan] || plan;
}

function getPlanBadgeClass(plan) {
    const classes = {
        basic: 'bg-cyan-500/20 text-cyan-400',
        professional: 'bg-purple-500/20 text-purple-400',
        enterprise: 'bg-yellow-500/20 text-yellow-400',
    };
    return classes[plan] || 'bg-gray-500/20 text-gray-400';
}

function getPlanColor(plan) {
    const colors = {
        basic: 'bg-cyan-400',
        professional: 'bg-purple-400',
        enterprise: 'bg-yellow-400',
    };
    return colors[plan] || 'bg-gray-400';
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export for global access
window.SuperAdminDashboard = {
    reload: initializeDashboard,
    loadStats: loadSystemStats,
    loadClinics: loadClinics,
};
