/**
 * Settings Page - Team Management
 * Clinic Admin can create, list, and delete staff users
 */

// ============================================
// Interfaces
// ============================================
interface SettingsUser {
    id: number;
    name: string;
    username?: string;
    email?: string;
    role: string;
}

interface ClinicInfo {
    name?: string;
    plan_tier?: string;
    status?: string;
    owner_name?: string;
    owner_email?: string;
    total_users?: number;
    max_users?: number;
    total_leads?: number;
    total_patients?: number;
    max_patients?: number;
    trial?: { is_expiring_soon: boolean; days_left: number };
}

interface ClinicSettings {
    identity?: { name?: string; phone?: string; address?: string; logo?: string };
    hours?: {
        opening?: string;
        closing?: string;
        lunchStart?: string;
        lunchEnd?: string;
        workingDays?: string[];
    };
    insurancePlans?: string[];
    chatbot?: { greeting?: string; awayMessage?: string; instructions?: string };
    appointments?: {
        defaultDuration?: string;
        interval?: string;
        minAdvance?: string;
        maxAdvance?: string;
    };
    pricing?: { firstConsult?: string; return?: string; exam?: string; freeReturn?: boolean };
    notifications?: {
        reminderHours?: string;
        confirmationEnabled?: boolean;
        reminderMessage?: string;
    };
    specialties?: string[];
    documents?: { header?: string; footer?: string };
    security?: { sessionTimeout?: string; allowMultipleLogins?: boolean };
}

// ============================================
// External Declarations
// ============================================
declare const ClinicService: {
    fetchClinicInfo(): Promise<ClinicInfo | null>;
    showTrialBanner(): void;
    checkUserLimit(): Promise<{ canAdd: boolean }>;
    showLimitAlert(type: string): void;
    getPlanBadgeHTML(plan: string): string;
    requestUpgrade(plan: string): Promise<void>;
};

declare global {
    interface Window {
        addSpecialty: typeof addSpecialty;
        removeSpecialty: typeof removeSpecialty;
        switchTab: typeof switchTab;
        handleLogoUpload: typeof handleLogoUpload;
        displayLogo: typeof displayLogo;
        openNewUserModal: typeof openNewUserModal;
        closeNewUserModal: typeof closeNewUserModal;
        handleCreateUser: typeof handleCreateUser;
        deleteUser: typeof deleteUser;
        filterUsers: typeof filterUsers;
        addInsurance: typeof addInsurance;
        removeInsurance: typeof removeInsurance;
        saveClinicSettings: typeof saveClinicSettings;
        requestUpgrade: typeof requestUpgrade;
    }
}

// ============================================
// Authentication & Authorization Check
// ============================================
const token: string | null =
    sessionStorage.getItem('MEDICAL_CRM_TOKEN') || sessionStorage.getItem('token');
const userRole: string | null = sessionStorage.getItem('userRole');

if (!token) {
    showToast({ message: 'Sessão inválida. Faça login novamente.', type: 'warning' });
    window.location.href = '/login.html';
}

// PROTECTION: Staff cannot access this page
if (userRole === 'staff') {
    showToast({
        message: 'Acesso negado. Apenas administradores podem acessar esta página.',
        type: 'warning',
    });
    window.location.href = '/agenda.html';
}

