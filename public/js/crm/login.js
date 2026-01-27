/**
 * CRM Login Authentication
 * Handles login form submission and authentication
 */

const API_URL = '/api';

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginButton');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    // Check if user is already logged in
    const user = localStorage.getItem('user');
    if (user) {
        window.location.href = '/admin.html';
        return;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            // Hide error message
            errorMessage.classList.add('hidden');
            
            // Show loading state
            loginButton.disabled = true;
            loginButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i><span>Entrando...</span>';

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (data.success) {
                    // Save user to localStorage
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Success feedback
                    loginButton.innerHTML = '<i class="fas fa-check mr-2"></i><span>Sucesso!</span>';
                    loginButton.classList.remove('bg-teal-600', 'hover:bg-teal-700');
                    loginButton.classList.add('bg-green-600');
                    
                    // Redirect to admin panel
                    setTimeout(() => {
                        window.location.href = '/admin.html';
                    }, 500);
                } else {
                    throw new Error(data.error || 'Credenciais inválidas');
                }
            } catch (error) {
                console.error('Erro no login:', error);
                
                // Show error message
                errorText.textContent = error.message || 'Erro ao conectar com o servidor';
                errorMessage.classList.remove('hidden');
                
                // Reset button
                loginButton.disabled = false;
                loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i><span>Entrar no Sistema</span>';
                
                // Shake animation
                errorMessage.style.animation = 'none';
                setTimeout(() => {
                    errorMessage.style.animation = 'slideIn 0.3s ease-out';
                }, 10);
            }
        });
    }
});
