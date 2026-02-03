/**
 * Appointments Service - Centralized CRUD operations
 * Single source of truth for all appointment/lead operations
 */

const AppointmentsService = {
    API_URL: '/api/appointments',

    /**
     * Get auth token from session
     */
    getToken() {
        return (
            sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('accessToken')
        );
    },

    /**
     * Get headers with auth
     */
    getHeaders(includeContentType = true) {
        const headers = {};
        const token = this.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (includeContentType) headers['Content-Type'] = 'application/json';
        return headers;
    },

    /**
     * Fetch single appointment/lead by ID
     * Handles both regular appointments and leads (lead-123 format)
     */
    async getById(id) {
        const response = await fetch(`${this.API_URL}/${id}`, {
            headers: this.getHeaders(false),
        });

        if (!response.ok) {
            throw new Error('Agendamento não encontrado');
        }

        return await response.json();
    },

    /**
     * Fetch appointments for a date range
     */
    async getByDateRange(startDate, endDate) {
        const url = `${this.API_URL}?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
        const response = await fetch(url, {
            headers: this.getHeaders(false),
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar agendamentos');
        }

        return await response.json();
    },

    /**
     * Update appointment (partial update)
     */
    async update(id, data) {
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

    /**
     * Delete appointment
     */
    async delete(id) {
        const response = await fetch(`${this.API_URL}/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders(false),
        });

        if (!response.ok) {
            throw new Error('Erro ao excluir agendamento');
        }

        return await response.json();
    },

    /**
     * Confirm appointment (set status to confirmed)
     */
    async confirm(id) {
        return await this.update(id, { status: 'confirmed' });
    },

    /**
     * Archive/Cancel appointment
     */
    async archive(id) {
        return await this.update(id, { status: 'cancelled' });
    },

    /**
     * Mark as completed
     */
    async complete(id) {
        return await this.update(id, { status: 'completed' });
    },

    /**
     * Mark as no-show
     */
    async noShow(id) {
        return await this.update(id, { status: 'no_show' });
    },

    // ============================================
    // UI HELPER METHODS
    // ============================================

    /**
     * Open WhatsApp for appointment
     */
    openWhatsApp(phone, message = '') {
        if (!phone) {
            alert('Telefone não informado');
            return;
        }
        const cleanPhone = phone.replace(/\D/g, '');
        const url = message
            ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`
            : `https://wa.me/55${cleanPhone}`;
        window.open(url, '_blank');
    },

    /**
     * Format status for display
     */
    getStatusDisplay(status) {
        const statusMap = {
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

    /**
     * Parse notes field to extract financial data
     */
    parseNotes(text) {
        if (!text) return { cleanText: '', financial: null };

        try {
            const jsonMatch = text.match(/\{"financial":\{[^}]+\}\}/);
            if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[0]);
                const cleanText = text.replace(jsonMatch[0], '').trim();
                return { cleanText, financial: jsonData.financial };
            }
        } catch (e) {
            console.warn('Error parsing notes JSON:', e);
        }

        return { cleanText: text, financial: null };
    },

    /**
     * Encode financial data into notes
     */
    encodeFinancialData(notes, financial) {
        const cleanNotes = notes || '';
        if (!financial || (!financial.value && !financial.paymentType)) {
            return cleanNotes;
        }
        const jsonData = JSON.stringify({ financial });
        return cleanNotes ? `${cleanNotes}\n${jsonData}` : jsonData;
    },

    /**
     * Get appointment ID (handles both regular and lead IDs)
     */
    getAppointmentId(appointment) {
        return appointment.composite_id || appointment.id;
    },

    /**
     * Check if appointment is a lead
     */
    isLead(appointment) {
        const id = this.getAppointmentId(appointment);
        return String(id).startsWith('lead-');
    },
};

// ============================================
// GLOBAL ACTION FUNCTIONS
// ============================================

/**
 * Confirm appointment with user confirmation
 */
async function confirmAppointment(id) {
    try {
        await AppointmentsService.confirm(id);
        alert('✅ Agendamento confirmado!');
        location.reload();
    } catch (error) {
        console.error('Erro ao confirmar:', error);
        alert('❌ ' + error.message);
    }
}

/**
 * Archive appointment with user confirmation
 */
