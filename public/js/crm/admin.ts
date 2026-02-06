// ============================================
// Admin Panel - Mobile Menu & UI Controls
// ============================================

import { extractTimeFromDate } from '../utils/date-utils';

interface ConfirmationLead {
    id: number;
    name: string;
    phone: string;
    appointment_date: string;
    doctor?: string;
    type?: string;
    status: string;
}

declare function loadSummaryMetrics(): void;
declare let togglePrivacyMode: () => void;
declare let privacyMode: boolean;

declare global {
    interface Window {
        markAsSent: (id: number) => void;
        copyMessage: (id: number, message: string) => void;
    }
}

/**
 * Toggle Mobile Sidebar Menu
 * Handles the opening/closing of the mobile sidebar with smooth animations
 */
function toggleMobileMenu(): void {
    const sidebar = document.getElementById('mobileSidebar');
    const sidebarPanel = document.getElementById('mobileSidebarPanel');

    if (!sidebar || !sidebarPanel) {
        console.error('Mobile menu elements not found');
        return;
    }

    // Check if sidebar is currently hidden
    const isHidden = sidebar.classList.contains('hidden');

    if (isHidden) {
        // Show sidebar
        sidebar.classList.remove('hidden');

        // Force reflow to ensure transition works
        void sidebarPanel.offsetWidth;

        // Slide in the panel
        sidebarPanel.classList.remove('-translate-x-full');
        sidebarPanel.classList.add('translate-x-0');

        // Prevent body scroll when menu is open
        document.body.style.overflow = 'hidden';
    } else {
        // Slide out the panel
        sidebarPanel.classList.remove('translate-x-0');
        sidebarPanel.classList.add('-translate-x-full');

        // Hide sidebar after animation completes
        setTimeout(() => {
            sidebar.classList.add('hidden');
        }, 300); // Match the transition duration

        // Restore body scroll
        document.body.style.overflow = '';
    }
}

/**
 * Sync user name between header and sidebar
 * Called when user data is loaded
 */
function syncUserName(userName: string): void {
    const userNameElement = document.getElementById('userName');
    const userNameSidebarElement = document.getElementById('userNameSidebar');

    if (userNameElement && userName) {
        userNameElement.textContent = userName;
    }

    if (userNameSidebarElement && userName) {
        userNameSidebarElement.textContent = userName;
    }
}

/**
 * Sync team button visibility (Admin only)
 * Shows/hides the team management button based on user role
 */
function syncTeamButtonVisibility(isAdmin: boolean): void {
    const teamButton = document.getElementById('teamButton');
    const teamButtonSidebar = document.getElementById('teamButtonSidebar');

    if (teamButton) {
        if (isAdmin) {
            teamButton.classList.remove('hidden');
            teamButton.classList.add('flex');
        } else {
            teamButton.classList.add('hidden');
            teamButton.classList.remove('flex');
        }
    }

    if (teamButtonSidebar) {
        if (isAdmin) {
            teamButtonSidebar.classList.remove('hidden');
            teamButtonSidebar.classList.add('flex');
        } else {
            teamButtonSidebar.classList.add('hidden');
            teamButtonSidebar.classList.remove('flex');
        }
    }
}

/**
 * Sync privacy mode icons
 * Updates the privacy mode icons in both header and sidebar
 */
function syncPrivacyIcons(isPrivacyMode: boolean): void {
    const privacyIcon = document.getElementById('privacyIcon');
    const privacyIconSidebar = document.getElementById('privacyIconSidebar');

    const iconClass = isPrivacyMode ? 'fa-eye-slash' : 'fa-eye';

    if (privacyIcon) {
        privacyIcon.className = `fas ${iconClass}`;
    }

    if (privacyIconSidebar) {
        privacyIconSidebar.className = `fas ${iconClass} text-xl w-6`;
    }
}

/**
 * Close mobile menu when clicking outside on mobile
 * Handles the backdrop click event
 */
document.addEventListener('DOMContentLoaded', function (): void {
    // Close menu with Escape key
    document.addEventListener('keydown', function (e: KeyboardEvent): void {
        if (e.key === 'Escape') {
            const sidebar = document.getElementById('mobileSidebar');
            if (sidebar && !sidebar.classList.contains('hidden')) {
                toggleMobileMenu();
            }
        }
    });

    // Prevent body scroll when modal or sidebar is open
    const observer = new MutationObserver(function (mutations: MutationRecord[]): void {
        mutations.forEach(function (mutation: MutationRecord): void {
            if (mutation.attributeName === 'class') {
                const sidebar = document.getElementById('mobileSidebar');
                if (sidebar && !sidebar.classList.contains('hidden')) {
                    document.body.style.overflow = 'hidden';
                } else {
                    // Check if any modal is open
                    const modals = document.querySelectorAll('.fixed.inset-0:not(.hidden)');
                    if (modals.length === 0) {
                        document.body.style.overflow = '';
                    }
                }
            }
        });
    });

    const sidebar = document.getElementById('mobileSidebar');
    if (sidebar) {
        observer.observe(sidebar, { attributes: true });
    }
});