// ============================================
// State Management
// ============================================
let allUsers: SettingsUser[] = [];
let filteredUsers: SettingsUser[] = [];
let insurancePlans: string[] = [];
let specialties: string[] = [];
let currentLogo: string | null = null;
let currentLogoFile: File | null = null;
let currentLogoUrl: string | null = null;

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();

    // Set user name in sidebar if available
    const userName: string | null = sessionStorage.getItem('userName');
    if (userName) {
        const userNameEl: HTMLElement | null = document.getElementById('userName');
        if (userNameEl) userNameEl.textContent = userName;
    }

    const params: URLSearchParams = new URLSearchParams(window.location.search);
    const rawTab: string | null = params.get('tab');
    const initialTab: string | null = rawTab === 'plan' ? 'plano' : rawTab;

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
function switchTab(tabName: string): void {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach((btn: Element) => {
        btn.classList.remove('active');
        btn.classList.add('text-gray-400');
    });

    const activeTab: HTMLElement | null = document.getElementById(
        `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`
    );
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.classList.remove('text-gray-400');
    }

    // Update content
    document.querySelectorAll('.tab-content').forEach((content: Element) => {
        content.classList.add('hidden');
    });

    const activeContent: HTMLElement | null = document.getElementById(
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
async function loadUsers(): Promise<void> {
    try {
        showLoading(true);

        const response: Response = await fetch('/api/users', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                showToast({ message: 'Sessão expirada. Faça login novamente.', type: 'warning' });
                window.location.href = '/login.html';
                return;
            }
            throw new Error('Erro ao carregar usuários');
        }

        allUsers = (await response.json()) as SettingsUser[];
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
function renderUsers(users: SettingsUser[]): void {
    const tableBody: HTMLElement | null = document.getElementById('usersTableBody');
    const emptyState: HTMLElement | null = document.getElementById('emptyState');

    if (!tableBody || !emptyState) return;

    tableBody.innerHTML = '';

    if (users.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    users.forEach((user: SettingsUser) => {
        const row: HTMLTableRowElement = document.createElement('tr');
        row.className = 'user-row border-b border-white/5';

        // Determine role badge
        const isAdmin: boolean = user.role === 'clinic_admin' || user.role === 'admin';
        const roleBadge: string = isAdmin
            ? '<span class="badge-admin px-3 py-1 rounded-full text-xs font-bold text-white"><i class="fas fa-crown mr-1"></i>Admin</span>'
            : '<span class="badge-staff px-3 py-1 rounded-full text-xs font-bold text-white"><i class="fas fa-user mr-1"></i>Secretária</span>';

        // Status badge
        const statusBadge: string =
            '<span class="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold"><i class="fas fa-check-circle mr-1"></i>Ativo</span>';

        row.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex items-center">
                    ${buildAvatarHTML(user.name, 'md')}
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
function filterUsers(): void {
    const searchInput: HTMLInputElement | null = document.getElementById(
        'searchUser'
    ) as HTMLInputElement | null;
    const searchTerm: string = (searchInput?.value || '').toLowerCase();

    filteredUsers = allUsers.filter((user: SettingsUser) => {
        const nameMatch: boolean = user.name.toLowerCase().includes(searchTerm);
        const emailMatch: boolean = (user.username || user.email || '')
            .toLowerCase()
            .includes(searchTerm);
        return nameMatch || emailMatch;
    });

    renderUsers(filteredUsers);
}

// ============================================
// Modal Management
// ============================================
async function openNewUserModal(): Promise<void> {
    if (window.ClinicService) {
        const limit: { canAdd: boolean } = await ClinicService.checkUserLimit();
        if (!limit.canAdd) {
            ClinicService.showLimitAlert('user');
            return;
        }
    }

    const modal: HTMLElement | null = document.getElementById('newUserModal');
    if (modal) modal.classList.remove('hidden');

    const form: HTMLFormElement | null = document.getElementById(
        'newUserForm'
    ) as HTMLFormElement | null;
    if (form) form.reset();

    const formError: HTMLElement | null = document.getElementById('formError');
    if (formError) formError.classList.add('hidden');
}

// ============================================
// Plano & Limites
// ============================================
async function loadPlanInfo(): Promise<void> {
    if (!window.ClinicService) return;

    const clinic: ClinicInfo | null = await ClinicService.fetchClinicInfo();
    if (!clinic) return;

    const planBadgeEl: HTMLElement | null = document.getElementById('planBadge');
    if (planBadgeEl) {
        planBadgeEl.innerHTML = ClinicService.getPlanBadgeHTML(clinic.plan_tier || 'basic');
    }

    const clinicNameEl: HTMLElement | null = document.getElementById('planClinicName');
    if (clinicNameEl) clinicNameEl.textContent = clinic.name || 'Clínica';

    const statusEl: HTMLElement | null = document.getElementById('planStatus');
    if (statusEl) {
        const statusMap: Record<string, string> = {
            active: 'Ativa',
            trial: 'Trial',
            suspended: 'Suspensa',
            cancelled: 'Cancelada',
        };
        statusEl.textContent = statusMap[clinic.status || ''] || clinic.status || '-';
        statusEl.className =
            clinic.status === 'suspended'
                ? 'text-red-400 font-semibold'
                : clinic.status === 'trial'
                  ? 'text-yellow-400 font-semibold'
                  : 'text-green-400 font-semibold';
    }

    const ownerEl: HTMLElement | null = document.getElementById('planOwner');
    if (ownerEl) ownerEl.textContent = clinic.owner_name || clinic.owner_email || '-';

    const usersUsed: number = Number(clinic.total_users || 0);
    const usersMax: number = Number(clinic.max_users || 0);
    const usersPercent: number =
        usersMax > 0 ? Math.min(100, Math.round((usersUsed / usersMax) * 100)) : 0;

    const patientsUsed: number = Number(clinic.total_leads || clinic.total_patients || 0);
    const patientsMax: number = Number(clinic.max_patients || 0);
    const patientsPercent: number =
        patientsMax > 0 ? Math.min(100, Math.round((patientsUsed / patientsMax) * 100)) : 0;

    const planUsersUsedEl: HTMLElement | null = document.getElementById('planUsersUsed');
    const planUsersMaxEl: HTMLElement | null = document.getElementById('planUsersMax');
    const planUsersPercentEl: HTMLElement | null = document.getElementById('planUsersPercent');
    const planUsersProgressEl: HTMLElement | null = document.getElementById('planUsersProgress');

    if (planUsersUsedEl) planUsersUsedEl.textContent = String(usersUsed);
    if (planUsersMaxEl) planUsersMaxEl.textContent = String(usersMax);
    if (planUsersPercentEl) planUsersPercentEl.textContent = String(usersPercent);
    if (planUsersProgressEl) planUsersProgressEl.style.width = `${usersPercent}%`;

    const planPatientsUsedEl: HTMLElement | null = document.getElementById('planPatientsUsed');
    const planPatientsMaxEl: HTMLElement | null = document.getElementById('planPatientsMax');
    const planPatientsPercentEl: HTMLElement | null =
        document.getElementById('planPatientsPercent');
    const planPatientsProgressEl: HTMLElement | null =
        document.getElementById('planPatientsProgress');

    if (planPatientsUsedEl) planPatientsUsedEl.textContent = String(patientsUsed);
    if (planPatientsMaxEl) planPatientsMaxEl.textContent = String(patientsMax);
    if (planPatientsPercentEl) planPatientsPercentEl.textContent = String(patientsPercent);
    if (planPatientsProgressEl) planPatientsProgressEl.style.width = `${patientsPercent}%`;

    if (clinic.trial && clinic.trial.is_expiring_soon) {
        const planTrialEl: HTMLElement | null = document.getElementById('planTrial');
        const planTrialTextEl: HTMLElement | null = document.getElementById('planTrialText');
        if (planTrialEl && planTrialTextEl) {
            planTrialTextEl.textContent = `Seu trial expira em ${clinic.trial.days_left} dia(s).`;
            planTrialEl.classList.remove('hidden');
        }
    }
}

async function requestUpgrade(plan: string): Promise<void> {
    if (!window.ClinicService) return;

    const confirmed: boolean = await showConfirmModal({
        title: 'Upgrade de Plano',
        message: `Deseja solicitar upgrade para o plano ${plan}?`,
        confirmText: 'Solicitar',
        cancelText: 'Cancelar',
        variant: 'info',
        icon: 'fa-arrow-up',
    });
    if (!confirmed) return;

    try {
        await ClinicService.requestUpgrade(plan);
        showNotification('Solicitação de upgrade enviada com sucesso!', 'success');
    } catch (error) {
        console.error(error);
        showNotification((error as Error).message || 'Erro ao solicitar upgrade', 'error');
    }
}

function closeNewUserModal(): void {
    const modal: HTMLElement | null = document.getElementById('newUserModal');
    if (modal) modal.classList.add('hidden');
}

// ============================================
// Create User
// ============================================
async function handleCreateUser(event: Event): Promise<void> {
    event.preventDefault();

    // Get form elements - using unique IDs to avoid conflict with sidebar
    const nameEl: HTMLInputElement | null = document.getElementById(
        'newUserName'
    ) as HTMLInputElement | null;
    const emailEl: HTMLInputElement | null = document.getElementById(
        'newUserEmail'
    ) as HTMLInputElement | null;
    const passwordEl: HTMLInputElement | null = document.getElementById(
        'newUserPassword'
    ) as HTMLInputElement | null;
    const passwordConfirmEl: HTMLInputElement | null = document.getElementById(
        'newUserPasswordConfirm'
    ) as HTMLInputElement | null;
    const isAdminEl: HTMLInputElement | null = document.getElementById(
        'newUserIsAdmin'
    ) as HTMLInputElement | null;

    // Validate elements exist
    if (!nameEl || !emailEl || !passwordEl || !passwordConfirmEl) {
        showFormError('Erro interno: elementos do formulário não encontrados');
        return;
    }

    // Safe value extraction
    const name: string = (nameEl.value || '').trim();
    const email: string = (emailEl.value || '').trim();
    const password: string = passwordEl.value || '';
    const passwordConfirm: string = passwordConfirmEl.value || '';
    const isAdmin: boolean = isAdminEl ? isAdminEl.checked : false;

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

    const submitBtn: HTMLButtonElement | null = document.getElementById(
        'submitBtn'
    ) as HTMLButtonElement | null;
    const originalText: string = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Criando...';
    }

    try {
        const response: Response = await fetch('/api/users', {
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

        const data: { error?: string } = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao criar usuário');
        }

        console.log('✅ Usuário criado:', data);

        showNotification(`✅ Usuário ${name} criado com sucesso!`, 'success');

        closeNewUserModal();
        await loadUsers();
    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error);
        showFormError((error as Error).message);
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
async function deleteUser(userId: number, userName: string): Promise<void> {
    const confirmed: boolean = await showConfirmModal({
        title: 'Remover Usuário',
        message: `Tem certeza que deseja remover o usuário "${userName}"?\n\nEsta ação não pode ser desfeita.`,
        confirmText: 'Remover',
        cancelText: 'Cancelar',
        variant: 'danger',
        icon: 'fa-user-times',
    });
    if (!confirmed) {
        return;
    }

    try {
        const response: Response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data: { error?: string } = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao remover usuário');
        }

        console.log('✅ Usuário removido:', userId);

        showNotification(`✅ Usuário ${userName} removido com sucesso!`, 'success');

        await loadUsers();
    } catch (error) {
        console.error('❌ Erro ao deletar usuário:', error);
        showNotification(`❌ ${(error as Error).message}`, 'error');
    }
}

// ============================================
// UI Helper Functions
// ============================================
function showLoading(show: boolean): void {
    const tableBody: HTMLElement | null = document.getElementById('usersTableBody');
    if (!tableBody) return;

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

function showFormError(message: string): void {
    const errorDiv: HTMLElement | null = document.getElementById('formError');
    const errorText: HTMLElement | null = document.getElementById('errorText');
    if (!errorDiv || !errorText) return;

    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
}

function showNotification(message: string, type: string = 'success'): void {
    const toast: HTMLElement | null = document.getElementById('notificationToast');
    const icon: HTMLElement | null = document.getElementById('toastIcon');
    const text: HTMLElement | null = document.getElementById('toastMessage');

    if (!toast || !icon || !text) return;

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

declare function showToast(options: {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
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

declare function buildAvatarHTML(name: string, size?: 'sm' | 'md' | 'lg' | 'xl'): string;

async function logout(): Promise<void> {
    const confirmed = await showConfirmModal({
        title: 'Sair do Sistema',
        message: 'Deseja realmente sair do sistema?',
        confirmText: 'Sair',
        cancelText: 'Cancelar',
        icon: 'fa-sign-out-alt',
        variant: 'danger',
    });
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
async function loadClinicSettings(): Promise<void> {
    try {
        const response: Response = await fetch('/api/clinic/settings', {
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

        const settings: ClinicSettings = await response.json();

        console.log('✅ Configurações carregadas:', settings);

        // Populate Identity Fields
        if (settings.identity) {
            const clinicNameInput: HTMLInputElement | null = document.getElementById(
                'clinicName'
            ) as HTMLInputElement | null;
            const clinicPhoneInput: HTMLInputElement | null = document.getElementById(
                'clinicPhone'
            ) as HTMLInputElement | null;
            const clinicAddressInput: HTMLInputElement | null = document.getElementById(
                'clinicAddress'
            ) as HTMLInputElement | null;

            if (clinicNameInput) clinicNameInput.value = settings.identity.name || '';
            if (clinicPhoneInput) clinicPhoneInput.value = settings.identity.phone || '';
            if (clinicAddressInput) clinicAddressInput.value = settings.identity.address || '';

            if (settings.identity.logo) {
                currentLogoUrl = settings.identity.logo;
                displayLogo(settings.identity.logo);
            }
        }

        // Populate Hours
        if (settings.hours) {
            const openingHour: HTMLInputElement | null = document.getElementById(
                'openingHour'
            ) as HTMLInputElement | null;
            const closingHour: HTMLInputElement | null = document.getElementById(
                'closingHour'
            ) as HTMLInputElement | null;
            const lunchStart: HTMLInputElement | null = document.getElementById(
                'lunchStart'
            ) as HTMLInputElement | null;
            const lunchEnd: HTMLInputElement | null = document.getElementById(
                'lunchEnd'
            ) as HTMLInputElement | null;

            if (openingHour) openingHour.value = settings.hours.opening || '08:00';
            if (closingHour) closingHour.value = settings.hours.closing || '18:00';
            if (lunchStart) lunchStart.value = settings.hours.lunchStart || '';
            if (lunchEnd) lunchEnd.value = settings.hours.lunchEnd || '';

            // Working days
            const days: string[] = settings.hours.workingDays || [
                'Seg',
                'Ter',
                'Qua',
                'Qui',
                'Sex',
            ];
            (['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'] as const).forEach((day: string) => {
                const checkbox: HTMLInputElement | null = document.getElementById(
                    `day${day}`
                ) as HTMLInputElement | null;
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
            const chatGreeting: HTMLTextAreaElement | null = document.getElementById(
                'chatGreeting'
            ) as HTMLTextAreaElement | null;
            const chatAwayMessage: HTMLTextAreaElement | null = document.getElementById(
                'chatAwayMessage'
            ) as HTMLTextAreaElement | null;
            const chatInstructions: HTMLTextAreaElement | null = document.getElementById(
                'chatInstructions'
            ) as HTMLTextAreaElement | null;

            if (chatGreeting) chatGreeting.value = settings.chatbot.greeting || '';
            if (chatAwayMessage) chatAwayMessage.value = settings.chatbot.awayMessage || '';
            if (chatInstructions) chatInstructions.value = settings.chatbot.instructions || '';
        }

        // Populate Appointment Settings
        if (settings.appointments) {
            const defaultDuration: HTMLInputElement | null = document.getElementById(
                'defaultDuration'
            ) as HTMLInputElement | null;
            const appointmentInterval: HTMLInputElement | null = document.getElementById(
                'appointmentInterval'
            ) as HTMLInputElement | null;
            const minAdvance: HTMLInputElement | null = document.getElementById(
                'minAdvance'
            ) as HTMLInputElement | null;
            const maxAdvance: HTMLInputElement | null = document.getElementById(
                'maxAdvance'
            ) as HTMLInputElement | null;

            if (defaultDuration)
                defaultDuration.value = settings.appointments.defaultDuration || '30';
            if (appointmentInterval)
                appointmentInterval.value = settings.appointments.interval || '10';
            if (minAdvance) minAdvance.value = settings.appointments.minAdvance || '2';
            if (maxAdvance) maxAdvance.value = settings.appointments.maxAdvance || '30';
        }

        // Populate Pricing
        if (settings.pricing) {
            const priceFirst: HTMLInputElement | null = document.getElementById(
                'priceFirstConsult'
            ) as HTMLInputElement | null;
            const priceReturn: HTMLInputElement | null = document.getElementById(
                'priceReturn'
            ) as HTMLInputElement | null;
            const priceExam: HTMLInputElement | null = document.getElementById(
                'priceExam'
            ) as HTMLInputElement | null;
            const freeReturn: HTMLInputElement | null = document.getElementById(
                'freeReturn'
            ) as HTMLInputElement | null;

            if (priceFirst) priceFirst.value = settings.pricing.firstConsult || '';
            if (priceReturn) priceReturn.value = settings.pricing.return || '';
            if (priceExam) priceExam.value = settings.pricing.exam || '';
            if (freeReturn) freeReturn.checked = settings.pricing.freeReturn || false;
        }

        // Populate Notifications
        if (settings.notifications) {
            const reminderHours: HTMLInputElement | null = document.getElementById(
                'reminderHours'
            ) as HTMLInputElement | null;
            const confirmationEnabled: HTMLInputElement | null = document.getElementById(
                'confirmationEnabled'
            ) as HTMLInputElement | null;
            const reminderMessage: HTMLTextAreaElement | null = document.getElementById(
                'reminderMessage'
            ) as HTMLTextAreaElement | null;

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
            const documentHeader: HTMLTextAreaElement | null = document.getElementById(
                'documentHeader'
            ) as HTMLTextAreaElement | null;
            const documentFooter: HTMLTextAreaElement | null = document.getElementById(
                'documentFooter'
            ) as HTMLTextAreaElement | null;

            if (documentHeader) documentHeader.value = settings.documents.header || '';
            if (documentFooter) documentFooter.value = settings.documents.footer || '';
        }

        // Populate Security
        if (settings.security) {
            const sessionTimeout: HTMLInputElement | null = document.getElementById(
                'sessionTimeout'
            ) as HTMLInputElement | null;
            const allowMultipleLogins: HTMLInputElement | null = document.getElementById(
                'allowMultipleLogins'
            ) as HTMLInputElement | null;

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
async function saveClinicSettings(): Promise<void> {
    const submitBtn: HTMLButtonElement | null = document.getElementById(
        'saveSettingsBtn'
    ) as HTMLButtonElement | null;
    if (!submitBtn) return;

    const originalText: string = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';

        // If there's a new logo file, upload it first via PATCH
        if (currentLogoFile) {
            console.log('📤 Uploading new logo file...');
            const formData: FormData = new FormData();
            formData.append('logo', currentLogoFile);
            formData.append(
                'name',
                (document.getElementById('clinicName') as HTMLInputElement)?.value.trim() || ''
            );
            formData.append(
                'address',
                (document.getElementById('clinicAddress') as HTMLInputElement)?.value.trim() || ''
            );

            const uploadResponse: Response = await fetch('/api/clinic/settings', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (uploadResponse.ok) {
                const uploadData: { logo_url?: string } = await uploadResponse.json();
                currentLogoUrl = uploadData.logo_url || currentLogoUrl;
                currentLogoFile = null; // Clear the file reference
                console.log('✅ Logo uploaded:', currentLogoUrl);
            } else {
                console.error('❌ Failed to upload logo');
            }
        }

        // Gather working days
        const workingDays: string[] = [];
        (['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'] as const).forEach((day: string) => {
            const checkbox: HTMLInputElement | null = document.getElementById(
                `day${day}`
            ) as HTMLInputElement | null;
            if (checkbox && checkbox.checked) {
                workingDays.push(day);
            }
        });

        // Build payload - use the uploaded logo URL
        const payload: ClinicSettings = {
            identity: {
                name:
                    (document.getElementById('clinicName') as HTMLInputElement)?.value.trim() || '',
                phone:
                    (document.getElementById('clinicPhone') as HTMLInputElement)?.value.trim() ||
                    '',
                address:
                    (document.getElementById('clinicAddress') as HTMLInputElement)?.value.trim() ||
                    '',
                logo: currentLogoUrl || undefined,
            },
            hours: {
                opening: (document.getElementById('openingHour') as HTMLInputElement)?.value || '',
                closing: (document.getElementById('closingHour') as HTMLInputElement)?.value || '',
                lunchStart:
                    (document.getElementById('lunchStart') as HTMLInputElement)?.value || '',
                lunchEnd: (document.getElementById('lunchEnd') as HTMLInputElement)?.value || '',
                workingDays: workingDays,
            },
            insurancePlans: insurancePlans,
            chatbot: {
                greeting:
                    (
                        document.getElementById('chatGreeting') as HTMLTextAreaElement
                    )?.value.trim() || '',
                awayMessage:
                    (
                        document.getElementById('chatAwayMessage') as HTMLTextAreaElement
                    )?.value.trim() || '',
                instructions:
                    (
                        document.getElementById('chatInstructions') as HTMLTextAreaElement
                    )?.value.trim() || '',
            },
            appointments: {
                defaultDuration:
                    (document.getElementById('defaultDuration') as HTMLInputElement)?.value || '30',
                interval:
                    (document.getElementById('appointmentInterval') as HTMLInputElement)?.value ||
                    '10',
                minAdvance:
                    (document.getElementById('minAdvance') as HTMLInputElement)?.value || '2',
                maxAdvance:
                    (document.getElementById('maxAdvance') as HTMLInputElement)?.value || '30',
            },
            pricing: {
                firstConsult:
                    (document.getElementById('priceFirstConsult') as HTMLInputElement)?.value || '',
                return: (document.getElementById('priceReturn') as HTMLInputElement)?.value || '',
                exam: (document.getElementById('priceExam') as HTMLInputElement)?.value || '',
                freeReturn:
                    (document.getElementById('freeReturn') as HTMLInputElement)?.checked || false,
            },
            notifications: {
                reminderHours:
                    (document.getElementById('reminderHours') as HTMLInputElement)?.value || '24',
                confirmationEnabled:
                    (document.getElementById('confirmationEnabled') as HTMLInputElement)
                        ?.checked !== false,
                reminderMessage:
                    (
                        document.getElementById('reminderMessage') as HTMLTextAreaElement
                    )?.value.trim() || '',
            },
            specialties: specialties,
            documents: {
                header:
                    (
                        document.getElementById('documentHeader') as HTMLTextAreaElement
                    )?.value.trim() || '',
                footer:
                    (
                        document.getElementById('documentFooter') as HTMLTextAreaElement
                    )?.value.trim() || '',
            },
            security: {
                sessionTimeout:
                    (document.getElementById('sessionTimeout') as HTMLInputElement)?.value || '120',
                allowMultipleLogins:
                    (document.getElementById('allowMultipleLogins') as HTMLInputElement)
                        ?.checked !== false,
            },
        };

        console.log('📤 Enviando configurações:', payload);

        const response: Response = await fetch('/api/clinic/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const data: { error?: string } = await response.json();

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
        showNotification(`❌ ${(error as Error).message}`, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Salvar Alterações';
    }
}

// ============================================
// Logo Upload Handler
// ============================================

function handleLogoUpload(event: Event): void {
    console.log('🖼️ handleLogoUpload chamado', event);
    const input: HTMLInputElement = event.target as HTMLInputElement;
    const file: File | undefined = input.files?.[0];
    console.log('📁 Arquivo selecionado:', file);

    if (!file) {
        console.log('❌ Nenhum arquivo selecionado');
        return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        console.log('❌ Tipo inválido:', file.type);
        showToast({
            message: 'Por favor, selecione uma imagem válida (PNG, JPG)',
            type: 'warning',
        });
        return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
        console.log('❌ Arquivo muito grande:', file.size);
        showToast({ message: 'A imagem deve ter no máximo 2MB', type: 'warning' });
        return;
    }

    console.log('✅ Arquivo válido, convertendo para base64...');
    currentLogoFile = file;

    // Convert to base64 for preview and storage
    const reader: FileReader = new FileReader();
    reader.onload = function (e: ProgressEvent<FileReader>): void {
        const base64: string = e.target?.result as string;
        console.log('✅ Base64 gerado, tamanho:', base64.length);
        currentLogo = base64;
        currentLogoUrl = base64; // Store base64 for saving
        displayLogo(base64);
        console.log('✅ Logo exibida');
    };
    reader.onerror = function (e: ProgressEvent<FileReader>): void {
        console.error('❌ Erro ao ler arquivo:', e);
    };
    reader.readAsDataURL(file);
}

function displayLogo(src: string): void {
    const logoImage: HTMLImageElement | null = document.getElementById(
        'logoImage'
    ) as HTMLImageElement | null;
    const logoIcon: HTMLElement | null = document.getElementById('logoIcon');

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

async function saveClinicIdentity(): Promise<void> {
    try {
        const formData: FormData = new FormData();
        const name: string =
            (document.getElementById('clinicName') as HTMLInputElement)?.value.trim() || '';
        const address: string =
            (document.getElementById('clinicAddress') as HTMLInputElement)?.value.trim() || '';
        const logoInput: HTMLInputElement | null = document.getElementById(
            'logoInput'
        ) as HTMLInputElement | null;

        formData.append('name', name);
        formData.append('address', address);

        if (logoInput?.files?.[0]) {
            formData.append('logo', logoInput.files[0]);
        }

        const response: Response = await fetch('/api/clinic/settings', {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        const data: { error?: string; logo_url?: string; name?: string } = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao salvar identidade visual');
        }

        const logoUrl: string = data.logo_url || currentLogo || '';
        if (logoUrl) {
            displayLogo(logoUrl);
        }

        currentLogoUrl = logoUrl || currentLogoUrl;
        currentLogoFile = null;

        sessionStorage.setItem('clinicName', data.name || name);
        if (logoUrl) {
            sessionStorage.setItem('clinicLogoUrl', logoUrl);
        }

        const headerName: HTMLElement | null = document.getElementById('clinicHeaderName');
        if (headerName) {
            headerName.textContent = data.name || name || 'Clínica';
        }

        const headerLogo: HTMLImageElement | null = document.getElementById(
            'clinicHeaderLogo'
        ) as HTMLImageElement | null;
        const headerIcon: HTMLElement | null = document.getElementById('clinicHeaderIcon');
        if (logoUrl) {
            if (headerLogo) {
                headerLogo.src = logoUrl;
                headerLogo.classList.remove('hidden');
                if (headerIcon) headerIcon.classList.add('hidden');
            } else if (headerIcon?.parentElement) {
                const img: HTMLImageElement = document.createElement('img');
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
        showNotification(`❌ ${(error as Error).message}`, 'error');
    }
}

// ============================================
// Insurance Plans Management
// ============================================

function addInsurance(): void {
    const input: HTMLInputElement | null = document.getElementById(
        'newInsuranceInput'
    ) as HTMLInputElement | null;
    if (!input) return;

    const value: string = input.value.trim();

    if (!value) {
        showToast({ message: 'Digite o nome do convênio', type: 'warning' });
        return;
    }

    if (insurancePlans.includes(value)) {
        showToast({ message: 'Este convênio já foi adicionado', type: 'warning' });
        return;
    }

    insurancePlans.push(value);
    input.value = '';
    renderInsuranceTags();

    console.log('✅ Convênio adicionado:', value);
}

function removeInsurance(index: number): void {
    const removed: string[] = insurancePlans.splice(index, 1);
    renderInsuranceTags();
    console.log('🗑️ Convênio removido:', removed[0]);
}

function renderInsuranceTags(): void {
    const container: HTMLElement | null = document.getElementById('insuranceTagsList');
    if (!container) return;

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
            (plan: string, index: number) => `
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

function addSpecialty(): void {
    const input: HTMLInputElement | null = document.getElementById(
        'newSpecialtyInput'
    ) as HTMLInputElement | null;
    if (!input) return;

    const value: string = input.value.trim();

    if (!value) {
        showToast({ message: 'Digite o nome da especialidade', type: 'warning' });
        return;
    }

    if (specialties.includes(value)) {
        showToast({ message: 'Esta especialidade já foi adicionada', type: 'warning' });
        return;
    }

    specialties.push(value);
    input.value = '';
    renderSpecialtiesTags();

    console.log('✅ Especialidade adicionada:', value);
}

function removeSpecialty(index: number): void {
    const removed: string[] = specialties.splice(index, 1);
    renderSpecialtiesTags();
    console.log('🗑️ Especialidade removida:', removed[0]);
}

function renderSpecialtiesTags(): void {
    const container: HTMLElement | null = document.getElementById('specialtiesTagsList');

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
            (specialty: string, index: number) => `
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
(window as unknown as Record<string, unknown>).logout = logout;
