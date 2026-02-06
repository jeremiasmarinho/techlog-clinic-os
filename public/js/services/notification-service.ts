/**
 * ============================================
 * NOTIFICATION SERVICE
 * Sistema centralizado de notificações/toasts
 * ============================================
 */

import type { ToastType } from '../types/models';

const TOAST_CONTAINER_ID = 'toast-container';
const TOAST_DURATION = 3000;

/**
 * Inicializa container de toasts
 */
export function init(): void {
    if (document.getElementById(TOAST_CONTAINER_ID)) return;

    const container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    container.className = 'fixed top-4 right-4 z-[9999] flex flex-col gap-2';
    document.body.appendChild(container);
}

/**
 * Mostra toast de notificação
 */
export function show(
    message: string,
    type: ToastType = 'info',
    duration: number = TOAST_DURATION
): void {
    init();

    const container = document.getElementById(TOAST_CONTAINER_ID);
    if (!container) return;

    const toast = createToast(message, type);
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    }, 10);

    setTimeout(() => {
        removeToast(toast);
    }, duration);
}

/**
 * Cria elemento de toast
 */
function createToast(message: string, type: ToastType): HTMLElement {
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
 */
function removeToast(toast: HTMLElement): void {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

/**
 * Retorna classes CSS baseado no tipo
 */
function getTypeClasses(type: ToastType): string {
    const classes: Record<ToastType, string> = {
        success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 border border-emerald-400/30',
        error: 'bg-gradient-to-r from-red-500 to-red-600 border border-red-400/30',
        warning: 'bg-gradient-to-r from-amber-500 to-amber-600 border border-amber-400/30',
        info: 'bg-gradient-to-r from-blue-500 to-blue-600 border border-blue-400/30',
    };
    return classes[type] || classes.info;
}

/**
 * Retorna ícone FontAwesome baseado no tipo
 */
function getTypeIcon(type: ToastType): string {
    const icons: Record<ToastType, string> = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle',
    };
    return icons[type] || icons.info;
}

/**
 * Retorna cor do ícone baseado no tipo
 */
function getTypeIconColor(type: ToastType): string {
    const colors: Record<ToastType, string> = {
        success: 'text-emerald-100',
        error: 'text-red-100',
        warning: 'text-amber-100',
        info: 'text-blue-100',
    };
    return colors[type] || colors.info;
}

// Atalhos convenientes
export const success = (message: string, duration?: number): void =>
    show(message, 'success', duration);
export const error = (message: string, duration?: number): void => show(message, 'error', duration);
export const warning = (message: string, duration?: number): void =>
    show(message, 'warning', duration);
export const info = (message: string, duration?: number): void => show(message, 'info', duration);
