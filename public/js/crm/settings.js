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
let currentLogo = null;

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
});

// ============================================
// Tab Management
// ============================================
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('text-gray-400');
    });
    
    const activeTab = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.classList.remove('text-gray-400');
    }
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    const activeContent = document.getElementById(`content${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    if (activeContent) {
        activeContent.classList.remove('hidden');
    }
    
    // Load clinic settings when switching to Profile tab
    if (tabName === 'perfil' && insurancePlans.length === 0) {
        loadClinicSettings();
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
                'Authorization': `Bearer ${token}`
            }
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
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'user-row border-b border-white/5';
        
        // Determine role badge
        const isAdmin = user.role === 'clinic_admin' || user.role === 'admin';
        const roleBadge = isAdmin 
            ? '<span class="badge-admin px-3 py-1 rounded-full text-xs font-bold text-white"><i class="fas fa-crown mr-1"></i>Admin</span>'
            : '<span class="badge-staff px-3 py-1 rounded-full text-xs font-bold text-white"><i class="fas fa-user mr-1"></i>Secretária</span>';
        
        // Status badge
        const statusBadge = '<span class="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold"><i class="fas fa-check-circle mr-1"></i>Ativo</span>';
        
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
    
    filteredUsers = allUsers.filter(user => {
        const nameMatch = user.name.toLowerCase().includes(searchTerm);
        const emailMatch = (user.username || user.email || '').toLowerCase().includes(searchTerm);
        return nameMatch || emailMatch;
    });
    
    renderUsers(filteredUsers);
}

// ============================================
// Modal Management
// ============================================
function openNewUserModal() {
    document.getElementById('newUserModal').classList.remove('hidden');
    document.getElementById('newUserForm').reset();
    document.getElementById('formError').classList.add('hidden');
}

function closeNewUserModal() {
    document.getElementById('newUserModal').classList.add('hidden');
}

// ============================================
// Create User
// ============================================
async function handleCreateUser(event) {
    event.preventDefault();
    
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const passwordConfirm = document.getElementById('userPasswordConfirm').value;
    const isAdmin = document.getElementById('userIsAdmin').checked;
    
    // Validation
    if (password !== passwordConfirm) {
        showFormError('As senhas não coincidem');
        return;
    }
    
    if (password.length < 6) {
        showFormError('A senha deve ter no mínimo 6 caracteres');
        return;
    }
    
    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Criando...';
    
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                username: email,
                password,
                role: isAdmin ? 'clinic_admin' : 'staff'
            })
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
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ============================================
// Delete User
// ============================================
async function deleteUser(userId, userName) {
    if (!confirm(`⚠️ Tem certeza que deseja remover o usuário "${userName}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
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

function logout() {
 

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
                'Authorization': `Bearer ${token}`
            }
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
            document.getElementById('primaryColor').value = settings.identity.primaryColor || '#06b6d4';
            document.getElementById('primaryColorHex').value = settings.identity.primaryColor || '#06b6d4';
            
            if (settings.identity.logo) {
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
            ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].forEach(day => {
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
        
        // Gather working days
        const workingDays = [];
        ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].forEach(day => {
            const checkbox = document.getElementById(`day${day}`);
            if (checkbox && checkbox.checked) {
                workingDays.push(day);
            }
        });
        
        // Build payload
        const payload = {
            identity: {
                name: document.getElementById('clinicName').value.trim(),
                phone: document.getElementById('clinicPhone').value.trim(),
                address: document.getElementById('clinicAddress').value.trim(),
                primaryColor: document.getElementById('primaryColor').value,
                logo: currentLogo
            },
            hours: {
                opening: document.getElementById('openingHour').value,
                closing: document.getElementById('closingHour').value,
                lunchStart: document.getElementById('lunchStart').value,
                lunchEnd: document.getElementById('lunchEnd').value,
                workingDays: workingDays
            },
            insurancePlans: insurancePlans,
            chatbot: {
                greeting: document.getElementById('chatGreeting').value.trim(),
                awayMessage: document.getElementById('chatAwayMessage').value.trim(),
                instructions: document.getElementById('chatInstructions').value.trim()
            }
        };
        
        console.log('📤 Enviando configurações:', payload);
        
        const response = await fetch('/api/clinic/settings', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
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
            console.log('🗑️ Cache de configurações limpo');
        } catch (e) {
            console.error('Erro ao limpar cache:', e);
        }
        
        showNotification('✅ Configurações salvas com sucesso!', 'success');
        
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
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem válida (PNG, JPG)');
        return;
    }
    
    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB');
        return;
    }
    
    // Read file and convert to Base64
    const reader = new FileReader();
    reader.onload = (e) => {
        const base64 = e.target.result;
        currentLogo = base64;
        displayLogo(base64);
    };
    reader.readAsDataURL(file);
}

function displayLogo(base64) {
    const logoImage = document.getElementById('logoImage');
    const logoIcon = document.getElementById('logoIcon');
    
    logoImage.src = base64;
    logoImage.classList.remove('hidden');
    logoIcon.classList.add('hidden');
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
    
    container.innerHTML = insurancePlans.map((plan, index) => `
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
    `).join('');
}

// ============================================
// Initialize Color Picker Sync
// ============================================

// Color picker sync setup
const colorPicker = document.getElementById('primaryColor');
const colorHex = document.getElementById('primaryColorHex');

if (colorPicker && colorHex) {
    colorPicker.addEventListener('input', (e) => {
        colorHex.value = e.target.value;
    });
    
    colorHex.addEventListener('input', (e) => {
        const hex = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            colorPicker.value = hex;
        }
    });
}   if (confirm('Deseja realmente sair do sistema?')) {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = '/login.html';
    }
}
