/**
 * SaaS Clinics Management
 * Gerenciamento de clínicas no painel super_admin
 */

declare function showToast(options: {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}): void;
declare function showConfirmModal(options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    icon?: string;
    variant?: string;
}): Promise<boolean>;

// Tipos locais
interface SaasClinic {
    id: number;
    name: string;
    slug: string;
    status: string;
    plan_tier: string;
    owner_email?: string;
    owner_phone?: string;
    lead_count?: number;
    user_count?: number;
    created_at?: string;
}

interface UpgradeRequest {
    id: number;
    clinic_id: number;
    clinic_name?: string;
    current_plan?: string;
    requested_plan: string;
    status: string;
    created_at?: string;
}

interface AnalyticsData {
    totals?: {
        total_leads?: number;
        total_patients?: number;
        total_appointments?: number;
    };
    plans?: Array<{ plan_tier: string; count: number }>;
    statuses?: Array<{ status: string; count: number }>;
    top_clinics?: Array<{
        id: number;
        name: string;
        slug: string;
        plan_tier?: string;
        status?: string;
        lead_count?: number;
        user_count?: number;
    }>;
}

interface CreateClinicPayload {
    name: string;
    slug: string;
    plan_tier: string;
    status: string;
    owner_email?: string;
    owner_phone?: string;
    admin: {
        name: string;
        username: string;
        password: string;
    };
}

const token: string | null =
    sessionStorage.getItem('token') || sessionStorage.getItem('MEDICAL_CRM_TOKEN');
const role: string | null = sessionStorage.getItem('userRole');

const statsEls = {
    totalClinics: document.getElementById('totalClinics'),
    activeClinics: document.getElementById('activeClinics'),
    proClinics: document.getElementById('proClinics'),
    totalUsers: document.getElementById('totalUsers'),
};

const analyticsEls = {
    totalLeads: document.getElementById('totalLeadsAll'),
    totalPatients: document.getElementById('totalPatientsAll'),
    totalAppointments: document.getElementById('totalAppointmentsAll'),
    planStats: document.getElementById('planStats'),
    statusStats: document.getElementById('statusStats'),
    topClinicsBody: document.getElementById('topClinicsTableBody'),
};

const tableBody = document.getElementById('clinicsTableBody') as HTMLTableSectionElement;
const upgradeTableBody = document.getElementById(
    'upgradeRequestsTableBody'
) as HTMLTableSectionElement | null;
const exportAnalyticsBtn = document.getElementById(
    'exportAnalyticsCsv'
) as HTMLButtonElement | null;
const exportAuditBtn = document.getElementById('exportAuditCsv') as HTMLButtonElement | null;
const btnNewClinic = document.getElementById('btnNewClinic') as HTMLButtonElement;
const modal = document.getElementById('modalNewClinic') as HTMLElement;
const closeModalBtn = document.getElementById('closeModal') as HTMLElement;
const cancelModal = document.getElementById('cancelModal') as HTMLElement;
const clinicForm = document.getElementById('clinicForm') as HTMLFormElement;
const formError = document.getElementById('formError') as HTMLElement;

const apiBase = '/api/saas';

function redirectToLogin(): void {
    window.location.href = '/login.html';
}

function ensureAccess(): boolean {
    if (!token) {
        redirectToLogin();
        return false;
    }

    if (role !== 'super_admin') {
        window.location.href = '/admin.html';
        return false;
    }

    return true;
}

async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T | null> {
    const response = await fetch(path, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });

    if (response.status === 401) {
        redirectToLogin();
        return null;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = (data as { error?: string })?.error || 'Erro inesperado';
        throw new Error(error);
    }

    return data as T;
}

async function downloadCsv(path: string, filename: string): Promise<void> {
    const response = await fetch(path, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string })?.error || 'Erro ao exportar CSV');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

function statusBadge(status: string): string {
    const map: Record<string, string> = {
        active: 'bg-green-100 text-green-700',
        trial: 'bg-yellow-100 text-yellow-700',
        inactive: 'bg-gray-200 text-gray-700',
        suspended: 'bg-red-100 text-red-700',
        cancelled: 'bg-gray-300 text-gray-800',
    };
    const label: Record<string, string> = {
        active: 'Ativa',
        trial: 'Trial',
        inactive: 'Inativa',
        suspended: 'Suspensa',
        cancelled: 'Cancelada',
    };

    return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}">${label[status] || status}</span>`;
}

