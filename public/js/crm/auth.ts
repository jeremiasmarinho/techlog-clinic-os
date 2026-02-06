// ============================================
// Authentication & User Session Management
// ============================================

declare function showNotification(message: string, type?: string): void;

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

interface User {
    id: number;
    name: string;
    username: string;
    role: string;
}

interface CreateUserResponse {
    error?: string;
}

interface DeleteUserResponse {
    error?: string;
}

// Check authentication on page load
const authToken: string | null =
    sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('accessToken');
const currentUser: string | null = sessionStorage.getItem('userName');

if (!authToken) {
    // Redirect to login if not authenticated
    showToast({ message: 'Sessão inválida. Faça login novamente.', type: 'warning' });
    window.location.href = '/login.html';
}

// Display user name in header
const userNameEl: HTMLElement | null = document.getElementById('userName');
if (userNameEl) {
    userNameEl.textContent = currentUser || 'Usuário';
}
const userNameSidebarEl: HTMLElement | null = document.getElementById('userNameSidebar');
if (userNameSidebarEl) {
    userNameSidebarEl.textContent = currentUser || 'Usuário';
}

// Logout function
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
        window.location.href = '/login.html';
    }
}

// ============================================
// Team Management Functions
// ============================================

async function openTeamModal(): Promise<void> {
    const modal: HTMLElement | null = document.getElementById('teamModal');
    if (modal) {
        modal.classList.remove('hidden');
        await loadUsers();
    }
}

function closeTeamModal(): void {
    const modal: HTMLElement | null = document.getElementById('teamModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

async function loadUsers(): Promise<void> {
    const usersList: HTMLElement | null = document.getElementById('usersList');
    if (!usersList) return;

    usersList.innerHTML =
        '<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-2xl text-indigo-600"></i></div>';

    try {
        const response: Response = await fetch('/api/users');

        if (!response.ok) {
            throw new Error('Erro ao carregar usuários');
        }

        const users: User[] = await response.json();

        if (users.length === 0) {
            usersList.innerHTML =
                '<p class="text-center text-gray-500 py-4">Nenhum usuário cadastrado</p>';
            return;
        }

        const roleIcons: Record<string, string> = {
            admin: '👑',
            medico: '🩺',
            recepcao: '👋',
        };
        const roleLabels: Record<string, string> = {
            admin: 'Administrador',
            medico: 'Médico',
            recepcao: 'Recepção',
        };

        usersList.innerHTML = users
            .map((user: User) => {
                const canDelete: boolean = user.id !== 1; // Proteger admin padrão

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
                    ${
                        canDelete
                            ? `
                        <button onclick="deleteUser(${user.id}, '${user.name}')" class="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-semibold">
                            <i class="fas fa-trash-alt mr-1"></i> Remover
                        </button>
                    `
                            : `
                        <span class="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-semibold">
                            <i class="fas fa-lock mr-1"></i> Protegido
                        </span>
                    `
                    }
                </div>
            `;
            })
            .join('');
    } catch (error: unknown) {
        usersList.innerHTML =
            '<p class="text-center text-red-600 py-4">❌ Erro ao carregar usuários</p>';
    }
}

// Add User Form Handler (initialized when DOM is ready)
document.addEventListener('DOMContentLoaded', (): void => {
    const addUserForm: HTMLFormElement | null = document.getElementById(
        'addUserForm'
    ) as HTMLFormElement | null;
    if (addUserForm) {
        addUserForm.addEventListener('submit', async (e: Event): Promise<void> => {
            e.preventDefault();

            const name: string = (
                document.getElementById('newUserName') as HTMLInputElement
            ).value.trim();
            const username: string = (
                document.getElementById('newUsername') as HTMLInputElement
            ).value
                .trim()
                .toLowerCase();
            const password: string = (document.getElementById('newPassword') as HTMLInputElement)
                .value;
            const role: string = (document.getElementById('newUserRole') as HTMLSelectElement)
                .value;

            if (password.length < 3) {
                showToast({ message: 'A senha deve ter no mínimo 3 caracteres', type: 'warning' });
                return;
            }

            try {
                const response: Response = await fetch('/api/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, username, password, role }),
                });

                const data: CreateUserResponse = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Erro ao criar usuário');
                }

                showNotification(`✅ Usuário ${name} criado com sucesso!`, 'success');

                // Reset form
                addUserForm.reset();

                // Reload users list
                await loadUsers();
            } catch (error: unknown) {
                const errorMsg = error instanceof Error ? error.message : 'Erro ao criar usuário';
                showNotification(`❌ ${errorMsg}`, 'error');
            }
        });
    }
});

async function deleteUser(userId: number, userName: string): Promise<void> {
    const confirmed: boolean = await showConfirmModal({
        title: 'Remover Usuário',
        message: `Deseja realmente remover o usuário "${userName}"?\n\nEsta ação não pode ser desfeita.`,
        confirmText: 'Remover',
        cancelText: 'Cancelar',
        icon: 'fa-user-times',
        variant: 'danger',
    });
    if (!confirmed) {
        return;
    }

    try {
        const response: Response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
        });

        const data: DeleteUserResponse = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro ao remover usuário');
        }

        showNotification(`✅ Usuário ${userName} removido com sucesso!`, 'success');

        // Reload users list
        await loadUsers();
    } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : 'Erro ao deletar usuário';
        showNotification(`❌ ${errorMsg}`, 'error');
    }
}
