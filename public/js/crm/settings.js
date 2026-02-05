/**
 * Settings Page - Team Management
 * Clinic Admin can create, list, and delete staff users
 */

// ============================================
// Authentication & Authorization Check
// ============================================
const token = sessionStorage.getItem('MEDICAL_CRM_TOKEN') || sessionStorage.getItem('token');
const userRole = sessionStorage.getItem('userRole');

if (!token) {
    alert('Sessão inválida. Faça login novamente.');
    window.location.href = '/login.html';
}

// PROTECTION: Staff cannot access this page
if (userRole === 'staff') {
    alert('⚠️ Acesso negado. Apenas administradores podem acessar esta página.');
    window.location.href = '/agenda.html';
}

// ============================================
// State Management
// ============================================
let allUsers = [];
let filteredUsers = [];
let insurancePlans = [];
let specialties = [];
let currentLogo = null;
let currentLogoFile = null;
let currentLogoUrl = null;

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();

    // Set user name in sidebar if available
    const userName = sessionStorage.getItem('userName');
    if (userName) {
        const userNameEl = document.getElementById('userName');
        if (userNameEl) userNameEl.textContent = userName;
    }

    const params = new URLSearchParams(window.location.search);
    const rawTab = params.get('tab');
    const initialTab = rawTab === 'plan' ? 'plano' : rawTab;

    if (initialTab) {
        switchTab(initialTab);
    }

    if (window.ClinicService) {
        ClinicService.fetchClinicInfo().then(() => {
            ClinicService.showTrialBanner();
            if (initialTab === 'plano') {
                loadPlanInfo();
            }
        });
    }
});

// ============================================
// Tab Management
// ============================================
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach((btn) => {
        btn.classList.remove('active');
        btn.classList.add('text-gray-400');
    });

    const activeTab = document.getElementById(
        `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`
    );
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.classList.remove('text-gray-400');
    }

    // Update content
    document.querySelectorAll('.tab-content').forEach((content) => {
        content.classList.add('hidden');
    });

    const activeContent = document.getElementById(
        `content${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`
    );
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }

    // Load clinic settings when switching to Profile tab
    if (tabName === 'perfil' && insurancePlans.length === 0) {
        loadClinicSettings();
    }

    // Load plan info when switching to Plan tab
    if (tabName === 'plano') {
        loadPlanInfo();
    }
}

