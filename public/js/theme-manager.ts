/**
 * Theme Manager - Gerenciamento de Tema Dark/Light
 * Objeto singleton com persistência em localStorage e backend
 */

type Theme = 'dark' | 'light';

interface ThemeManagerInterface {
    STORAGE_KEY: string;
    THEMES: { DARK: Theme; LIGHT: Theme };
    init: () => Promise<void>;
    setTheme: (theme: Theme) => void;
    getTheme: () => Theme;
    toggle: () => void;
    saveToBackend: (theme: Theme) => Promise<void>;
    loadFromBackend: () => Promise<Theme | null>;
    isDark: () => boolean;
    isLight: () => boolean;
    updateToggleIcon: () => void;
    showToast: (message: string) => void;
}

const ThemeManager: ThemeManagerInterface = {
    STORAGE_KEY: 'theme-preference',
    THEMES: { DARK: 'dark', LIGHT: 'light' },

    async init(): Promise<void> {
        // Tenta carregar do backend primeiro, depois do localStorage
        let theme: Theme | null = null;

        try {
            theme = await this.loadFromBackend();
        } catch {
            // Ignora erro do backend
        }

        if (!theme) {
            theme = (localStorage.getItem(this.STORAGE_KEY) as Theme) || this.THEMES.DARK;
        }

        this.setTheme(theme);
        this.updateToggleIcon();

        // Adiciona listener no toggle button
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }

        // Adiciona CSS animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes theme-fade {
                0% { opacity: 0.8; }
                100% { opacity: 1; }
            }
            .theme-transition {
                animation: theme-fade 0.3s ease-in-out;
            }
        `;
        document.head.appendChild(style);
    },

    setTheme(theme: Theme): void {
        const root = document.documentElement;

        // Set data-theme attribute (used by CSS selectors)
        root.setAttribute('data-theme', theme);

        if (theme === this.THEMES.DARK) {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
        }

        // Salva localmente
        localStorage.setItem(this.STORAGE_KEY, theme);

        // Aplica transição suave
        document.body.classList.add('theme-transition');
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 300);

        this.updateToggleIcon();
    },

    getTheme(): Theme {
        return (localStorage.getItem(this.STORAGE_KEY) as Theme) || this.THEMES.DARK;
    },

    toggle(): void {
        const current = this.getTheme();
        const newTheme: Theme = current === this.THEMES.DARK ? this.THEMES.LIGHT : this.THEMES.DARK;

        this.setTheme(newTheme);
        this.saveToBackend(newTheme);

        const label = newTheme === this.THEMES.DARK ? 'Modo Escuro' : 'Modo Claro';
        this.showToast(`🎨 ${label} ativado`);
    },

    async saveToBackend(theme: Theme): Promise<void> {
        try {
            const token =
                sessionStorage.getItem('MEDICAL_CRM_TOKEN') || sessionStorage.getItem('token');
            if (!token) return;

            await fetch('/api/users/preferences', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ theme }),
            });
        } catch {
            // Silenciosamente falha - preferência já salva localmente
        }
    },

    async loadFromBackend(): Promise<Theme | null> {
        try {
            const token =
                sessionStorage.getItem('MEDICAL_CRM_TOKEN') || sessionStorage.getItem('token');
            if (!token) return null;

            const response = await fetch('/api/users/preferences', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) return null;

            const data = (await response.json()) as { theme?: Theme };
            return data.theme || null;
        } catch {
            return null;
        }
    },

    isDark(): boolean {
        return this.getTheme() === this.THEMES.DARK;
    },

    isLight(): boolean {
        return this.getTheme() === this.THEMES.LIGHT;
    },

    updateToggleIcon(): void {
        const icon = document.getElementById('themeIcon');
        if (!icon) return;

        if (this.isDark()) {
            icon.className = 'fas fa-moon text-yellow-300';
        } else {
            icon.className = 'fas fa-sun text-yellow-500';
        }
    },

    showToast(message: string): void {
        const existing = document.getElementById('themeToast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'themeToast';
        toast.className =
            'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },
};

// Exportar como global
(window as unknown as Record<string, unknown>).ThemeManager = ThemeManager;

// Auto-init on script load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
} else {
    ThemeManager.init();
}

export { ThemeManager };
export type { Theme, ThemeManagerInterface };