async function archiveAppointment(id) {
    if (!confirm('⚠️ Arquivar este agendamento?')) return;

    try {
        await AppointmentsService.archive(id);
        alert('✅ Agendamento arquivado!');
        location.reload();
    } catch (error) {
        console.error('Erro ao arquivar:', error);
        alert('❌ ' + error.message);
    }
}

/**
 * Delete appointment with user confirmation
 */
async function deleteAppointment(id) {
    if (!confirm('🗑️ Excluir este agendamento? Esta ação não pode ser desfeita!')) return;

    try {
        await AppointmentsService.delete(id);
        alert('✅ Agendamento excluído!');
        location.reload();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('❌ ' + error.message);
    }
}

/**
 * Mark appointment as completed
 */
async function completeAppointment(id) {
    try {
        await AppointmentsService.complete(id);
        alert('✅ Agendamento marcado como atendido!');
        location.reload();
    } catch (error) {
        console.error('Erro ao marcar como atendido:', error);
        alert('❌ ' + error.message);
    }
}

/**
 * Mark appointment as no-show
 */
async function markNoShow(id) {
    if (!confirm('⚠️ Marcar como não compareceu?')) return;

    try {
        await AppointmentsService.noShow(id);
        alert('✅ Marcado como não compareceu!');
        location.reload();
    } catch (error) {
        console.error('Erro:', error);
        alert('❌ ' + error.message);
    }
}

// ============================================
// VIEW MODAL FUNCTIONS
// ============================================

let currentViewingAppointment = null;

/**
 * Open View Modal with appointment details
 */