// ============================================
// Load Users
// ============================================
async function loadUsers() {
    try {
        showLoading(true);

        const response = await fetch('/api/users', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('Sessão expirada. Faça login novamente.');
                window.location.href = '/login.html';
                return;
            }
            throw new Error('Erro ao carregar usuários');
        }

        allUsers = await response.json();
        filteredUsers = allUsers;

        console.log(`✅ Loaded ${allUsers.length} users`);

        renderUsers(filteredUsers);
    } catch (error) {
        console.error('❌ Erro ao carregar usuários:', error);
        showNotification('Erro ao carregar usuários', 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// Render Users Table
// ============================================
function renderUsers(users) {
    const tableBody = document.getElementById('usersTableBody');
    const emptyState = document.getElementById('emptyState');

    tableBody.innerHTML = '';

    if (users.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    users.forEach((user) => {
        const row = document.createElement('tr');
        row.className = 'user-row border-b border-white/5';

        // Determine role badge
        const isAdmin = user.role === 'clinic_admin' || user.role === 'admin';
        const roleBadge = isAdmin
            ? '<span class="badge-admin px-3 py-1 rounded-full text-xs font-bold text-white"><i class="fas fa-crown mr-1"></i>Admin</span>'
            : '<span class="badge-staff px-3 py-1 rounded-full text-xs font-bold text-white"><i class="fas fa-user mr-1"></i>Secretária</span>';

        // Status badge
        const statusBadge =
            '<span class="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold"><i class="fas fa-check-circle mr-1"></i>Ativo</span>';

        row.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        ${user.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-white">${user.name}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-gray-300">${user.username || user.email || '-'}</div>
            </td>
            <td class="px-6 py-4">
                ${roleBadge}
            </td>
            <td class="px-6 py-4">
                ${statusBadge}
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end space-x-2">
                    <button 
                        onclick="deleteUser(${user.id}, '${user.name}')"
                        class="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded-lg transition text-sm font-semibold"
                        title="Excluir usuário"
                    >
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// ============================================
// Filter Users
// ============================================
function filterUsers() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();

    filteredUsers = allUsers.filter((user) => {
        const nameMatch = user.name.toLowerCase().includes(searchTerm);
        const emailMatch = (user.username || user.email || '').toLowerCase().includes(searchTerm);
        return nameMatch || emailMatch;
    });

    renderUsers(filteredUsers);
}

// ============================================
// Modal Management
// ============================================
async function openNewUserModal() {
    if (window.ClinicService) {
        const limit = await ClinicService.checkUserLimit();
        if (!limit.canAdd) {
            ClinicService.showLimitAlert('user');
            return;
        }
    }

    document.getElementById('newUserModal').classList.remove('hidden');
    document.getElementById('newUserForm').reset();
    document.getElementById('formError').classList.add('hidden');
}

// ============================================
// Plano & Limites
// ============================================
async function loadPlanInfo() {
    if (!window.ClinicService) return;

    const clinic = await ClinicService.fetchClinicInfo();
    if (!clinic) return;

    const planBadgeEl = document.getElementById('planBadge');
    if (planBadgeEl) {
        planBadgeEl.innerHTML = ClinicService.getPlanBadgeHTML(clinic.plan_tier || 'basic');
    }

    const clinicNameEl = document.getElementById('planClinicName');
    if (clinicNameEl) clinicNameEl.textContent = clinic.name || 'Clínica';

    const statusEl = document.getElementById('planStatus');
    if (statusEl) {
        const statusMap = {
            active: 'Ativa',
            trial: 'Trial',
            suspended: 'Suspensa',
            cancelled: 'Cancelada',
        };
        statusEl.textContent = statusMap[clinic.status] || clinic.status || '-';
        statusEl.className =
            clinic.status === 'suspended'
                ? 'text-red-400 font-semibold'
                : clinic.status === 'trial'
                  ? 'text-yellow-400 font-semibold'
                  : 'text-green-400 font-semibold';
    }

    const ownerEl = document.getElementById('planOwner');
    if (ownerEl) ownerEl.textContent = clinic.owner_name || clinic.owner_email || '-';

    const usersUsed = Number(clinic.total_users || 0);
    const usersMax = Number(clinic.max_users || 0);
    const usersPercent = usersMax > 0 ? Math.min(100, Math.round((usersUsed / usersMax) * 100)) : 0;

    const patientsUsed = Number(clinic.total_leads || clinic.total_patients || 0);
    const patientsMax = Number(clinic.max_patients || 0);
    const patientsPercent =
        patientsMax > 0 ? Math.min(100, Math.round((patientsUsed / patientsMax) * 100)) : 0;

    const planUsersUsedEl = document.getElementById('planUsersUsed');
    const planUsersMaxEl = document.getElementById('planUsersMax');
    const planUsersPercentEl = document.getElementById('planUsersPercent');
    const planUsersProgressEl = document.getElementById('planUsersProgress');

    if (planUsersUsedEl) planUsersUsedEl.textContent = usersUsed;
    if (planUsersMaxEl) planUsersMaxEl.textContent = usersMax;
    if (planUsersPercentEl) planUsersPercentEl.textContent = usersPercent;
    if (planUsersProgressEl) planUsersProgressEl.style.width = `${usersPercent}%`;

    const planPatientsUsedEl = document.getElementById('planPatientsUsed');
    const planPatientsMaxEl = document.getElementById('planPatientsMax');
    const planPatientsPercentEl = document.getElementById('planPatientsPercent');
    const planPatientsProgressEl = document.getElementById('planPatientsProgress');

    if (planPatientsUsedEl) planPatientsUsedEl.textContent = patientsUsed;
    if (planPatientsMaxEl) planPatientsMaxEl.textContent = patientsMax;
    if (planPatientsPercentEl) planPatientsPercentEl.textContent = patientsPercent;
    if (planPatientsProgressEl) planPatientsProgressEl.style.width = `${patientsPercent}%`;

    if (clinic.trial && clinic.trial.is_expiring_soon) {
        const planTrialEl = document.getElementById('planTrial');
        const planTrialTextEl = document.getElementById('planTrialText');
        if (planTrialEl && planTrialTextEl) {
            planTrialTextEl.textContent = `Seu trial expira em ${clinic.trial.days_left} dia(s).`;
            planTrialEl.classList.remove('hidden');
        }
    }
}

async function requestUpgrade(plan) {
    if (!window.ClinicService) return;

    const confirmed = confirm(`Deseja solicitar upgrade para o plano ${plan}?`);
    if (!confirmed) return;

    try {
        await ClinicService.requestUpgrade(plan);
        showNotification('Solicitação de upgrade enviada com sucesso!', 'success');
    } catch (error) {
        console.error(error);
        showNotification(error.message || 'Erro ao solicitar upgrade', 'error');
    }
}

function closeNewUserModal() {
    document.getElementById('newUserModal').classList.add('hidden');
}

// ============================================
// Create User
// ============================================
async function handleCreateUser(event) {
    event.preventDefault();

    // Get form elements - using unique IDs to avoid conflict with sidebar
    const nameEl = document.getElementById('newUserName');
    const emailEl = document.getElementById('newUserEmail');
    const passwordEl = document.getElementById('newUserPassword');
    const passwordConfirmEl = document.getElementById('newUserPasswordConfirm');
    const isAdminEl = document.getElementById('newUserIsAdmin');

    // Validate elements exist
    if (!nameEl || !emailEl || !passwordEl || !passwordConfirmEl) {
        showFormError('Erro interno: elementos do formulário não encontrados');
        return;
    }

    // Safe value extraction
    const name = (nameEl.value || '').trim();
    const email = (emailEl.value || '').trim();
    const password = passwordEl.value || '';
    const passwordConfirm = passwordConfirmEl.value || '';
    const isAdmin = isAdminEl ? isAdminEl.checked : false;

    // Validation
    if (!name || !email || !password) {
        showFormError('Preencha todos os campos obrigatórios');
        return;
    }

    if (password !== passwordConfirm) {
        showFormError('As senhas não coincidem');
        return;
    }

    if (password.length < 6) {
        showFormError('A senha deve ter no mínimo 6 caracteres');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Criando...';
    }

    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name,
                username: email,
                password,
                role: isAdmin ? 'clinic_admin' : 'staff',
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao criar usuário');
        }

        console.log('✅ Usuário criado:', data);

        showNotification(`✅ Usuário ${name} criado com sucesso!`, 'success');

        closeNewUserModal();
        await loadUsers();
    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error);
        showFormError(error.message);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

// ============================================
// Delete User
// ============================================
async function deleteUser(userId, userName) {
    const confirmed = await confirm(
        `⚠️ Tem certeza que deseja remover o usuário "${userName}"?\n\nEsta ação não pode ser desfeita.`
    );
    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao remover usuário');
        }

        console.log('✅ Usuário removido:', userId);

        showNotification(`✅ Usuário ${userName} removido com sucesso!`, 'success');

        await loadUsers();
    } catch (error) {
        console.error('❌ Erro ao deletar usuário:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// ============================================
// UI Helper Functions
// ============================================
function showLoading(show) {
    const tableBody = document.getElementById('usersTableBody');
    if (show) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-3xl text-cyan-400 mb-2"></i>
                    <p class="text-gray-400">Carregando usuários...</p>
                </td>
            </tr>
        `;
    }
}

function showFormError(message) {
    const errorDiv = document.getElementById('formError');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
}

function showNotification(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    const icon = document.getElementById('toastIcon');
    const text = document.getElementById('toastMessage');

    text.textContent = message;

    if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle text-red-400 text-2xl mr-3';
    } else {
        icon.className = 'fas fa-check-circle text-cyan-400 text-2xl mr-3';
    }

    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

async function logout() {
    const confirmed = await confirm('Deseja realmente sair do sistema?');
    if (confirmed) {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/login.html';
    }
}

// ============================================
// Clinic Profile Settings
// ============================================

/**
 * Load Clinic Settings from API
 */
async function loadClinicSettings() {
    try {
        const response = await fetch('/api/clinic/settings', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                // No settings yet, use defaults
                console.log('⚠️ Nenhuma configuração encontrada, usando padrões');
                return;
            }
            throw new Error('Erro ao carregar configurações');
        }

        const settings = await response.json();

        console.log('✅ Configurações carregadas:', settings);

        // Populate Identity Fields
        if (settings.identity) {
            document.getElementById('clinicName').value = settings.identity.name || '';
            document.getElementById('clinicPhone').value = settings.identity.phone || '';
            document.getElementById('clinicAddress').value = settings.identity.address || '';

            if (settings.identity.logo) {
                currentLogoUrl = settings.identity.logo;
                displayLogo(settings.identity.logo);
            }
        }

        // Populate Hours
        if (settings.hours) {
            document.getElementById('openingHour').value = settings.hours.opening || '08:00';
            document.getElementById('closingHour').value = settings.hours.closing || '18:00';
            document.getElementById('lunchStart').value = settings.hours.lunchStart || '';
            document.getElementById('lunchEnd').value = settings.hours.lunchEnd || '';

            // Working days
            const days = settings.hours.workingDays || ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
            ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].forEach((day) => {
                const checkbox = document.getElementById(`day${day}`);
                if (checkbox) {
                    checkbox.checked = days.includes(day);
                }
            });
        }

        // Populate Insurance Plans
        if (settings.insurancePlans && Array.isArray(settings.insurancePlans)) {
            insurancePlans = settings.insurancePlans;
            renderInsuranceTags();
        }

        // Populate Chat Scripts
        if (settings.chatbot) {
            document.getElementById('chatGreeting').value = settings.chatbot.greeting || '';
            document.getElementById('chatAwayMessage').value = settings.chatbot.awayMessage || '';
            document.getElementById('chatInstructions').value = settings.chatbot.instructions || '';
        }

        // Populate Appointment Settings
        if (settings.appointments) {
            const defaultDuration = document.getElementById('defaultDuration');
            const appointmentInterval = document.getElementById('appointmentInterval');
            const minAdvance = document.getElementById('minAdvance');
            const maxAdvance = document.getElementById('maxAdvance');

            if (defaultDuration)
                defaultDuration.value = settings.appointments.defaultDuration || '30';
            if (appointmentInterval)
                appointmentInterval.value = settings.appointments.interval || '10';
            if (minAdvance) minAdvance.value = settings.appointments.minAdvance || '2';
            if (maxAdvance) maxAdvance.value = settings.appointments.maxAdvance || '30';
        }

        // Populate Pricing
        if (settings.pricing) {
            const priceFirst = document.getElementById('priceFirstConsult');
            const priceReturn = document.getElementById('priceReturn');
            const priceExam = document.getElementById('priceExam');
            const freeReturn = document.getElementById('freeReturn');

            if (priceFirst) priceFirst.value = settings.pricing.firstConsult || '';
            if (priceReturn) priceReturn.value = settings.pricing.return || '';
            if (priceExam) priceExam.value = settings.pricing.exam || '';
            if (freeReturn) freeReturn.checked = settings.pricing.freeReturn || false;
        }

        // Populate Notifications
        if (settings.notifications) {
            const reminderHours = document.getElementById('reminderHours');
            const confirmationEnabled = document.getElementById('confirmationEnabled');
            const reminderMessage = document.getElementById('reminderMessage');

            if (reminderHours) reminderHours.value = settings.notifications.reminderHours || '24';
            if (confirmationEnabled)
                confirmationEnabled.checked = settings.notifications.confirmationEnabled !== false;
            if (reminderMessage)
                reminderMessage.value = settings.notifications.reminderMessage || '';
        }

        // Populate Specialties
        if (settings.specialties && Array.isArray(settings.specialties)) {
            specialties = settings.specialties;
            renderSpecialtiesTags();
        }

        // Populate Documents
        if (settings.documents) {
            const documentHeader = document.getElementById('documentHeader');
            const documentFooter = document.getElementById('documentFooter');

            if (documentHeader) documentHeader.value = settings.documents.header || '';
            if (documentFooter) documentFooter.value = settings.documents.footer || '';
        }

        // Populate Security
        if (settings.security) {
            const sessionTimeout = document.getElementById('sessionTimeout');
            const allowMultipleLogins = document.getElementById('allowMultipleLogins');

            if (sessionTimeout) sessionTimeout.value = settings.security.sessionTimeout || '120';
            if (allowMultipleLogins)
                allowMultipleLogins.checked = settings.security.allowMultipleLogins !== false;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar configurações:', error);
        showNotification('Erro ao carregar configurações da clínica', 'error');
    }
}

/**
 * Save Clinic Settings to API
 */
async function saveClinicSettings() {
    try {
        const submitBtn = document.getElementById('saveSettingsBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';

        // If there's a new logo file, upload it first via PATCH
        if (currentLogoFile) {
            console.log('📤 Uploading new logo file...');
            const formData = new FormData();
            formData.append('logo', currentLogoFile);
            formData.append('name', document.getElementById('clinicName').value.trim());
            formData.append('address', document.getElementById('clinicAddress').value.trim());

            const uploadResponse = await fetch('/api/clinic/settings', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (uploadResponse.ok) {
                const uploadData = await uploadResponse.json();
                currentLogoUrl = uploadData.logo_url || currentLogoUrl;
                currentLogoFile = null; // Clear the file reference
                console.log('✅ Logo uploaded:', currentLogoUrl);
            } else {
                console.error('❌ Failed to upload logo');
            }
        }

        // Gather working days
        const workingDays = [];
        ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].forEach((day) => {
            const checkbox = document.getElementById(`day${day}`);
            if (checkbox && checkbox.checked) {
                workingDays.push(day);
            }
        });

        // Build payload - use the uploaded logo URL
        const payload = {
            identity: {
                name: document.getElementById('clinicName').value.trim(),
                phone: document.getElementById('clinicPhone').value.trim(),
                address: document.getElementById('clinicAddress').value.trim(),
                logo: currentLogoUrl,
            },
            hours: {
                opening: document.getElementById('openingHour').value,
                closing: document.getElementById('closingHour').value,
                lunchStart: document.getElementById('lunchStart').value,
                lunchEnd: document.getElementById('lunchEnd').value,
                workingDays: workingDays,
            },
            insurancePlans: insurancePlans,
            chatbot: {
                greeting: document.getElementById('chatGreeting').value.trim(),
                awayMessage: document.getElementById('chatAwayMessage').value.trim(),
                instructions: document.getElementById('chatInstructions').value.trim(),
            },
            appointments: {
                defaultDuration: document.getElementById('defaultDuration')?.value || '30',
                interval: document.getElementById('appointmentInterval')?.value || '10',
                minAdvance: document.getElementById('minAdvance')?.value || '2',
                maxAdvance: document.getElementById('maxAdvance')?.value || '30',
            },
            pricing: {
                firstConsult: document.getElementById('priceFirstConsult')?.value || '',
                return: document.getElementById('priceReturn')?.value || '',
                exam: document.getElementById('priceExam')?.value || '',
                freeReturn: document.getElementById('freeReturn')?.checked || false,
            },
            notifications: {
                reminderHours: document.getElementById('reminderHours')?.value || '24',
                confirmationEnabled:
                    document.getElementById('confirmationEnabled')?.checked !== false,
                reminderMessage: document.getElementById('reminderMessage')?.value.trim() || '',
            },
            specialties: specialties,
            documents: {
                header: document.getElementById('documentHeader')?.value.trim() || '',
                footer: document.getElementById('documentFooter')?.value.trim() || '',
            },
            security: {
                sessionTimeout: document.getElementById('sessionTimeout')?.value || '120',
                allowMultipleLogins:
                    document.getElementById('allowMultipleLogins')?.checked !== false,
            },
        };

        console.log('📤 Enviando configurações:', payload);

        const response = await fetch('/api/clinic/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao salvar configurações');
        }

        console.log('✅ Configurações salvas:', data);

        // ============================================
        // CLEAR CACHE TO FORCE RELOAD ON OTHER PAGES
        // ============================================
        try {
            localStorage.removeItem('clinicSettings');
            sessionStorage.removeItem('clinicLogoUrl');
            console.log('🗑️ Cache de configurações limpo');
        } catch (e) {
            console.error('Erro ao limpar cache:', e);
        }

        showNotification('✅ Configurações salvas! Recarregando...', 'success');

        // Recarregar página após 1 segundo para aplicar alterações
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } catch (error) {
        console.error('❌ Erro ao salvar configurações:', error);
        showNotification(`❌ ${error.message}`, 'error');
    } finally {
        const submitBtn = document.getElementById('saveSettingsBtn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Salvar Alterações';
    }
}

// ============================================
// Logo Upload Handler
// ============================================

function handleLogoUpload(event) {
    console.log('🖼️ handleLogoUpload chamado', event);
    const file = event.target.files[0];
    console.log('📁 Arquivo selecionado:', file);

    if (!file) {
        console.log('❌ Nenhum arquivo selecionado');
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        console.log('❌ Tipo inválido:', file.type);
        alert('Por favor, selecione uma imagem válida (PNG, JPG)');
        return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
        console.log('❌ Arquivo muito grande:', file.size);
        alert('A imagem deve ter no máximo 2MB');
        return;
    }

    console.log('✅ Arquivo válido, convertendo para base64...');
    currentLogoFile = file;

    // Convert to base64 for preview and storage
    const reader = new FileReader();
    reader.onload = function (e) {
        const base64 = e.target.result;
        console.log('✅ Base64 gerado, tamanho:', base64.length);
        currentLogo = base64;
        currentLogoUrl = base64; // Store base64 for saving
        displayLogo(base64);
        console.log('✅ Logo exibida');
    };
    reader.onerror = function (e) {
        console.error('❌ Erro ao ler arquivo:', e);
    };
    reader.readAsDataURL(file);
}

function displayLogo(src) {
    const logoImage = document.getElementById('logoImage');
    const logoIcon = document.getElementById('logoIcon');

    console.log('🖼️ displayLogo chamado, src length:', src?.length);
    console.log('🖼️ logoImage:', logoImage);
    console.log('🖼️ logoIcon:', logoIcon);

    if (!logoImage || !logoIcon) {
        console.error('❌ Elementos de logo não encontrados!');
        return;
    }

    // Force image update
    logoImage.src = '';
    logoImage.src = src;
    logoImage.classList.remove('hidden');
    logoIcon.classList.add('hidden');

    console.log('🖼️ Logo src atualizado:', logoImage.src.substring(0, 50));
    console.log('🖼️ Logo classes:', logoImage.className);
}

// ============================================
// Identity Visual (Multipart) - Mantido para compatibilidade
// ============================================

async function saveClinicIdentity() {
    try {
        const formData = new FormData();
        const name = document.getElementById('clinicName').value.trim();
        const address = document.getElementById('clinicAddress').value.trim();
        const logoInput = document.getElementById('logoInput');

        formData.append('name', name);
        formData.append('address', address);

        if (logoInput?.files?.[0]) {
            formData.append('logo', logoInput.files[0]);
        }

        const response = await fetch('/api/clinic/settings', {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao salvar identidade visual');
        }

        const logoUrl = data.logo_url || currentLogo || '';
        if (logoUrl) {
            displayLogo(logoUrl);
        }

        currentLogoUrl = logoUrl || currentLogoUrl;
        currentLogoFile = null;

        sessionStorage.setItem('clinicName', data.name || name);
        if (logoUrl) {
            sessionStorage.setItem('clinicLogoUrl', logoUrl);
        }

        const headerName = document.getElementById('clinicHeaderName');
        if (headerName) {
            headerName.textContent = data.name || name || 'Clínica';
        }

        const headerLogo = document.getElementById('clinicHeaderLogo');
        const headerIcon = document.getElementById('clinicHeaderIcon');
        if (logoUrl) {
            if (headerLogo) {
                headerLogo.src = logoUrl;
                headerLogo.classList.remove('hidden');
                if (headerIcon) headerIcon.classList.add('hidden');
            } else if (headerIcon?.parentElement) {
                const img = document.createElement('img');
                img.id = 'clinicHeaderLogo';
                img.src = logoUrl;
                img.alt = 'Logo';
                img.className = 'w-10 h-10 rounded-lg object-cover border border-white/20';
                headerIcon.parentElement.replaceChild(img, headerIcon);
            }
        }

        showNotification('✅ Identidade visual atualizada!', 'success');
    } catch (error) {
        console.error('❌ Erro ao salvar identidade visual:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// ============================================
// Insurance Plans Management
// ============================================

function addInsurance() {
    const input = document.getElementById('newInsuranceInput');
    const value = input.value.trim();

    if (!value) {
        alert('Digite o nome do convênio');
        return;
    }

    if (insurancePlans.includes(value)) {
        alert('Este convênio já foi adicionado');
        return;
    }

    insurancePlans.push(value);
    input.value = '';
    renderInsuranceTags();

    console.log('✅ Convênio adicionado:', value);
}

function removeInsurance(index) {
    const removed = insurancePlans.splice(index, 1);
    renderInsuranceTags();
    console.log('🗑️ Convênio removido:', removed[0]);
}

function renderInsuranceTags() {
    const container = document.getElementById('insuranceTagsList');

    if (insurancePlans.length === 0) {
        container.innerHTML = `
            <div class="text-gray-400 text-sm w-full text-center py-8">
                <i class="fas fa-tags text-3xl mb-2 block"></i>
                Nenhum convênio cadastrado ainda
            </div>
        `;
        return;
    }

    container.innerHTML = insurancePlans
        .map(
            (plan, index) => `
        <div class="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2 hover:from-purple-500/30 hover:to-pink-500/30 transition">
            <i class="fas fa-hospital-alt"></i>
            <span>${plan}</span>
            <button 
                onclick="removeInsurance(${index})"
                class="ml-2 hover:text-red-400 transition"
                title="Remover"
            >
                <i class="fas fa-times"></i>
            </button>
        </div>
    `
        )
        .join('');
}

// ============================================
// Specialties Management
// ============================================

function addSpecialty() {
    const input = document.getElementById('newSpecialtyInput');
    const value = input.value.trim();

    if (!value) {
        alert('Digite o nome da especialidade');
        return;
    }

    if (specialties.includes(value)) {
        alert('Esta especialidade já foi adicionada');
        return;
    }

    specialties.push(value);
    input.value = '';
    renderSpecialtiesTags();

    console.log('✅ Especialidade adicionada:', value);
}

function removeSpecialty(index) {
    const removed = specialties.splice(index, 1);
    renderSpecialtiesTags();
    console.log('🗑️ Especialidade removida:', removed[0]);
}

function renderSpecialtiesTags() {
    const container = document.getElementById('specialtiesTagsList');

    if (!container) return;

    if (specialties.length === 0) {
        container.innerHTML = `
            <div class="text-gray-400 text-sm w-full text-center py-4">
                <i class="fas fa-user-md text-2xl mb-2 block"></i>
                Nenhuma especialidade cadastrada
            </div>
        `;
        return;
    }

    container.innerHTML = specialties
        .map(
            (specialty, index) => `
        <div class="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center space-x-2 hover:from-purple-500/30 hover:to-pink-500/30 transition">
            <i class="fas fa-stethoscope"></i>
            <span>${specialty}</span>
            <button 
                onclick="removeSpecialty(${index})"
                class="ml-2 hover:text-red-400 transition"
                title="Remover"
            >
                <i class="fas fa-times"></i>
            </button>
        </div>
    `
        )
        .join('');
}

// ============================================
// Global function exports for HTML onclick
// ============================================
window.addSpecialty = addSpecialty;
window.removeSpecialty = removeSpecialty;
window.switchTab = switchTab;
window.handleLogoUpload = handleLogoUpload;
window.displayLogo = displayLogo;
window.openNewUserModal = openNewUserModal;
window.closeNewUserModal = closeNewUserModal;
window.handleCreateUser = handleCreateUser;
window.deleteUser = deleteUser;
window.filterUsers = filterUsers;
window.addInsurance = addInsurance;
window.removeInsurance = removeInsurance;
window.saveClinicSettings = saveClinicSettings;
window.requestUpgrade = requestUpgrade;
window.logout = logout;
