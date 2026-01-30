const token = sessionStorage.getItem('token') || sessionStorage.getItem('MEDICAL_CRM_TOKEN');
const role = sessionStorage.getItem('userRole');

const statsEls = {
  totalClinics: document.getElementById('totalClinics'),
  activeClinics: document.getElementById('activeClinics'),
  proClinics: document.getElementById('proClinics'),
  totalUsers: document.getElementById('totalUsers')
};

const tableBody = document.getElementById('clinicsTableBody');
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
      ...(options.headers || {})
    }
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

function statusBadge(status) {
  const map = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-200 text-gray-700',
    suspended: 'bg-red-100 text-red-700'
  };
  const label = {
    active: 'Ativa',
    inactive: 'Inativa',
    suspended: 'Suspensa'
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

  tableBody.innerHTML = rows.map((clinic) => {
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
  }).join('');
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
  const proCount = clinics.filter((clinic) => clinic.plan_tier === 'pro').length;
  statsEls.proClinics.textContent = proCount;
  renderClinics(clinics);
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
      password: document.getElementById('adminPassword').value
    }
  };

  try {
    await apiFetch(`${apiBase}/clinics`, {
      method: 'POST',
      body: JSON.stringify(payload)
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
      body: JSON.stringify({ status })
    });
    await Promise.all([loadClinics(), loadStats()]);
  } catch (error) {
    alert(error.message || 'Erro ao atualizar status');
  }
}

async function handleDeleteClinic(target) {
  const clinicId = target.dataset.id;
  const confirmed = window.confirm('Tem certeza que deseja deletar esta clínica? Esta ação é irreversível.');
  if (!confirmed) return;

  try {
    await apiFetch(`${apiBase}/clinics/${clinicId}`, {
      method: 'DELETE'
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
}

if (ensureAccess()) {
  bindEvents();
  Promise.all([loadStats(), loadClinics()]).catch((error) => {
    console.error('Erro ao carregar painel SaaS:', error);
  });
}
