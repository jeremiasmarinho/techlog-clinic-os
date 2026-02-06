/**
 * Appointments Service - Centralized CRUD operations
 * Single source of truth for all appointment/lead operations
 */

declare function showConfirmModal(options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    icon?: string;
    variant?: string;
}): Promise<boolean>;

declare function showToast(options: {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}): void;

declare function buildAvatarHTML(name: string, size?: 'sm' | 'md' | 'lg' | 'xl'): string;
declare function getAvatarColorClass(name: string): string;
declare function getInitials(name: string): string;

import type {
    Appointment,
    AppointmentFinancial,
    ParsedNotes,
    StatusDisplay,
} from '../types/models';

interface AppointmentsServiceType {
    API_URL: string;
    getToken(): string | null;
    getHeaders(includeContentType?: boolean): Record<string, string>;
    getById(id: string | number): Promise<Appointment>;
    getByDateRange(startDate: string, endDate: string): Promise<Appointment[]>;
    update(id: string | number, data: Partial<Appointment>): Promise<Appointment>;
    delete(id: string | number): Promise<unknown>;
    confirm(id: string | number): Promise<Appointment>;
    archive(id: string | number): Promise<Appointment>;
    complete(id: string | number): Promise<Appointment>;
    noShow(id: string | number): Promise<Appointment>;
    openWhatsApp(phone: string | null | undefined, message?: string): void;
    getStatusDisplay(status: string): StatusDisplay;
    formatType(type: string | null | undefined): string;
    parseNotes(text: string | null | undefined): ParsedNotes;
    encodeFinancialData(notes: string | null, financial: AppointmentFinancial | null): string;
    getAppointmentId(appointment: Appointment): string | number;
    isLead(appointment: Appointment): boolean;
}

export const AppointmentsService: AppointmentsServiceType = {
    API_URL: '/api/appointments',

    getToken(): string | null {
        return (
            sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('accessToken')
        );
    },

    getHeaders(includeContentType: boolean = true): Record<string, string> {
        const headers: Record<string, string> = {};
        const token = this.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (includeContentType) headers['Content-Type'] = 'application/json';
        return headers;
    },

    async getById(id: string | number): Promise<Appointment> {
        const response = await fetch(`${this.API_URL}/${id}`, {
            headers: this.getHeaders(false),
        });

        if (!response.ok) {
            throw new Error('Agendamento não encontrado');
        }

        return await response.json();
    },

    async getByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
        const url = `${this.API_URL}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
        const response = await fetch(url, {
            headers: this.getHeaders(false),
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar agendamentos');
        }

        return await response.json();
    },

    async update(id: string | number, data: Partial<Appointment>): Promise<Appointment> {
        const response = await fetch(`${this.API_URL}/${id}`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Erro ao atualizar agendamento');
        }

        return await response.json();
    },

    async delete(id: string | number): Promise<unknown> {
        const response = await fetch(`${this.API_URL}/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(false),
        });

        if (!response.ok) {
            throw new Error('Erro ao excluir agendamento');
        }

        return await response.json();
    },

    async confirm(id: string | number): Promise<Appointment> {
        return await this.update(id, { status: 'confirmed' });
    },

    async archive(id: string | number): Promise<Appointment> {
        return await this.update(id, { status: 'cancelled' });
    },

    async complete(id: string | number): Promise<Appointment> {
        return await this.update(id, { status: 'completed' });
    },

    async noShow(id: string | number): Promise<Appointment> {
        return await this.update(id, { status: 'no_show' });
    },

    openWhatsApp(phone: string | null | undefined, message: string = ''): void {
        if (!phone) {
            showToast({ message: 'Telefone não informado', type: 'warning' });
            return;
        }
        const cleanPhone = phone.replace(/\D/g, '');
        const url = message
            ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`
            : `https://wa.me/55${cleanPhone}`;
        window.open(url, '_blank');
    },

    getStatusDisplay(status: string): StatusDisplay {
        const statusMap: Record<string, StatusDisplay> = {
            scheduled: { label: 'Agendado', color: 'bg-amber-500/20 text-amber-300', icon: '📅' },
            confirmed: { label: 'Confirmado', color: 'bg-green-500/20 text-green-300', icon: '✅' },
            completed: { label: 'Atendido', color: 'bg-cyan-500/20 text-cyan-300', icon: '🩺' },
            cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-300', icon: '❌' },
            no_show: {
                label: 'Não compareceu',
                color: 'bg-slate-500/20 text-slate-300',
                icon: '⚠️',
            },
            archived: { label: 'Arquivado', color: 'bg-slate-500/20 text-slate-300', icon: '📦' },
        };
        return statusMap[status] || statusMap['scheduled'];
    },

    formatType(type: string | null | undefined): string {
        if (!type) return 'Consulta';

        const typeMap: Record<string, string> = {
            primeira_consulta: 'Primeira Consulta',
            retorno: 'Retorno',
            avaliacao: 'Avaliação',
            procedimento: 'Procedimento',
            exame: 'Exame',
            urgencia: 'Urgência',
            teleconsulta: 'Teleconsulta',
        };

        if (typeMap[type.toLowerCase()]) {
            return typeMap[type.toLowerCase()];
        }

        if (type.includes(' ') || /^[A-Z]/.test(type)) {
            return type;
        }

        return type
            .replace(/[_-]/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    },

    parseNotes(text: string | null | undefined): ParsedNotes {
        if (!text) return { cleanText: '', financial: null };

        try {
            const jsonMatch = text.match(/\{\s*"financial"\s*:\s*\{[^{}]*\}\s*\}/);
            if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[0]);
                const cleanText = text.replace(jsonMatch[0], '').trim();
                return { cleanText, financial: jsonData.financial };
            }

            const endJsonMatch = text.match(/\{[^{}]*"financial"[^{}]*\{[^{}]*\}[^{}]*\}$/);
            if (endJsonMatch) {
                try {
                    const jsonData = JSON.parse(endJsonMatch[0]);
                    const cleanText = text.replace(endJsonMatch[0], '').trim();
                    return { cleanText, financial: jsonData.financial };
                } catch {
                    // Continue
                }
            }
        } catch {
            // silently fail
        }

        return { cleanText: text, financial: null };
    },

    encodeFinancialData(notes: string | null, financial: AppointmentFinancial | null): string {
        const cleanNotes = notes || '';
        if (!financial || (!financial.value && !financial.paymentType)) {
            return cleanNotes;
        }
        const jsonData = JSON.stringify({ financial });
        return cleanNotes ? `${cleanNotes}\n${jsonData}` : jsonData;
    },

    getAppointmentId(appointment: Appointment): string | number {
        return appointment.composite_id || appointment.id;
    },

    isLead(appointment: Appointment): boolean {
        const id = this.getAppointmentId(appointment);
        return String(id).startsWith('lead-');
    },
};

