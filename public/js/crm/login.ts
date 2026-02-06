/**
 * CRM Login Authentication
 * Handles login form submission and authentication
 */

interface LoginResponse {
    success: boolean;
    error?: string;
    token?: string;
    user?: {
        name: string;
        id: number;
        role: string;
    };
}

const LOGIN_API_URL: string = '/api';

document.addEventListener('DOMContentLoaded', function (): void {
    const loginForm = document.getElementById('loginForm') as HTMLFormElement | null;
    const loginButton = document.getElementById('loginButton') as HTMLButtonElement | null;
    const errorMessage = document.getElementById('errorMessage') as HTMLDivElement | null;
    const errorText = document.getElementById('errorText') as HTMLElement | null;

    // Check if user is already logged in
    const user: string | null = localStorage.getItem('user');
    if (user) {
        window.location.href = '/admin.html';
        return;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e: Event): Promise<void> => {
            e.preventDefault();

            const usernameInput = document.getElementById('username') as HTMLInputElement;
            const passwordInput = document.getElementById('password') as HTMLInputElement;
            const username: string = usernameInput.value.trim();
            const password: string = passwordInput.value;

            // Hide error message
            if (errorMessage) {
                errorMessage.classList.add('hidden');
            }

            // Show loading state
            if (loginButton) {
                loginButton.disabled = true;
                loginButton.innerHTML =
                    '<i class="fas fa-spinner fa-spin mr-2"></i><span>Entrando...</span>';
            }

            try {
                const response: Response = await fetch(`${LOGIN_API_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data: LoginResponse = await response.json();

                if (data.success) {
                    // Save user to localStorage
                    localStorage.setItem('user', JSON.stringify(data.user));

                    // Save token to sessionStorage (more secure)
                    if (data.token) {
                        sessionStorage.setItem('accessToken', data.token);
                        // Backward compatibility with existing modules
                        sessionStorage.setItem('MEDICAL_CRM_TOKEN', data.token);
                        sessionStorage.setItem('token', data.token);
                    }

                    // Save user name for header display
                    if (data.user && data.user.name) {
                        sessionStorage.setItem('userName', data.user.name);
                    }

                    // Success feedback
                    if (loginButton) {
                        loginButton.innerHTML =
                            '<i class="fas fa-check mr-2"></i><span>Sucesso!</span>';
                        loginButton.classList.remove('bg-teal-600', 'hover:bg-teal-700');
                        loginButton.classList.add('bg-green-600');
                    }

                    // Redirect to admin panel
                    setTimeout(() => {
                        window.location.href = '/admin.html';
                    }, 500);
                } else {
                    throw new Error(data.error || 'Credenciais inválidas');
                }
            } catch (error: unknown) {
                const errorMsg =
                    error instanceof Error ? error.message : 'Erro ao conectar com o servidor';

                // Show error message
                if (errorText) {
                    errorText.textContent = errorMsg;
                }
                if (errorMessage) {
                    errorMessage.classList.remove('hidden');
                }

                // Reset button
                if (loginButton) {
                    loginButton.disabled = false;
                    loginButton.innerHTML =
                        '<i class="fas fa-sign-in-alt"></i><span>Entrar no Sistema</span>';
                }

                // Shake animation
                if (errorMessage) {
                    errorMessage.style.animation = 'none';
                    setTimeout(() => {
                        errorMessage.style.animation = 'slideIn 0.3s ease-out';
                    }, 10);
                }
            }
        });
    }
});
