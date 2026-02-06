/**
 * Toast Notification Component
 * Replaces native browser alert() with styled toast notifications
 * Auto-dismisses after a configurable duration
 */

interface ToastOptions {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    icon?: string;
}

function showToast(options: ToastOptions): void {
    const type = options.type || 'info';
    const duration = options.duration || 3500;

    const typeConfig = {
        success: {
            icon: options.icon || 'fa-check-circle',
            color: 'var(--toast-success, #22c55e)',
            bg: 'var(--toast-success-bg, rgba(34, 197, 94, 0.15))',
        },
        error: {
            icon: options.icon || 'fa-times-circle',
            color: 'var(--toast-error, #ef4444)',
            bg: 'var(--toast-error-bg, rgba(239, 68, 68, 0.15))',
        },
        warning: {
            icon: options.icon || 'fa-exclamation-triangle',
            color: 'var(--toast-warning, #f59e0b)',
            bg: 'var(--toast-warning-bg, rgba(245, 158, 11, 0.15))',
        },
        info: {
            icon: options.icon || 'fa-info-circle',
            color: 'var(--toast-info, #06b6d4)',
            bg: 'var(--toast-info-bg, rgba(6, 182, 212, 0.15))',
        },
    };

    const config = typeConfig[type];

    // Ensure container exists
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.innerHTML = `
        <div class="toast-icon-wrap" style="background: ${config.bg}">
            <i class="fas ${config.icon}" style="color: ${config.color}; font-size: 1rem;"></i>
        </div>
        <span class="toast-message">${options.message}</span>
        <button class="toast-close" aria-label="Fechar">
            <i class="fas fa-times"></i>
        </button>
        <div class="toast-progress" style="background: ${config.color}"></div>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('active');
    });

    // Start progress bar animation
    const progress = toast.querySelector('.toast-progress') as HTMLElement;
    if (progress) {
        progress.style.transition = `width ${duration}ms linear`;
        requestAnimationFrame(() => {
            progress.style.width = '0%';
        });
    }

    const dismiss = (): void => {
        toast.classList.remove('active');
        toast.classList.add('exiting');
        setTimeout(() => {
            toast.remove();
            // Remove container if empty
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 300);
    };

    // Close button
    toast.querySelector('.toast-close')?.addEventListener('click', dismiss);

    // Auto-dismiss
    setTimeout(dismiss, duration);
}

// Expose globally
(window as Record<string, unknown>).showToast = showToast;

export { showToast };
export type { ToastOptions };