// ============================================
// GLOBAL ACTION FUNCTIONS
// ============================================

let currentViewingAppointment: Appointment | null = null;

async function confirmAppointment(id: string | number): Promise<void> {
    try {
        await AppointmentsService.confirm(id);
        showToast({ message: 'Agendamento confirmado!', type: 'success' });
        location.reload();
    } catch (error) {
        showToast({
            message: error instanceof Error ? error.message : 'Erro desconhecido',
            type: 'error',
        });
    }
}

async function archiveAppointment(id: string | number): Promise<void> {
    const archiveConfirmed = await showConfirmModal({
        title: 'Arquivar Agendamento',
        message: 'Arquivar este agendamento?',
        confirmText: 'Arquivar',
        cancelText: 'Cancelar',
        icon: 'fa-archive',
        variant: 'warning',
    });
    if (!archiveConfirmed) return;

    try {
        await AppointmentsService.archive(id);
        showToast({ message: 'Agendamento arquivado!', type: 'success' });
        location.reload();
    } catch (error) {
        showToast({
            message: error instanceof Error ? error.message : 'Erro desconhecido',
            type: 'error',
        });
    }
}

async function deleteAppointment(id: string | number): Promise<void> {
    const confirmed = await showConfirmModal({
        title: 'Excluir Agendamento',
        message: 'Excluir este agendamento? Esta ação não pode ser desfeita!',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        icon: 'fa-trash-alt',
        variant: 'danger',
    });
    if (!confirmed) return;

    try {
        await AppointmentsService.delete(id);
        showToast({ message: 'Agendamento excluído!', type: 'success' });
        location.reload();
    } catch (error) {
        showToast({
            message: error instanceof Error ? error.message : 'Erro desconhecido',
            type: 'error',
        });
    }
}

