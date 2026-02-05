/**
 * 🎨 TECHLOG CLINIC - THEME MANAGER
 *
 * Gerencia a alternância entre os modos Dark e Light.
 * Salva a preferência no localStorage e sincroniza com o sistema.
 *
 * Uso:
 * 1. Inclua este script: <script src="/js/theme-manager.js"></script>
 * 2. Adicione o botão: <button class="theme-toggle" onclick="ThemeManager.toggle()">
 *                          <i class="fas fa-sun"></i><i class="fas fa-moon"></i>
 *                      </button>
 */

const ThemeManager = {
    STORAGE_KEY: 'techlog-theme',
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark',
    },

    /**
     * Inicializa o tema baseado na preferência salva ou do sistema
     */
    init() {
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);

        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            // Detecta preferência do sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? this.THEMES.DARK : this.THEMES.DARK); // Default dark
        }

        // Escuta mudanças na preferência do sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                this.setTheme(e.matches ? this.THEMES.DARK : this.THEMES.LIGHT);
            }
        });

        console.log(`🎨 Theme initialized: ${this.getTheme()}`);
    },

    /**
     * Define o tema
     * @param {string} theme - 'light' ou 'dark'
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(this.STORAGE_KEY, theme);

        // Atualiza classes do body para compatibilidade
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${theme}`);

        // Dispara evento customizado
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));

        // Atualiza ícone do toggle
        this.updateToggleIcon();
    },

    /**
     * Retorna o tema atual
     * @returns {string} 'light' ou 'dark'
     */
    getTheme() {
        return document.documentElement.getAttribute('data-theme') || this.THEMES.DARK;
    },

    /**
     * Alterna entre os temas
     */
    toggle() {
        const current = this.getTheme();
        const newTheme = current === this.THEMES.DARK ? this.THEMES.LIGHT : this.THEMES.DARK;
        this.setTheme(newTheme);

        // Feedback visual
        this.showToast(newTheme === this.THEMES.LIGHT ? '☀️ Modo Claro' : '🌙 Modo Escuro');
    },

    /**
     * Verifica se está no modo escuro
     * @returns {boolean}
     */
    isDark() {
        return this.getTheme() === this.THEMES.DARK;
    },

    /**
     * Verifica se está no modo claro
     * @returns {boolean}
     */
    isLight() {
        return this.getTheme() === this.THEMES.LIGHT;
    },

    /**
     * Atualiza o ícone do botão de toggle
     */
    updateToggleIcon() {
        const toggles = document.querySelectorAll('.theme-toggle');
        toggles.forEach((toggle) => {
            const sunIcon = toggle.querySelector('.fa-sun');
            const moonIcon = toggle.querySelector('.fa-moon');

            if (sunIcon && moonIcon) {
                if (this.isDark()) {
                    sunIcon.style.display = 'inline';
                    moonIcon.style.display = 'none';
                } else {
                    sunIcon.style.display = 'none';
                    moonIcon.style.display = 'inline';
                }
            }
        });
    },

    /**
     * Mostra uma notificação toast
     * @param {string} message
     */
    showToast(message) {
        // Remove toast existente
        const existing = document.querySelector('.theme-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'theme-toast';
        toast.innerHTML = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 24px;
            background: var(--bg-card-solid);
            color: var(--text-primary);
            border: 1px solid var(--border-primary);
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            animation: slideInUp 0.3s ease;
            font-weight: 500;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },
};

// CSS para animações do toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes slideInUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slideOutDown {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(100px); opacity: 0; }
    }
`;
document.head.appendChild(toastStyles);

// Auto-inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
    ThemeManager.init();
}

// Exporta para uso global
window.ThemeManager = ThemeManager;