async function openViewModal(id) {
    try {
        const appointment = await AppointmentsService.getById(id);
        currentViewingAppointment = appointment;

        const { cleanText, financial } = AppointmentsService.parseNotes(appointment.notes);
        const name = appointment.patient_name || appointment.name || 'Paciente';
        const phone = appointment.patient_phone || appointment.phone || '';
        const status = AppointmentsService.getStatusDisplay(appointment.status);

        // Populate modal
        document.getElementById('viewPatientInitial').textContent = name.charAt(0).toUpperCase();
        document.getElementById('viewPatientName').textContent = name;
        document.getElementById('viewPatientPhone').innerHTML = phone
            ? `<i class="fas fa-phone text-cyan-400 mr-2"></i>${phone}`
            : '<span class="text-slate-500">Telefone não informado</span>';

        // Format date/time
        const dateTime = appointment.start_time || appointment.appointment_date;
        if (dateTime) {
            const date = new Date(dateTime);
            const formatted =
                date.toLocaleDateString('pt-BR') +
                ' às ' +
                date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            document.getElementById('viewDateTime').innerHTML =
                `<i class="fas fa-clock text-cyan-400 mr-2"></i>${formatted}`;
        }

        // Status
        document.getElementById('viewStatus').innerHTML =
            `<span class="px-3 py-1 rounded-full text-xs font-semibold ${status.color}">${status.icon} ${status.label}</span>`;

        // Type & Doctor
        document.getElementById('viewType').textContent = appointment.type || 'Consulta';
        document.getElementById('viewDoctor').textContent = appointment.doctor || '-';

        // Financial
        const value = financial?.value
            ? `R$ ${parseFloat(financial.value).toFixed(2).replace('.', ',')}`
            : 'R$ 0,00';
        const payment = financial?.paymentType || appointment.insurance || 'Particular';
        document.getElementById('viewFinancial').textContent = `${value} - ${payment}`;

        // Notes
        document.getElementById('viewNotes').textContent = cleanText || '-';

        // Show modal
        const modal = document.getElementById('viewModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    } catch (error) {
        console.error('Erro ao carregar agendamento:', error);
        alert('❌ ' + error.message);
    }
}

function closeViewModal() {
    const modal = document.getElementById('viewModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    currentViewingAppointment = null;
}

function editAppointmentFromView() {
    if (!currentViewingAppointment) return;
    const id = AppointmentsService.getAppointmentId(currentViewingAppointment);
    closeViewModal();
    if (typeof window.openEditModal === 'function') {
        window.openEditModal(id);
    }
}

function confirmAppointmentFromView() {
    if (!currentViewingAppointment) return;
    const id = AppointmentsService.getAppointmentId(currentViewingAppointment);
    closeViewModal();
    confirmAppointment(id);
}

function openWhatsAppFromView() {
    if (!currentViewingAppointment) return;
    const phone = currentViewingAppointment.patient_phone || currentViewingAppointment.phone;
    AppointmentsService.openWhatsApp(phone);
}

function archiveAppointmentFromView() {
    if (!currentViewingAppointment) return;
    const id = AppointmentsService.getAppointmentId(currentViewingAppointment);
    closeViewModal();
    archiveAppointment(id);
}

function deleteAppointmentFromView() {
    if (!currentViewingAppointment) return;
    const id = AppointmentsService.getAppointmentId(currentViewingAppointment);
    closeViewModal();
    deleteAppointment(id);
}

// ============================================
// ARCHIVED APPOINTMENTS MODAL FUNCTIONS
// ============================================

let archivedSearchTimeout = null;

/**
 * Open Archived Appointments Modal
 */
async function openArchivedModal() {
    const modal = document.getElementById('archivedModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Load archived appointments
    await loadArchivedAppointments();
}

/**
 * Close Archived Appointments Modal
 */
function closeArchivedModal() {
    const modal = document.getElementById('archivedModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    // Clear search
    const searchInput = document.getElementById('archivedSearch');
    if (searchInput) searchInput.value = '';
}

/**
 * Search Archived Appointments with debounce
 */
function searchArchivedAppointments(term) {
    clearTimeout(archivedSearchTimeout);
    archivedSearchTimeout = setTimeout(() => {
        loadArchivedAppointments(term);
    }, 300);
}

/**
 * Load Archived Appointments from API
 */
async function loadArchivedAppointments(search = '') {
    const listContainer = document.getElementById('archivedList');
    const countEl = document.getElementById('archivedCount');

    if (!listContainer) return;

    // Show loading
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
        const archived = data.archived || [];

        // Update count
        if (countEl) countEl.textContent = data.total || 0;

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

        // Render list
        listContainer.innerHTML = archived.map((apt) => renderArchivedCard(apt)).join('');
    } catch (error) {
        console.error('Error loading archived:', error);
        listContainer.innerHTML = `
            <div class="text-center py-8 text-red-400">
                <i class="fa-solid fa-exclamation-triangle text-3xl mb-3"></i>
                <p>Erro ao carregar agendamentos arquivados</p>
            </div>
        `;
    }
}

/**
 * Render a single archived appointment card
 */
function renderArchivedCard(apt) {
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
                    <div class="w-12 h-12 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-lg">
                        ${name.charAt(0).toUpperCase()}
                    </div>
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

/**
 * Restore an archived appointment
 */
async function restoreAppointment(id) {
    if (!confirm('Restaurar este agendamento? Ele voltará para a agenda.')) return;

    try {
        const token = AppointmentsService.getToken();
        const response = await fetch(`/api/appointments/${id}/restore`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Erro ao restaurar');

        alert('✅ Agendamento restaurado com sucesso!');
        loadArchivedAppointments(); // Refresh list

        // Refresh main calendar if available
        if (typeof loadAgenda === 'function') loadAgenda();
        if (typeof window.calendar?.refetchEvents === 'function') window.calendar.refetchEvents();
    } catch (error) {
        console.error('Error restoring:', error);
        alert('❌ Erro ao restaurar agendamento');
    }
}

/**
 * Permanently delete an archived appointment
 */
async function permanentlyDeleteAppointment(id) {
    if (
        !confirm('⚠️ Excluir PERMANENTEMENTE este agendamento?\n\nEsta ação não pode ser desfeita!')
    )
        return;

    try {
        await AppointmentsService.delete(id);
        alert('✅ Agendamento excluído permanentemente!');
        loadArchivedAppointments(); // Refresh list
    } catch (error) {
        console.error('Error deleting:', error);
        alert('❌ Erro ao excluir agendamento');
    }
}

// ============================================
// EXPORT GLOBALLY
// ============================================

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

// Archived modal functions
window.openArchivedModal = openArchivedModal;
window.closeArchivedModal = closeArchivedModal;
window.searchArchivedAppointments = searchArchivedAppointments;
window.loadArchivedAppointments = loadArchivedAppointments;
window.restoreAppointment = restoreAppointment;
window.permanentlyDeleteAppointment = permanentlyDeleteAppointment;
