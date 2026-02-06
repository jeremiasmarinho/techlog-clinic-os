/**
 * Custom Confirm Modal Component
 * Replaces native browser confirm() with a styled modal
 */

interface ConfirmModalOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    icon?: string;
    variant?: 'danger' | 'warning' | 'info';
}

function showConfirmModal(options: ConfirmModalOptions): Promise<boolean> {
    return new Promise((resolve) => {
        // Remove any existing modal
        const existing = document.getElementById('custom-confirm-modal');
        if (existing) existing.remove();

        const variant = options.variant || 'danger';
        const title = options.title || 'Confirmação';
        const confirmText = options.confirmText || 'Confirmar';
        const cancelText = options.cancelText || 'Cancelar';

        const variantConfig = {
            danger: {
                icon: options.icon || 'fa-sign-out-alt',
                iconBg: 'var(--confirm-icon-bg-danger, rgba(239, 68, 68, 0.15))',
                iconColor: 'var(--confirm-icon-color-danger, #ef4444)',
                btnBg: 'var(--confirm-btn-bg-danger, #ef4444)',
                btnHover: 'var(--confirm-btn-hover-danger, #dc2626)',
            },
            warning: {
                icon: options.icon || 'fa-exclamation-triangle',
                iconBg: 'var(--confirm-icon-bg-warning, rgba(245, 158, 11, 0.15))',
                iconColor: 'var(--confirm-icon-color-warning, #f59e0b)',
                btnBg: 'var(--confirm-btn-bg-warning, #f59e0b)',
                btnHover: 'var(--confirm-btn-hover-warning, #d97706)',
            },
            info: {
                icon: options.icon || 'fa-info-circle',
                iconBg: 'var(--confirm-icon-bg-info, rgba(6, 182, 212, 0.15))',
                iconColor: 'var(--confirm-icon-color-info, #06b6d4)',
                btnBg: 'var(--confirm-btn-bg-info, #06b6d4)',
                btnHover: 'var(--confirm-btn-hover-info, #0891b2)',
            },
        };

        const config = variantConfig[variant];

        const overlay = document.createElement('div');
        overlay.id = 'custom-confirm-modal';
        overlay.innerHTML = `
            <div class="confirm-overlay">
                <div class="confirm-dialog">
                    <div class="confirm-icon-wrap" style="background: ${config.iconBg}">
                        <i class="fas ${config.icon}" style="color: ${config.iconColor}; font-size: 1.5rem;"></i>
                    </div>
                    <h3 class="confirm-title">${title}</h3>
                    <p class="confirm-message">${options.message}</p>
                    <div class="confirm-actions">
                        <button class="confirm-btn-cancel" id="confirmModalCancel">
                            ${cancelText}
                        </button>
                        <button class="confirm-btn-ok" id="confirmModalOk" style="background: ${config.btnBg}; --btn-hover: ${config.btnHover};">
                            <i class="fas ${config.icon}" style="font-size: 0.75rem;"></i>
                            ${confirmText}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Animate in
        requestAnimationFrame(() => {
            const dialog = overlay.querySelector('.confirm-dialog') as HTMLElement;
            const overlayBg = overlay.querySelector('.confirm-overlay') as HTMLElement;
            if (overlayBg) overlayBg.classList.add('active');
            if (dialog) dialog.classList.add('active');
        });

        const cleanup = (result: boolean): void => {
            const dialog = overlay.querySelector('.confirm-dialog') as HTMLElement;
            const overlayBg = overlay.querySelector('.confirm-overlay') as HTMLElement;
            if (dialog) dialog.classList.remove('active');
            if (overlayBg) overlayBg.classList.remove('active');
            setTimeout(() => {
                overlay.remove();
                resolve(result);
            }, 200);
        };

        overlay.querySelector('#confirmModalOk')?.addEventListener('click', () => cleanup(true));
        overlay
            .querySelector('#confirmModalCancel')
            ?.addEventListener('click', () => cleanup(false));

        // Close on overlay click
        overlay.querySelector('.confirm-overlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) cleanup(false);
        });

        // Close on Escape
        const onKey = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', onKey);
                cleanup(false);
            }
        };
        document.addEventListener('keydown', onKey);
    });
}

// Expose globally
(window as Record<string, unknown>).showConfirmModal = showConfirmModal;

export { showConfirmModal };
export type { ConfirmModalOptions };
