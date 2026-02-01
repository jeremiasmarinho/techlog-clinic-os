const token = sessionStorage.getItem('token') || sessionStorage.getItem('MEDICAL_CRM_TOKEN');
const role = sessionStorage.getItem('userRole');

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

const tableBody = document.getElementById('clinicsTableBody');
const upgradeTableBody = document.getElementById('upgradeRequestsTableBody');
const exportAnalyticsBtn = document.getElementById('exportAnalyticsCsv');
const exportAuditBtn = document.getElementById('exportAuditCsv');
const btnNewClinic = document.getElementById('btnNewClinic');
const modal = document.getElementById('modalNewClinic');
const closeModal = document.getElementById('closeModal');
const cancelModal = document.getElementById('cancelModal');
const clinicForm = document.getElementById('clinicForm');
const formError = document.getElementById('formError');

const apiBase = '/api/saas';

function redirectToLogin() {
    window.location.href = '/login.html';
}

function ensureAccess() {
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

async function apiFetch(path, options = {}) {
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
        const error = data?.error || 'Erro inesperado';
        throw new Error(error);
    }

    return data;
}

async function downloadCsv(path, filename) {
    const response = await fetch(path, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Erro ao exportar CSV');
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

function statusBadge(status) {
    const map = {
        active: 'bg-green-100 text-green-700',
        trial: 'bg-yellow-100 text-yellow-700',
        inactive: 'bg-gray-200 text-gray-700',
        suspended: 'bg-red-100 text-red-700',
        cancelled: 'bg-gray-300 text-gray-800',
    };
    const label = {
        active: 'Ativa',
        trial: 'Trial',
        inactive: 'Inativa',
        suspended: 'Suspensa',
        cancelled: 'Cancelada',
    };

    return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}">${label[status] || status}</span>`;
}

function renderClinics(rows) {
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

function upgradeStatusBadge(status) {
    const map = {
        pending: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
    };
    const label = {
        pending: 'Pendente',
        approved: 'Aprovado',
        rejected: 'Recusado',
    };

    return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}">${label[status] || status}</span>`;
}

function renderUpgradeRequests(rows) {
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

function renderAnalytics(data) {
    if (!data || !analyticsEls.totalLeads) return;

    analyticsEls.totalLeads.textContent = data.totals?.total_leads ?? '-';
    analyticsEls.totalPatients.textContent = data.totals?.total_patients ?? '-';
    analyticsEls.totalAppointments.textContent = data.totals?.total_appointments ?? '-';

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

async function loadStats() {
    const stats = await apiFetch(`${apiBase}/stats`);
    if (!stats) return;

    statsEls.totalClinics.textContent = stats.total_clinics ?? '-';
    statsEls.activeClinics.textContent = stats.active_clinics ?? '-';
    statsEls.proClinics.textContent = '-';
    statsEls.totalUsers.textContent = stats.total_users ?? '-';
}

async function loadClinics() {
    tableBody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center py-8 text-gray-500">
        <i class="fas fa-circle-notch fa-spin text-2xl mb-2"></i>
        <p>Carregando clínicas...</p>
      </td>
    </tr>
  `;

    const clinics = await apiFetch(`${apiBase}/clinics`);
    if (!clinics) return;
    const proCount = clinics.filter((clinic) =>
        ['professional', 'enterprise'].includes(clinic.plan_tier)
    ).length;
    statsEls.proClinics.textContent = proCount;
    renderClinics(clinics);
}

async function loadUpgradeRequests() {
    if (!upgradeTableBody) return;

    upgradeTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center py-8 text-gray-500">
        <i class="fas fa-circle-notch fa-spin text-2xl mb-2"></i>
        <p>Carregando solicitações...</p>
      </td>
    </tr>
  `;

    const requests = await apiFetch(`${apiBase}/upgrade-requests`);
    if (!requests) return;
    renderUpgradeRequests(requests);
}

async function loadAnalytics() {
    if (!analyticsEls.totalLeads) return;
    const data = await apiFetch(`${apiBase}/analytics`);
    if (!data) return;
    renderAnalytics(data);
}

function openModal() {
    formError.classList.add('hidden');
    formError.textContent = '';
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModalUI() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    clinicForm.reset();
}

async function handleCreateClinic(event) {
    event.preventDefault();

    const payload = {
        name: document.getElementById('clinicName').value.trim(),
        slug: document.getElementById('clinicSlug').value.trim(),
        plan_tier: document.getElementById('clinicPlan').value,
        status: document.getElementById('clinicStatus').value,
        owner_email: document.getElementById('ownerEmail').value.trim() || undefined,
        owner_phone: document.getElementById('ownerPhone').value.trim() || undefined,
        admin: {
            name: document.getElementById('adminName').value.trim(),
            username: document.getElementById('adminUsername').value.trim(),
            password: document.getElementById('adminPassword').value,
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
        formError.textContent = error.message || 'Erro ao criar clínica';
        formError.classList.remove('hidden');
    }
}

async function handleStatusChange(target) {
    const clinicId = target.dataset.id;
    const status = target.value;

    try {
        await apiFetch(`${apiBase}/clinics/${clinicId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
        await Promise.all([loadClinics(), loadStats()]);
    } catch (error) {
        alert(error.message || 'Erro ao atualizar status');
    }
}

async function handleDeleteClinic(target) {
    const clinicId = target.dataset.id;
    const confirmed = window.confirm(
        'Tem certeza que deseja deletar esta clínica? Esta ação é irreversível.'
    );
    if (!confirmed) return;

    try {
        await apiFetch(`${apiBase}/clinics/${clinicId}`, {
            method: 'DELETE',
        });
        await Promise.all([loadClinics(), loadStats()]);
    } catch (error) {
        alert(error.message || 'Erro ao deletar clínica');
    }
}

function bindEvents() {
    btnNewClinic.addEventListener('click', openModal);
    closeModal.addEventListener('click', closeModalUI);
    cancelModal.addEventListener('click', closeModalUI);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModalUI();
        }
    });
    clinicForm.addEventListener('submit', handleCreateClinic);

    tableBody.addEventListener('change', (event) => {
        const target = event.target;
        if (target?.dataset?.action === 'status') {
            handleStatusChange(target);
        }
    });

    tableBody.addEventListener('click', (event) => {
        const target = event.target.closest('[data-action="delete"]');
        if (target) {
            handleDeleteClinic(target);
        }
    });

    if (exportAnalyticsBtn) {
        exportAnalyticsBtn.addEventListener('click', async () => {
            try {
                await downloadCsv(`${apiBase}/analytics/export`, `analytics_${Date.now()}.csv`);
            } catch (error) {
                alert(error.message || 'Erro ao exportar analytics');
            }
        });
    }

    if (exportAuditBtn) {
        exportAuditBtn.addEventListener('click', async () => {
            try {
                await downloadCsv(`${apiBase}/audit-logs/export`, `audit_logs_${Date.now()}.csv`);
            } catch (error) {
                alert(error.message || 'Erro ao exportar auditoria');
            }
        });
    }

    if (upgradeTableBody) {
        upgradeTableBody.addEventListener('click', async (event) => {
            const target = event.target.closest('[data-action]');
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
                    alert(error.message || 'Erro ao atualizar solicitação');
                }
            }
        });
    }
}

if (ensureAccess()) {
    bindEvents();
    Promise.all([loadStats(), loadClinics(), loadUpgradeRequests(), loadAnalytics()]).catch(
        (error) => {
            console.error('Erro ao carregar painel SaaS:', error);
        }
    );
}