function renderClinics(rows: SaasClinic[]): void {
    if (!rows.length) {
        tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-gray-500">
          Nenhuma clínica cadastrada.
        </td>
      </tr>
    `;
        return;
    }

    tableBody.innerHTML = rows
        .map((clinic) => {
            const safeOwner = clinic.owner_email || '-';
            return `
      <tr class="border-b">
        <td class="py-4">
          <div class="font-semibold text-gray-800">${clinic.name}</div>
          <div class="text-xs text-gray-500">#${clinic.id}</div>
        </td>
        <td class="py-4 text-gray-600">${clinic.slug}</td>
        <td class="py-4">${statusBadge(clinic.status)}</td>
        <td class="py-4 capitalize">${clinic.plan_tier || '-'}</td>
        <td class="py-4 text-gray-600">${safeOwner}</td>
        <td class="py-4 text-right">
          <div class="flex items-center justify-end gap-2">
            <select data-action="status" data-id="${clinic.id}" class="border rounded-lg px-2 py-1 text-sm">
              <option value="active" ${clinic.status === 'active' ? 'selected' : ''}>Ativa</option>
              <option value="inactive" ${clinic.status === 'inactive' ? 'selected' : ''}>Inativa</option>
              <option value="suspended" ${clinic.status === 'suspended' ? 'selected' : ''}>Suspensa</option>
            </select>
            <button data-action="delete" data-id="${clinic.id}" class="text-red-600 hover:text-red-700 text-sm">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
        })
        .join('');
}

function upgradeStatusBadge(status: string): string {
    const map: Record<string, string> = {
        pending: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
    };
    const label: Record<string, string> = {
        pending: 'Pendente',
        approved: 'Aprovado',
        rejected: 'Recusado',
    };

    return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}">${label[status] || status}</span>`;
}

