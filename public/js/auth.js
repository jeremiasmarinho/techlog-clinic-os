// ============================================
// Authentication & User Session Management
// ============================================

// Check authentication on page load
const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

if (!currentUser) {
    // Redirect to login if not authenticated
    window.location.href = '/login.html';
}

// Display user name in header
if (document.getElementById('userName')) {
    document.getElementById('userName').textContent = currentUser.name;
}

// Show Team Management button only for admins
if (currentUser.role === 'admin' && document.getElementById('teamButton')) {
    document.getElementById('teamButton').classList.remove('hidden');
}

// Logout function
function logout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }
}

// ============================================
// Team Management Functions
// ============================================

async function openTeamModal() {
    const modal = document.getElementById('teamModal');
    if (modal) {
        modal.classList.remove('hidden');
        await loadUsers();
    }
}

function closeTeamModal() {
    const modal = document.getElementById('teamModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function loadUsers() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    usersList.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-2xl text-indigo-600"></i></div>';
    
    try {
        const response = await fetch('/api/users');
        
        if (!response.ok) {
            throw new Error('Erro ao carregar usuários');
        }
        
        const users = await response.json();
        
        if (users.length === 0) {
            usersList.innerHTML = '<p class="text-center text-gray-500 py-4">Nenhum usuário cadastrado</p>';
            return;
        }
        
        usersList.innerHTML = users.map(user => {
            const roleIcons = {
                'admin': '👑',
                'medico': '🩺',
                'recepcao': '👋'
            };
            const roleLabels = {
                'admin': 'Administrador',
                'medico': 'Médico',
                'recepcao': 'Recepção'
            };
            
            const canDelete = user.id !== 1; // Proteger admin padrão
            
            return `
                <div class="flex items-center justify-between bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                    <div class="flex items-center space-x-4">
                        <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">
                            ${roleIcons[user.role] || '👤'}
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-900">${user.name}</h4>
                            <p class="text-sm text-gray-600">@${user.username} • ${roleLabels[user.role] || user.role}</p>
                        </div>
                    </div>
                    ${canDelete ? `
                        <button onclick="deleteUser(${user.id}, '${user.name}')" class="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold">
                            <i class="fas fa-trash-alt mr-1"></i> Remover
                        </button>
                    ` : `
                        <span class="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-semibold">
                            <i class="fas fa-lock mr-1"></i> Protegido
                        </span>
                    `}
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        usersList.innerHTML = '<p class="text-center text-red-600 py-4">❌ Erro ao carregar usuários</p>';
    }
}

// Add User Form Handler (initialized when DOM is ready)
document.addEventListener('DOMContentLoaded', () => {
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('newUserName').value.trim();
            const username = document.getElementById('newUsername').value.trim().toLowerCase();
            const password = document.getElementById('newPassword').value;
            const role = document.getElementById('newUserRole').value;
            
            if (password.length < 3) {
                alert('⚠️ A senha deve ter no mínimo 3 caracteres');
                return;
            }
            
            try {
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, username, password, role })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Erro ao criar usuário');
                }
                
                showNotification(`✅ Usuário ${name} criado com sucesso!`, 'success');
                
                // Reset form
                addUserForm.reset();
                
                // Reload users list
                await loadUsers();
                
            } catch (error) {
                console.error('Erro ao criar usuário:', error);
                showNotification(`❌ ${error.message}`, 'error');
            }
        });
    }
});

async function deleteUser(userId, userName) {
    if (!confirm(`Deseja realmente remover o usuário "${userName}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao remover usuário');
        }
        
        showNotification(`✅ Usuário ${userName} removido com sucesso!`, 'success');
        
        // Reload users list
        await loadUsers();
        
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        showNotification(`❌ ${error.message}`, 'error');
    }
}