/**
 * Override togglePrivacyMode to sync icons
 * Wraps the existing togglePrivacyMode function
 */
if (typeof togglePrivacyMode !== 'undefined') {
    const originalTogglePrivacyMode = togglePrivacyMode;
    togglePrivacyMode = function (): void {
        originalTogglePrivacyMode();
        // Sync the privacy icons after toggle
        syncPrivacyIcons(privacyMode);
    };
}

/**
 * Handle window resize
 * Close mobile menu if window is resized to desktop size
 */
let resizeTimer: ReturnType<typeof setTimeout>;
window.addEventListener('resize', function (): void {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function (): void {
        // If window width is >= 768px (md breakpoint), close mobile menu
        if (window.innerWidth >= 768) {
            const sidebar = document.getElementById('mobileSidebar');
            const sidebarPanel = document.getElementById('mobileSidebarPanel');

            if (sidebar && !sidebar.classList.contains('hidden')) {
                sidebar.classList.add('hidden');
                if (sidebarPanel) {
                    sidebarPanel.classList.remove('translate-x-0');
                    sidebarPanel.classList.add('-translate-x-full');
                }
                document.body.style.overflow = '';
            }
        }
    }, 250);
});

// Console log for debugging
console.log('✅ Admin.js loaded - Mobile menu functionality active');

// Load summary metrics on page load
document.addEventListener('DOMContentLoaded', (): void => {
    if (typeof loadSummaryMetrics === 'function') {
        loadSummaryMetrics();
    }
});

// ============================================
// CONFIRMATION QUEUE MODAL
// ============================================

/**
 * Open Confirmation Queue Modal
 * Shows list of patients scheduled for tomorrow
 */