async function completeAppointment(id: string | number): Promise<void> {
    try {
        await AppointmentsService.complete(id);
        showToast({ message: 'Agendamento marcado como atendido!', type: 'success' });
        location.reload();
    } catch (error) {
        showToast({
            message: error instanceof Error ? error.message : 'Erro desconhecido',
            type: 'error',
        });
    }
}

async function markNoShow(id: string | number): Promise<void> {
    const noShowConfirmed = await showConfirmModal({
        title: 'Não Compareceu',
        message: 'Marcar como não compareceu?',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        icon: 'fa-user-times',
        variant: 'warning',
    });
    if (!noShowConfirmed) return;

    try {
        await AppointmentsService.noShow(id);
        showToast({ message: 'Marcado como não compareceu!', type: 'success' });
        location.reload();
    } catch (error) {
        showToast({
            message: error instanceof Error ? error.message : 'Erro desconhecido',
            type: 'error',
        });
    }
}

// ============================================
// VIEW MODAL FUNCTIONS
// ============================================

async function openViewModal(id: string | number): Promise<void> {
    try {
        const appointment = await AppointmentsService.getById(id);
        currentViewingAppointment = appointment;

        const { cleanText, financial } = AppointmentsService.parseNotes(appointment.notes);
        const name = appointment.patient_name || appointment.name || 'Paciente';
        const phone = appointment.patient_phone || appointment.phone || '';
        const status = AppointmentsService.getStatusDisplay(appointment.status);

        const viewPatientInitial = document.getElementById('viewPatientInitial');
        if (viewPatientInitial) {
            viewPatientInitial.textContent = getInitials(name);
            // Apply color class
            const colorClass = getAvatarColorClass(name);
            viewPatientInitial.className = viewPatientInitial.className.replace(/avatar-\w+/g, '');
            viewPatientInitial.classList.add(colorClass);
        }

        const viewPatientName = document.getElementById('viewPatientName');
        if (viewPatientName) viewPatientName.textContent = name;

        const viewPatientPhone = document.getElementById('viewPatientPhone');
        if (viewPatientPhone) {
            viewPatientPhone.innerHTML = phone
                ? `<i class="fas fa-phone text-cyan-400 mr-2"></i>${phone}`
                : '<span class="text-slate-500">Telefone não informado</span>';
        }

        const dateTime = appointment.start_time || appointment.appointment_date;
        if (dateTime) {
            const date = new Date(dateTime);
            const formatted =
                date.toLocaleDateString('pt-BR') +
                ' às ' +
                date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const viewDateTime = document.getElementById('viewDateTime');
            if (viewDateTime) {
                viewDateTime.innerHTML = `<i class="fas fa-clock text-cyan-400 mr-2"></i>${formatted}`;
            }
        }

        const viewStatus = document.getElementById('viewStatus');
        if (viewStatus) {
            viewStatus.innerHTML = `<span class="px-3 py-1 rounded-full text-xs font-semibold ${status.color}">${status.icon} ${status.label}</span>`;
        }

        const viewType = document.getElementById('viewType');
        if (viewType) viewType.textContent = AppointmentsService.formatType(appointment.type);

        const viewDoctor = document.getElementById('viewDoctor');
        if (viewDoctor) viewDoctor.textContent = appointment.doctor || '-';

        const value = financial?.value
            ? `R$ ${parseFloat(String(financial.value)).toFixed(2).replace('.', ',')}`
            : 'R$ 0,00';
        const payment = financial?.paymentType || appointment.insurance || 'Particular';
        const viewFinancial = document.getElementById('viewFinancial');
        if (viewFinancial) viewFinancial.textContent = `${value} - ${payment}`;

        const viewNotes = document.getElementById('viewNotes');
        if (viewNotes) viewNotes.textContent = cleanText || '-';

        const modal = document.getElementById('viewModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    } catch (error) {
        showToast({
            message: error instanceof Error ? error.message : 'Erro desconhecido',
            type: 'error',
        });
    }
}

function closeViewModal(): void {
    const modal = document.getElementById('viewModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    currentViewingAppointment = null;
}

function editAppointmentFromView(): void {
    if (!currentViewingAppointment) return;
    const id = AppointmentsService.getAppointmentId(currentViewingAppointment);
    closeViewModal();
    if (typeof window.openEditModal === 'function') {
        window.openEditModal(id);
    }
}

function confirmAppointmentFromView(): void {
    if (!currentViewingAppointment) return;
    const id = AppointmentsService.getAppointmentId(currentViewingAppointment);
    closeViewModal();
    confirmAppointment(id);
}

function openWhatsAppFromView(): void {
    if (!currentViewingAppointment) return;
    const phone = currentViewingAppointment.patient_phone || currentViewingAppointment.phone;
    AppointmentsService.openWhatsApp(phone);
}

function archiveAppointmentFromView(): void {
    if (!currentViewingAppointment) return;
    const id = AppointmentsService.getAppointmentId(currentViewingAppointment);
    closeViewModal();
    archiveAppointment(id);
}

function deleteAppointmentFromView(): void {
    if (!currentViewingAppointment) return;
    const id = AppointmentsService.getAppointmentId(currentViewingAppointment);
    closeViewModal();
    deleteAppointment(id);
}

// ============================================
// ARCHIVED APPOINTMENTS MODAL FUNCTIONS
// ============================================

let archivedSearchTimeout: ReturnType<typeof setTimeout> | null = null;

async function openArchivedModal(): Promise<void> {
    const modal = document.getElementById('archivedModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    await loadArchivedAppointments();
}

function closeArchivedModal(): void {
    const modal = document.getElementById('archivedModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    const searchInput = document.getElementById('archivedSearch') as HTMLInputElement | null;
    if (searchInput) searchInput.value = '';
}

function searchArchivedAppointments(term: string): void {
    if (archivedSearchTimeout) clearTimeout(archivedSearchTimeout);
    archivedSearchTimeout = setTimeout(() => {
        loadArchivedAppointments(term);
    }, 300);
}

async function loadArchivedAppointments(search: string = ''): Promise<void> {
    const listContainer = document.getElementById('archivedList');
    const countEl = document.getElementById('archivedCount');

    if (!listContainer) return;

    listContainer.innerHTML = `
        <div class="text-center py-8 text-slate-400">
            <i class="fa-solid fa-spinner fa-spin text-3xl mb-3"></i>
            <p>Carregando...</p>
        </div>
    `;

    try {
        const token = AppointmentsService.getToken();
        let url = '/api/appointments/archived?limit=100';
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Erro ao carregar arquivados');

        const data = await response.json();
        const archived: Appointment[] = data.archived || [];

        if (countEl) countEl.textContent = data.total || '0';

        if (archived.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-12">
                    <i class="fa-solid fa-box-open text-slate-500 text-5xl mb-4"></i>
                    <p class="text-slate-400">Nenhum agendamento arquivado</p>
                    ${search ? '<p class="text-slate-500 text-sm mt-2">Tente outro termo de busca</p>' : ''}
                </div>
            `;
            return;
        }

        listContainer.innerHTML = archived.map((apt) => renderArchivedCard(apt)).join('');
    } catch {
        listContainer.innerHTML = `
            <div class="text-center py-8 text-red-400">
                <i class="fa-solid fa-exclamation-triangle text-3xl mb-3"></i>
                <p>Erro ao carregar agendamentos arquivados</p>
            </div>
        `;
    }
}

function renderArchivedCard(apt: Appointment): string {
    const name = apt.patient_name || 'Paciente';
    const phone = apt.patient_phone || '';
    const date = apt.appointment_date
        ? new Date(apt.appointment_date).toLocaleDateString('pt-BR')
        : '-';
    const time = apt.appointment_date
        ? new Date(apt.appointment_date).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
          })
        : '';
    const source = apt.source === 'lead' ? 'Lead' : 'Agendamento';
    const sourceColor =
        apt.source === 'lead' ? 'bg-purple-500/20 text-purple-300' : 'bg-cyan-500/20 text-cyan-300';
    const archivedAt = apt.archived_at
        ? new Date(apt.archived_at).toLocaleDateString('pt-BR')
        : '-';

    return `
        <div class="bg-slate-700/50 border border-slate-600 rounded-xl p-4 hover:border-slate-500 transition">
            <div class="flex items-start justify-between gap-4">
                <div class="flex items-center gap-3 flex-1">
                    ${buildAvatarHTML(name, 'lg')}
                    <div class="flex-1 min-w-0">
                        <h4 class="text-white font-medium truncate">${name}</h4>
                        <p class="text-slate-400 text-sm">
                            ${phone ? `<i class="fa-solid fa-phone mr-1"></i>${phone}` : '<span class="text-slate-500">Sem telefone</span>'}
                        </p>
                        <div class="flex flex-wrap gap-2 mt-2">
                            <span class="px-2 py-0.5 rounded text-xs ${sourceColor}">${source}</span>
                            <span class="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-300">
                                <i class="fa-solid fa-ban mr-1"></i>${apt.status === 'archived' ? 'Arquivado' : 'Cancelado'}
                            </span>
                        </div>
                    </div>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-slate-300 text-sm font-medium">${date}</p>
                    <p class="text-slate-500 text-xs">${time}</p>
                    <p class="text-slate-500 text-xs mt-1">Arquivado: ${archivedAt}</p>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-600">
                <button 
                    onclick="restoreAppointment('${apt.id}')"
                    class="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-sm font-medium transition flex items-center gap-1"
                >
                    <i class="fa-solid fa-rotate-left"></i>
                    Restaurar
                </button>
                <button 
                    onclick="permanentlyDeleteAppointment('${apt.id}')"
                    class="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition flex items-center gap-1"
                >
                    <i class="fa-solid fa-trash"></i>
                    Excluir
                </button>
            </div>
        </div>
    `;
}

async function restoreAppointment(id: string): Promise<void> {
    const restoreConfirmed = await showConfirmModal({
        title: 'Restaurar Agendamento',
        message: 'Restaurar este agendamento? Ele voltará para a agenda.',
        confirmText: 'Restaurar',
        cancelText: 'Cancelar',
        icon: 'fa-undo',
        variant: 'info',
    });
    if (!restoreConfirmed) return;

    try {
        const token = AppointmentsService.getToken();
        const response = await fetch(`/api/appointments/${id}/restore`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Erro ao restaurar');

        showToast({ message: 'Agendamento restaurado com sucesso!', type: 'success' });
        loadArchivedAppointments();

        if (typeof window.loadAgenda === 'function') window.loadAgenda();
        if (typeof window.calendar?.refetchEvents === 'function') window.calendar.refetchEvents();
    } catch {
        showToast({ message: 'Erro ao restaurar agendamento', type: 'error' });
    }
}

async function permanentlyDeleteAppointment(id: string): Promise<void> {
    const confirmed = await showConfirmModal({
        title: 'Exclusão Permanente',
        message: 'Excluir PERMANENTEMENTE este agendamento? Esta ação não pode ser desfeita!',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        icon: 'fa-trash-alt',
        variant: 'danger',
    });
    if (!confirmed) return;

    try {
        await AppointmentsService.delete(id);
        showToast({ message: 'Agendamento excluído permanentemente!', type: 'success' });
        loadArchivedAppointments();
    } catch {
        showToast({ message: 'Erro ao excluir agendamento', type: 'error' });
    }
}

// ============================================
// EXPORT GLOBALLY
// ============================================

if (typeof window !== 'undefined') {
    window.AppointmentsService = AppointmentsService;
    window.confirmAppointment = confirmAppointment;
    window.archiveAppointment = archiveAppointment;
    window.deleteAppointment = deleteAppointment;
    window.completeAppointment = completeAppointment;
    window.markNoShow = markNoShow;
    window.openViewModal = openViewModal;
    window.closeViewModal = closeViewModal;
    window.editAppointmentFromView = editAppointmentFromView;
    window.confirmAppointmentFromView = confirmAppointmentFromView;
    window.openWhatsAppFromView = openWhatsAppFromView;
    window.archiveAppointmentFromView = archiveAppointmentFromView;
    window.deleteAppointmentFromView = deleteAppointmentFromView;
    window.openArchivedModal = openArchivedModal;
    window.closeArchivedModal = closeArchivedModal;
    window.searchArchivedAppointments = searchArchivedAppointments;
    window.loadArchivedAppointments = loadArchivedAppointments;
    window.restoreAppointment = restoreAppointment;
    window.permanentlyDeleteAppointment = permanentlyDeleteAppointment;
}

export {
    confirmAppointment,
    archiveAppointment,
    deleteAppointment,
    completeAppointment,
    markNoShow,
    openViewModal,
    closeViewModal,
    openArchivedModal,
    closeArchivedModal,
    loadArchivedAppointments,
};