function renderUpgradeRequests(rows: UpgradeRequest[]): void {
    if (!upgradeTableBody) return;

    if (!rows.length) {
        upgradeTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-gray-500">
          Nenhuma solicitação de upgrade.
        </td>
      </tr>
    `;
        return;
    }

    upgradeTableBody.innerHTML = rows
        .map((req) => {
            const createdAt = req.created_at
                ? new Date(req.created_at).toLocaleDateString('pt-BR')
                : '-';
            const actions =
                req.status === 'pending'
                    ? `
        <button data-action="approve" data-id="${req.id}" class="text-green-600 hover:text-green-700 text-sm mr-2">
          <i class="fas fa-check"></i>
        </button>
        <button data-action="reject" data-id="${req.id}" class="text-red-600 hover:text-red-700 text-sm">
          <i class="fas fa-times"></i>
        </button>
      `
                    : '-';

            return `
      <tr class="border-b">
        <td class="py-4">
          <div class="font-semibold text-gray-800">${req.clinic_name || '-'}</div>
          <div class="text-xs text-gray-500">#${req.clinic_id}</div>
        </td>
        <td class="py-4 capitalize text-gray-600">${req.current_plan || '-'}</td>
        <td class="py-4 capitalize text-gray-800 font-semibold">${req.requested_plan}</td>
        <td class="py-4">${upgradeStatusBadge(req.status)}</td>
        <td class="py-4 text-gray-600">${createdAt}</td>
        <td class="py-4 text-right">${actions}</td>
      </tr>
    `;
        })
        .join('');
}

function renderAnalytics(data: AnalyticsData): void {
    if (!data || !analyticsEls.totalLeads) return;

    if (analyticsEls.totalLeads)
        analyticsEls.totalLeads.textContent = String(data.totals?.total_leads ?? '-');
    if (analyticsEls.totalPatients)
        analyticsEls.totalPatients.textContent = String(data.totals?.total_patients ?? '-');
    if (analyticsEls.totalAppointments)
        analyticsEls.totalAppointments.textContent = String(data.totals?.total_appointments ?? '-');

    if (analyticsEls.planStats) {
        const plans = (data.plans || [])
            .map((row) => {
                return `<div class="flex items-center justify-between"><span class="capitalize">${row.plan_tier || '-'}</span><span class="font-semibold">${row.count}</span></div>`;
            })
            .join('');
        analyticsEls.planStats.innerHTML = plans || '<div class="text-gray-500">Sem dados</div>';
    }

    if (analyticsEls.statusStats) {
        const statuses = (data.statuses || [])
            .map((row) => {
                return `<div class="flex items-center justify-between"><span class="capitalize">${row.status || '-'}</span><span class="font-semibold">${row.count}</span></div>`;
            })
            .join('');
        analyticsEls.statusStats.innerHTML =
            statuses || '<div class="text-gray-500">Sem dados</div>';
    }

    if (analyticsEls.topClinicsBody) {
        const rows = (data.top_clinics || [])
            .map((clinic) => {
                return `
        <tr class="border-b">
          <td class="py-3">
            <div class="font-semibold text-gray-800">${clinic.name}</div>
            <div class="text-xs text-gray-500">#${clinic.id} • ${clinic.slug}</div>
          </td>
          <td class="py-3 capitalize">${clinic.plan_tier || '-'}</td>
          <td class="py-3 capitalize">${clinic.status || '-'}</td>
          <td class="py-3 font-semibold">${clinic.lead_count ?? 0}</td>
          <td class="py-3">${clinic.user_count ?? 0}</td>
        </tr>
      `;
            })
            .join('');

        analyticsEls.topClinicsBody.innerHTML =
            rows ||
            `
      <tr>
        <td colspan="5" class="text-center py-8 text-gray-500">Sem dados</td>
      </tr>
    `;
    }
}

async function loadStats(): Promise<void> {
    const stats = await apiFetch<{
        total_clinics?: number;
        active_clinics?: number;
        total_users?: number;
    }>(`${apiBase}/stats`);
    if (!stats) return;

    if (statsEls.totalClinics)
        statsEls.totalClinics.textContent = String(stats.total_clinics ?? '-');
    if (statsEls.activeClinics)
        statsEls.activeClinics.textContent = String(stats.active_clinics ?? '-');
    if (statsEls.proClinics) statsEls.proClinics.textContent = '-';
    if (statsEls.totalUsers) statsEls.totalUsers.textContent = String(stats.total_users ?? '-');
}

async function loadClinics(): Promise<void> {
    tableBody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center py-8 text-gray-500">
        <i class="fas fa-circle-notch fa-spin text-2xl mb-2"></i>
        <p>Carregando clínicas...</p>
      </td>
    </tr>
  `;

    const clinics = await apiFetch<SaasClinic[]>(`${apiBase}/clinics`);
    if (!clinics) return;

    const proCount = clinics.filter((clinic) =>
        ['professional', 'enterprise'].includes(clinic.plan_tier)
    ).length;
    if (statsEls.proClinics) statsEls.proClinics.textContent = String(proCount);
    renderClinics(clinics);
}

async function loadUpgradeRequests(): Promise<void> {
    if (!upgradeTableBody) return;

    upgradeTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center py-8 text-gray-500">
        <i class="fas fa-circle-notch fa-spin text-2xl mb-2"></i>
        <p>Carregando solicitações...</p>
      </td>
    </tr>
  `;

    const requests = await apiFetch<UpgradeRequest[]>(`${apiBase}/upgrade-requests`);
    if (!requests) return;
    renderUpgradeRequests(requests);
}

async function loadAnalytics(): Promise<void> {
    if (!analyticsEls.totalLeads) return;
    const data = await apiFetch<AnalyticsData>(`${apiBase}/analytics`);
    if (!data) return;
    renderAnalytics(data);
}

function openModal(): void {
    formError.classList.add('hidden');
    formError.textContent = '';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModalUI(): void {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    clinicForm.reset();
}

async function handleCreateClinic(event: Event): Promise<void> {
    event.preventDefault();

    const payload: CreateClinicPayload = {
        name: (document.getElementById('clinicName') as HTMLInputElement).value.trim(),
        slug: (document.getElementById('clinicSlug') as HTMLInputElement).value.trim(),
        plan_tier: (document.getElementById('clinicPlan') as HTMLSelectElement).value,
        status: (document.getElementById('clinicStatus') as HTMLSelectElement).value,
        owner_email:
            (document.getElementById('ownerEmail') as HTMLInputElement).value.trim() || undefined,
        owner_phone:
            (document.getElementById('ownerPhone') as HTMLInputElement).value.trim() || undefined,
        admin: {
            name: (document.getElementById('adminName') as HTMLInputElement).value.trim(),
            username: (document.getElementById('adminUsername') as HTMLInputElement).value.trim(),
            password: (document.getElementById('adminPassword') as HTMLInputElement).value,
        },
    };

    try {
        await apiFetch(`${apiBase}/clinics`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        closeModalUI();
        await Promise.all([loadClinics(), loadStats()]);
    } catch (error) {
        formError.textContent = (error as Error).message || 'Erro ao criar clínica';
        formError.classList.remove('hidden');
    }
}

async function handleStatusChange(target: HTMLSelectElement): Promise<void> {
    const clinicId = target.dataset.id;
    const status = target.value;

    try {
        await apiFetch(`${apiBase}/clinics/${clinicId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
        await Promise.all([loadClinics(), loadStats()]);
    } catch (error) {
        showToast({
            message: (error as Error).message || 'Erro ao atualizar status',
            type: 'error',
        });
    }
}

async function handleDeleteClinic(target: HTMLElement): Promise<void> {
    const clinicId = target.dataset.id;
    const confirmed = await showConfirmModal({
        title: 'Deletar Clínica',
        message: 'Tem certeza que deseja deletar esta clínica? Esta ação é irreversível.',
        confirmText: 'Deletar',
        cancelText: 'Cancelar',
        icon: 'fa-trash-alt',
        variant: 'danger',
    });
    if (!confirmed) return;

    try {
        await apiFetch(`${apiBase}/clinics/${clinicId}`, {
            method: 'DELETE',
        });
        await Promise.all([loadClinics(), loadStats()]);
    } catch (error) {
        showToast({
            message: (error as Error).message || 'Erro ao deletar clínica',
            type: 'error',
        });
    }
}

function bindEvents(): void {
    btnNewClinic.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModalUI);
    cancelModal.addEventListener('click', closeModalUI);
    modal.addEventListener('click', (event: Event) => {
        if (event.target === modal) {
            closeModalUI();
        }
    });
    clinicForm.addEventListener('submit', handleCreateClinic);

    tableBody.addEventListener('change', (event: Event) => {
        const target = event.target as HTMLSelectElement;
        if (target?.dataset?.action === 'status') {
            handleStatusChange(target);
        }
    });

    tableBody.addEventListener('click', (event: Event) => {
        const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action="delete"]');
        if (target) {
            handleDeleteClinic(target);
        }
    });

    if (exportAnalyticsBtn) {
        exportAnalyticsBtn.addEventListener('click', async () => {
            try {
                await downloadCsv(`${apiBase}/analytics/export`, `analytics_${Date.now()}.csv`);
            } catch (error) {
                showToast({
                    message: (error as Error).message || 'Erro ao exportar analytics',
                    type: 'error',
                });
            }
        });
    }

    if (exportAuditBtn) {
        exportAuditBtn.addEventListener('click', async () => {
            try {
                await downloadCsv(`${apiBase}/audit-logs/export`, `audit_logs_${Date.now()}.csv`);
            } catch (error) {
                showToast({
                    message: (error as Error).message || 'Erro ao exportar auditoria',
                    type: 'error',
                });
            }
        });
    }

    if (upgradeTableBody) {
        upgradeTableBody.addEventListener('click', async (event: Event) => {
            const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const id = target.dataset.id;

            if (action === 'approve' || action === 'reject') {
                try {
                    await apiFetch(`${apiBase}/upgrade-requests/${id}`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                            status: action === 'approve' ? 'approved' : 'rejected',
                        }),
                    });
                    await Promise.all([loadClinics(), loadStats(), loadUpgradeRequests()]);
                } catch (error) {
                    showToast({
                        message: (error as Error).message || 'Erro ao atualizar solicitação',
                        type: 'error',
                    });
                }
            }
        });
    }
}

if (ensureAccess()) {
    bindEvents();
    Promise.all([loadStats(), loadClinics(), loadUpgradeRequests(), loadAnalytics()]).catch(
        (error) => {
            // Erro ao carregar painel SaaS
        }
    );
}