async function openConfirmationQueue(): Promise<void> {
    try {
        const token =
            sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('accessToken');

        if (!token) {
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('/api/leads', {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch leads');

        const leads: ConfirmationLead[] = await response.json();

        // Get tomorrow's date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        // Filter leads for tomorrow
        const tomorrowLeads = leads.filter((lead: ConfirmationLead) => {
            if (!lead.appointment_date) return false;
            const apptDate = lead.appointment_date.split('T')[0];
            return apptDate === tomorrowStr && lead.status === 'agendado';
        });

        if (tomorrowLeads.length === 0) {
            showNotification('ℹ️ Nenhum agendamento para amanhã', 'info');
            return;
        }

        // Render patient list
        renderConfirmationQueue(tomorrowLeads);

        // Show modal
        const modal = document.getElementById('confirmationQueueModal') as HTMLDivElement | null;
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    } catch (error) {
        console.error('❌ Error opening confirmation queue:', error);
        alert('❌ Erro ao carregar fila de confirmação');
    }
}

/**
 * Render confirmation queue list
 */
function renderConfirmationQueue(leads: ConfirmationLead[]): void {
    const container = document.getElementById('confirmationList') as HTMLDivElement | null;

    if (!container) {
        console.error('confirmationList container not found');
        return;
    }

    if (leads.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-slate-400">
                <i class="fa-solid fa-calendar-check text-4xl mb-3 block"></i>
                <p>Nenhum paciente agendado para amanhã</p>
            </div>
        `;
        return;
    }

    // Get clinic name from localStorage cache
    let clinicName = 'Sua Clínica';
    try {
        const settings = JSON.parse(localStorage.getItem('clinicSettings') || '{}') as {
            settings?: { identity?: { name?: string } };
        };
        if (settings.settings?.identity?.name) {
            clinicName = settings.settings.identity.name;
        }
    } catch (e) {
        console.warn('Could not load clinic name from settings');
    }

    // Sort by appointment time
    leads.sort((a: ConfirmationLead, b: ConfirmationLead) => {
        const timeA = extractTimeFromDate(a.appointment_date);
        const timeB = extractTimeFromDate(b.appointment_date);
        return timeA.localeCompare(timeB);
    });

    container.innerHTML = leads
        .map((lead: ConfirmationLead, index: number) => {
            const phone = lead.phone.replace(/\D/g, '');
            const apptTime = extractTimeFromDate(lead.appointment_date);
            const doctor = lead.doctor || 'nossa equipe';

            const message = `Olá *${lead.name}*! 😊\\n\\nEste é um lembrete da sua consulta *amanhã* às *${apptTime}* com ${doctor}.\\n\\n📍 ${clinicName}\\n\\nTudo confirmado? Se precisar reagendar, é só avisar!\\n\\nAguardamos você! 🙏`;

            const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;

            return `
            <div class="bg-slate-700/30 border border-slate-600 rounded-lg p-4 hover:bg-slate-700/50 transition" data-lead-id="${lead.id}">
                <div class="flex items-start justify-between gap-3">
                    
                    <!-- Patient Info -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-xs font-bold text-slate-400 bg-slate-600/50 px-2 py-0.5 rounded">
                                #${index + 1}
                            </span>
                            <span class="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                ${apptTime}
                            </span>
                        </div>
                        <h4 class="text-white font-semibold text-base mb-1 truncate">
                            ${lead.name}
                        </h4>
                        <div class="space-y-1 text-xs text-slate-300">
                            <p class="flex items-center">
                                <i class="fa-solid fa-phone w-4 text-cyan-400"></i>
                                ${formatPhone(phone)}
                            </p>
                            ${
                                lead.doctor
                                    ? `
                            <p class="flex items-center">
                                <i class="fa-solid fa-user-doctor w-4 text-purple-400"></i>
                                ${lead.doctor}
                            </p>
                            `
                                    : ''
                            }
                            ${
                                lead.type
                                    ? `
                            <p class="flex items-center">
                                <i class="fa-solid fa-clipboard w-4 text-blue-400"></i>
                                ${lead.type}
                            </p>
                            `
                                    : ''
                            }
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="flex flex-col gap-2">
                        <a 
                            href="${whatsappUrl}" 
                            target="_blank"
                            onclick="markAsSent(${lead.id})"
                            class="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg transition font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/50"
                        >
                            <i class="fa-brands fa-whatsapp text-lg"></i>
                            <span>Enviar</span>
                        </a>
                        <button 
                            onclick="copyMessage(${lead.id}, \`${message.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)"
                            class="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-200 rounded-lg transition text-xs font-medium flex items-center justify-center gap-1"
                            title="Copiar mensagem"
                        >
                            <i class="fa-solid fa-copy"></i>
                            <span>Copiar</span>
                        </button>
                    </div>
                </div>
                
                <!-- Sent Indicator (initially hidden) -->
                <div class="sent-indicator hidden mt-3 pt-3 border-t border-slate-600">
                    <div class="flex items-center text-xs text-emerald-400">
                        <i class="fa-solid fa-check-circle mr-2"></i>
                        <span>Mensagem enviada!</span>
                    </div>
                </div>
            </div>
        `;
        })
        .join('');
}

/**
 * Close confirmation queue modal
 */
function closeConfirmationQueue(): void {
    const modal = document.getElementById('confirmationQueueModal') as HTMLDivElement | null;
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

/**
 * Mark message as sent (visual feedback)
 */
function markAsSent(leadId: number): void {
    const card = document.querySelector(`[data-lead-id="${leadId}"]`) as HTMLDivElement | null;
    if (!card) return;

    // Show sent indicator
    const indicator = card.querySelector('.sent-indicator') as HTMLDivElement | null;
    if (indicator) {
        indicator.classList.remove('hidden');
    }

    // Disable send button
    const sendBtn = card.querySelector('a[href^="https://wa.me"]') as HTMLAnchorElement | null;
    if (sendBtn) {
        sendBtn.classList.add('opacity-50', 'pointer-events-none');
        sendBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i> Enviado';
    }

    console.log(`✅ Confirmation sent to lead #${leadId}`);
}

/**
 * Copy message to clipboard
 */
function copyMessage(leadId: number, message: string): void {
    navigator.clipboard
        .writeText(message)
        .then(() => {
            showNotificationToast('📋 Mensagem copiada!', 'success');

            // Visual feedback on button
            const card = document.querySelector(
                `[data-lead-id="${leadId}"]`
            ) as HTMLDivElement | null;
            const copyBtn = card?.querySelector(
                'button[onclick*="copyMessage"]'
            ) as HTMLButtonElement | null;
            if (copyBtn) {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fa-solid fa-check mr-1"></i> Copiado!';
                copyBtn.classList.add('bg-emerald-600', 'text-white');

                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('bg-emerald-600', 'text-white');
                }, 2000);
            }
        })
        .catch((err: unknown) => {
            console.error('Failed to copy:', err);
            alert('❌ Erro ao copiar mensagem');
        });
}

/**
 * Format phone number
 */
function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.substr(0, 2)}) ${cleaned.substr(2, 5)}-${cleaned.substr(7)}`;
    } else if (cleaned.length === 10) {
        return `(${cleaned.substr(0, 2)}) ${cleaned.substr(2, 4)}-${cleaned.substr(6)}`;
    }
    return phone;
}

/**
 * Show notification toast
 */
function showNotificationToast(
    message: string,
    type: 'success' | 'error' | 'info' = 'success'
): void {
    // Try to find existing notification system
    const toast = document.getElementById('notificationToast') as HTMLDivElement | null;
    if (toast) {
        const icon = toast.querySelector('i') as HTMLElement | null;
        const text = toast.querySelector('p') as HTMLParagraphElement | null;

        if (text) text.textContent = message;

        if (icon) {
            if (type === 'error') {
                icon.className = 'fas fa-exclamation-circle text-red-400 text-2xl mr-3';
            } else if (type === 'info') {
                icon.className = 'fas fa-info-circle text-blue-400 text-2xl mr-3';
            } else {
                icon.className = 'fas fa-check-circle text-cyan-400 text-2xl mr-3';
            }
        }

        toast.classList.remove('hidden');

        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    } else {
        // Fallback to console if no toast element
        console.log(message);
    }
}

function showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    showNotificationToast(message, type);
}

// Expose functions globally
window.openConfirmationQueue = openConfirmationQueue;
window.closeConfirmationQueue = closeConfirmationQueue;
window.markAsSent = markAsSent;
window.copyMessage = copyMessage;
