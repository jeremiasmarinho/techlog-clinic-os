/**
 * ============================================
 * NOTIFICATION SERVICE
 * Sistema centralizado de notificações/toasts
 * ============================================
 */

const TOAST_CONTAINER_ID = 'toast-container';
const TOAST_DURATION = 3000;

/**
 * Inicializa container de toasts (deve ser chamado no DOMContentLoaded)
 */
export function init() {
    if (document.getElementById(TOAST_CONTAINER_ID)) return;
    
    const container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2';
    document.body.appendChild(container);
}

/**
 * Mostra toast de notificação
 * @param {string} message - Mensagem a exibir
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duração em ms (padrão: 3000)
 */
export function show(message, type = 'info', duration = TOAST_DURATION) {
    init(); // Garante que container existe
    
    const container = document.getElementById(TOAST_CONTAINER_ID);
    if (!container) return;
    
    const toast = createToast(message, type);
    container.appendChild(toast);
    
    // Animação de entrada
    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    }, 10);
    
    // Auto-remove
    setTimeout(() => {
        removeToast(toast);
    }, duration);
}

/**
 * Cria elemento de toast
 * @param {string} message - Mensagem
 * @param {string} type - Tipo
 * @returns {HTMLElement} Elemento do toast
 */
function createToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
        transform translate-x-full opacity-0 transition-all duration-300
        min-w-[300px] max-w-[400px]
        ${getTypeClasses(type)}
    `;
    
    const icon = getTypeIcon(type);
    const iconColor = getTypeIconColor(type);
    
    toast.innerHTML = `
        <div class="flex-shrink-0">
            <i class="fas ${icon} text-lg ${iconColor}"></i>
        </div>
        <div class="flex-1 text-sm font-medium text-white">
            ${message}
        </div>
        <button class="flex-shrink-0 text-white/70 hover:text-white transition-colors" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    return toast;
}

/**
 * Remove toast com animação
 * @param {HTMLElement} toast - Elemento do toast
 */
function removeToast(toast) {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

/**
 * Retorna classes CSS baseado no tipo
 * @param {string} type - Tipo do toast
 * @returns {string} Classes CSS
 */
function getTypeClasses(type) {
    const classes = {
        success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 border border-emerald-400/30',
        error: 'bg-gradient-to-r from-red-500 to-red-600 border border-red-400/30',
        warning: 'bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400/30',
        info: 'bg-gradient-to-r from-blue-500 to-blue-600 border border-blue-400/30'
    };
    return classes[type] || classes.info;
}

/**
 * Retorna ícone FontAwesome baseado no tipo
 * @param {string} type - Tipo do toast
 * @returns {string} Classe do ícone
 */
function getTypeIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

/**
 * Retorna cor do ícone baseado no tipo
 * @param {string} type - Tipo do toast
 * @returns {string} Classe de cor
 */
function getTypeIconColor(type) {
    const colors = {
        success: 'text-emerald-100',
        error: 'text-red-100',
        warning: 'text-amber-100',
        info: 'text-blue-100'
    };
    return colors[type] || colors.info;
}

// Atalhos convenientes
export const success = (message, duration) => show(message, 'success', duration);
export const error = (message, duration) => show(message, 'error', duration);
export const warning = (message, duration) => show(message, 'warning', duration);
export const info = (message, duration) => show(message, 'info', duration);
