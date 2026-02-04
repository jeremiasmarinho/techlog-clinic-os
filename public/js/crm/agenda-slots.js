/**
 * Agenda Slots - Lista de Horários do Dia
 * Uma visualização mais intuitiva para clínicas médicas
 */

class AgendaSlots {
    constructor(options = {}) {
        this.container = document.getElementById('slotsContainer');
        this.currentDate = new Date();
        this.currentDate.setHours(0, 0, 0, 0);
        this.appointments = [];
        this.doctors = [];
        this.selectedDoctor = '';

        // Configurações de horário
        this.startHour = options.startHour || 7;
        this.endHour = options.endHour || 20;
        this.slotDuration = options.slotDuration || 30; // minutos

        this.token =
            sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('accessToken');

        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadDoctors();
        await this.loadInsurancePlans();
        await this.loadAppointments();
        this.render();
    }

    bindEvents() {
        // Navegação de data
        document.getElementById('prevDay')?.addEventListener('click', () => this.changeDay(-1));
        document.getElementById('nextDay')?.addEventListener('click', () => this.changeDay(1));
        document.getElementById('todayBtn')?.addEventListener('click', () => this.goToToday());

        // Filtro de profissional
        document.getElementById('doctorFilter')?.addEventListener('change', (e) => {
            this.selectedDoctor = e.target.value;
            this.render();
        });
    }

    changeDay(delta) {
        this.currentDate.setDate(this.currentDate.getDate() + delta);
        this.loadAppointments().then(() => this.render());
    }

    goToToday() {
        this.currentDate = new Date();
        this.currentDate.setHours(0, 0, 0, 0);
        this.loadAppointments().then(() => this.render());
    }

    async loadDoctors() {
        try {
            const response = await fetch('/api/users?role=doctor', {
                headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
            });
            if (response.ok) {
                const data = await response.json();
                this.doctors = data.users || data || [];
                this.populateDoctorFilter();
            }
        } catch (error) {
            console.error('Erro ao carregar médicos:', error);
        }
    }

    async loadInsurancePlans() {
        try {
            const response = await fetch('/api/clinic/settings', {
                headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
            });
            if (response.ok) {
                const data = await response.json();
                let plans = data.settings?.insurancePlans || data.insurancePlans || [];
                // Sempre inclui "Particular" como primeira opção
                if (!plans.includes('Particular')) {
                    plans = ['Particular', ...plans];
                }
                this.insurancePlans = plans;
                this.populateInsuranceSelects();
            }
        } catch (error) {
            console.error('Erro ao carregar convênios:', error);
            this.insurancePlans = ['Particular'];
            this.populateInsuranceSelects();
        }
    }

    populateInsuranceSelects() {
        const selects = ['quickInsurance', 'editInsurance'];
        selects.forEach((selectId) => {
            const select = document.getElementById(selectId);
            if (!select) return;

            select.innerHTML = '';
            this.insurancePlans.forEach((plan) => {
                const option = document.createElement('option');
                option.value = plan;
                option.textContent = plan;
                select.appendChild(option);
            });
        });
        console.log('✅ Convênios carregados:', this.insurancePlans);
    }

    populateDoctorFilter() {
        const select = document.getElementById('doctorFilter');
        if (!select) return;

        select.innerHTML = '<option value="">Todos os Profissionais</option>';
        this.doctors.forEach((doc) => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.name;
            select.appendChild(option);
        });

        // Também popula os selects dos modais
        this.populateModalDoctorSelects();
    }

    populateModalDoctorSelects() {
        const selects = ['quickDoctor', 'editDoctor'];
        selects.forEach((selectId) => {
            const select = document.getElementById(selectId);
            if (!select) return;

            select.innerHTML = '<option value="">Selecione...</option>';
            this.doctors.forEach((doc) => {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = doc.name;
                select.appendChild(option);
            });
        });
    }

    async loadAppointments() {
        const dateStr = this.formatDateISO(this.currentDate);

        try {
            const response = await fetch(`/api/appointments?date=${dateStr}`, {
                headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
            });

            if (response.ok) {
                const data = await response.json();
                this.appointments = data.appointments || data || [];
            }
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            this.appointments = [];
        }
    }

    generateTimeSlots() {
        const slots = [];
        for (let hour = this.startHour; hour < this.endHour; hour++) {
            for (let min = 0; min < 60; min += this.slotDuration) {
                slots.push({
                    hour,
                    minute: min,
                    time: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
                });
            }
        }
        return slots;
    }

    getAppointmentForSlot(slotTime) {
        return this.appointments.find((apt) => {
            const aptDate = new Date(apt.start_time || apt.appointment_date);
            const aptTime = `${String(aptDate.getHours()).padStart(2, '0')}:${String(aptDate.getMinutes()).padStart(2, '0')}`;

            // Filtro por médico se selecionado
            if (this.selectedDoctor && apt.doctor_id != this.selectedDoctor) {
                return false;
            }

            return aptTime === slotTime;
        });
    }

    getStatusInfo(status) {
        const statusMap = {
            scheduled: { label: 'Agendado', color: 'amber', icon: 'fa-clock' },
            confirmed: { label: 'Confirmado', color: 'green', icon: 'fa-check-circle' },
            completed: { label: 'Atendido', color: 'cyan', icon: 'fa-user-check' },
            cancelled: { label: 'Cancelado', color: 'red', icon: 'fa-times-circle' },
            no_show: { label: 'Faltou', color: 'slate', icon: 'fa-user-slash' },
            waiting: { label: 'Aguardando', color: 'amber', icon: 'fa-hourglass-half' },
            triage: { label: 'Triagem', color: 'blue', icon: 'fa-clipboard-list' },
            consultation: { label: 'Em Consulta', color: 'purple', icon: 'fa-stethoscope' },
            finished: { label: 'Finalizado', color: 'cyan', icon: 'fa-check-double' },
        };
        return statusMap[status] || { label: status, color: 'gray', icon: 'fa-question' };
    }

    formatDateDisplay(date) {
        const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const months = [
            'Janeiro',
            'Fevereiro',
            'Março',
            'Abril',
            'Maio',
            'Junho',
            'Julho',
            'Agosto',
            'Setembro',
            'Outubro',
            'Novembro',
            'Dezembro',
        ];

        const weekday = weekdays[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        return { weekday, day, month, year, full: `${weekday}, ${day} de ${month}` };
    }

    formatDateISO(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    isPast(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    }

    getStats() {
        const filtered = this.selectedDoctor
            ? this.appointments.filter((a) => a.doctor_id == this.selectedDoctor)
            : this.appointments;

        const total = filtered.length;
        const confirmed = filtered.filter((a) => a.status === 'confirmed').length;
        const scheduled = filtered.filter((a) => a.status === 'scheduled').length;
        const completed = filtered.filter((a) =>
            ['completed', 'finished'].includes(a.status)
        ).length;
        const totalSlots = (this.endHour - this.startHour) * (60 / this.slotDuration);
        const available = totalSlots - total;

        return { total, confirmed, scheduled, completed, available, totalSlots };
    }

    render() {
        if (!this.container) return;

        const dateInfo = this.formatDateDisplay(this.currentDate);
        const stats = this.getStats();
        const slots = this.generateTimeSlots();
        const isToday = this.isToday(this.currentDate);
        const isPastDay = this.isPast(this.currentDate);

        // Atualiza o header de data
        document.getElementById('currentDateDisplay').innerHTML = `
            <span class="text-cyan-400">${dateInfo.weekday}</span>, 
            <span class="text-white font-bold">${dateInfo.day}</span> de 
            <span class="text-white">${dateInfo.month}</span>
        `;

        // Atualiza o badge "Hoje"
        const todayBadge = document.getElementById('todayBadge');
        if (todayBadge) {
            todayBadge.classList.toggle('hidden', !isToday);
        }

        // Atualiza estatísticas
        document.getElementById('statTotal').textContent = stats.total;
        document.getElementById('statConfirmed').textContent = stats.confirmed;
        document.getElementById('statAvailable').textContent = stats.available;

        // Renderiza os slots
        let slotsHTML = '';
        const now = new Date();

        slots.forEach((slot) => {
            const appointment = this.getAppointmentForSlot(slot.time);
            const slotDateTime = new Date(this.currentDate);
            slotDateTime.setHours(slot.hour, slot.minute);
            const isPastSlot = slotDateTime < now;

            if (appointment) {
                const status = this.getStatusInfo(appointment.status);
                const initials = this.getInitials(appointment.patient_name);

                slotsHTML += `
                    <div class="slot-row slot-occupied group" data-appointment-id="${appointment.id}">
                        <div class="slot-time">${slot.time}</div>
                        <div class="slot-content bg-${status.color}-500/10 border-${status.color}-500/30 hover:bg-${status.color}-500/20">
                            <div class="flex items-center gap-3 flex-1 min-w-0">
                                <div class="slot-avatar bg-${status.color}-500/30 text-${status.color}-300">
                                    ${initials}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <span class="font-semibold text-white truncate">${appointment.patient_name}</span>
                                        <span class="slot-status bg-${status.color}-500/20 text-${status.color}-300">
                                            <i class="fas ${status.icon} text-xs"></i>
                                            ${status.label}
                                        </span>
                                    </div>
                                    <div class="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                                        ${appointment.patient_phone ? `<span><i class="fas fa-phone text-slate-500 mr-1"></i>${appointment.patient_phone}</span>` : ''}
                                        ${appointment.insurance ? `<span><i class="fas fa-id-card text-slate-500 mr-1"></i>${appointment.insurance}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                            <div class="slot-actions">
                                <button onclick="agendaSlots.viewAppointment(${appointment.id})" class="slot-action-btn text-cyan-400 hover:bg-cyan-500/20" title="Ver detalhes">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="agendaSlots.editAppointment(${appointment.id})" class="slot-action-btn text-blue-400 hover:bg-blue-500/20" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                ${
                                    appointment.patient_phone
                                        ? `
                                    <button onclick="agendaSlots.openWhatsApp('${appointment.patient_phone}')" class="slot-action-btn text-green-400 hover:bg-green-500/20" title="WhatsApp">
                                        <i class="fab fa-whatsapp"></i>
                                    </button>
                                `
                                        : ''
                                }
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Slot livre
                const slotClass = isPastSlot ? 'slot-past' : 'slot-free';
                slotsHTML += `
                    <div class="slot-row ${slotClass}">
                        <div class="slot-time">${slot.time}</div>
                        <div class="slot-content slot-empty ${isPastSlot ? 'opacity-40' : 'hover:bg-cyan-500/10 cursor-pointer'}" 
                             ${!isPastSlot ? `onclick="agendaSlots.quickSchedule('${slot.time}')"` : ''}>
                            <div class="flex items-center gap-3 text-slate-500">
                                <i class="fas fa-calendar-plus"></i>
                                <span>${isPastSlot ? 'Horário passado' : 'Horário livre - Clique para agendar'}</span>
                            </div>
                            ${
                                !isPastSlot
                                    ? `
                                <button class="slot-add-btn">
                                    <i class="fas fa-plus"></i>
                                </button>
                            `
                                    : ''
                            }
                        </div>
                    </div>
                `;
            }
        });

        this.container.innerHTML = slotsHTML;
    }

    getInitials(name) {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    quickSchedule(time) {
        const dateStr = this.formatDateISO(this.currentDate);
        const dateTime = `${dateStr}T${time}`;

        // Abre o modal de agendamento rápido
        const modal = document.getElementById('quickScheduleModal');
        const dateInput = document.getElementById('quickDateTime');
        const nameInput = document.getElementById('quickPatientName');

        if (modal && dateInput) {
            dateInput.value = dateTime;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            if (nameInput) setTimeout(() => nameInput.focus(), 100);
        }
    }

    viewAppointment(id) {
        const apt = this.appointments.find((a) => a.id === id);
        if (!apt) return;

        // Preenche o modal de visualização
        document.getElementById('viewPatientInitial').textContent = this.getInitials(
            apt.patient_name
        );
        document.getElementById('viewPatientName').textContent = apt.patient_name;
        document.getElementById('viewPatientPhone').innerHTML =
            `<i class="fas fa-phone text-cyan-400 mr-2"></i>${apt.patient_phone || 'Não informado'}`;

        const aptDate = new Date(apt.start_time || apt.appointment_date);
        document.getElementById('viewDateTime').innerHTML =
            `<i class="fas fa-clock text-cyan-400 mr-2"></i>${aptDate.toLocaleDateString('pt-BR')} às ${aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

        const status = this.getStatusInfo(apt.status);
        document.getElementById('viewStatus').innerHTML =
            `<span class="px-3 py-1 rounded-full text-xs font-semibold bg-${status.color}-500/20 text-${status.color}-300">${status.label}</span>`;

        document.getElementById('viewType').textContent = apt.type || 'Consulta';
        document.getElementById('viewDoctor').textContent = apt.doctor_name || '-';
        document.getElementById('viewFinancial').textContent =
            `R$ ${apt.value || '0,00'} - ${apt.insurance || 'Particular'}`;
        document.getElementById('viewNotes').textContent = apt.notes || '-';

        // Armazena o ID atual
        window.currentViewAppointmentId = id;
        window.currentViewAppointment = apt;

        // Abre o modal
        const modal = document.getElementById('viewModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    editAppointment(id) {
        const apt = this.appointments.find((a) => a.id === id);
        if (!apt) return;

        // Preenche o formulário de edição
        document.getElementById('editId').value = apt.id;
        document.getElementById('editName').value = apt.patient_name || '';
        document.getElementById('editPhone').value = apt.patient_phone || '';

        const aptDate = new Date(apt.start_time || apt.appointment_date);
        document.getElementById('editDate').value = aptDate.toISOString().slice(0, 16);

        document.getElementById('editDoctor').value = apt.doctor_id || '';
        document.getElementById('editType').value = apt.type || '';
        document.getElementById('editStatus').value = apt.status || 'scheduled';
        document.getElementById('editValue').value = apt.value || '';
        document.getElementById('editInsurance').value = apt.insurance || '';
        document.getElementById('editNotes').value = apt.notes || '';

        // Abre o modal
        const modal = document.getElementById('editModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    openWhatsApp(phone) {
        if (!phone) return;
        const cleanPhone = phone.replace(/\D/g, '');
        const whatsappPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        window.open(`https://wa.me/${whatsappPhone}`, '_blank');
    }

    async refresh() {
        await this.loadAppointments();
        this.render();
    }
}

// Inicializa quando o DOM estiver pronto
let agendaSlots;

document.addEventListener('DOMContentLoaded', () => {
    agendaSlots = new AgendaSlots();
    window.agendaSlots = agendaSlots;
});

// Funções globais para os modais
function closeViewModal() {
    const modal = document.getElementById('viewModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function closeQuickScheduleModal() {
    const modal = document.getElementById('quickScheduleModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}
window.closeQuickScheduleModal = closeQuickScheduleModal;

// Salvar edição
async function saveEdit(event) {
    event.preventDefault();

    const id = document.getElementById('editId').value;
    const token =
        sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken');

    const data = {
        patient_name: document.getElementById('editName').value,
        patient_phone: document.getElementById('editPhone').value,
        appointment_date: new Date(document.getElementById('editDate').value).toISOString(),
        start_time: new Date(document.getElementById('editDate').value).toISOString(),
        doctor_id: document.getElementById('editDoctor').value || null,
        type: document.getElementById('editType').value,
        status: document.getElementById('editStatus').value,
        value: document.getElementById('editValue').value,
        insurance: document.getElementById('editInsurance').value,
        notes: document.getElementById('editNotes').value,
    };

    try {
        const response = await fetch(`/api/appointments/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            closeEditModal();
            agendaSlots.refresh();
            showToast?.('Agendamento atualizado com sucesso!', 'success');
        } else {
            throw new Error('Erro ao atualizar');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast?.('Erro ao atualizar agendamento', 'error');
    }
}

// Ações do modal de visualização
function confirmAppointmentFromView() {
    if (window.currentViewAppointmentId) {
        updateAppointmentStatus(window.currentViewAppointmentId, 'confirmed');
    }
}

function editAppointmentFromView() {
    closeViewModal();
    if (window.currentViewAppointmentId) {
        agendaSlots.editAppointment(window.currentViewAppointmentId);
    }
}

function openWhatsAppFromView() {
    if (window.currentViewAppointment?.patient_phone) {
        agendaSlots.openWhatsApp(window.currentViewAppointment.patient_phone);
    }
}

function archiveAppointmentFromView() {
    if (window.currentViewAppointmentId) {
        updateAppointmentStatus(window.currentViewAppointmentId, 'completed');
    }
}

function deleteAppointmentFromView() {
    if (
        window.currentViewAppointmentId &&
        confirm('Tem certeza que deseja excluir este agendamento?')
    ) {
        deleteAppointment(window.currentViewAppointmentId);
    }
}

async function updateAppointmentStatus(id, status) {
    const token =
        sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken');

    try {
        const response = await fetch(`/api/appointments/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ status }),
        });

        if (response.ok) {
            closeViewModal();
            agendaSlots.refresh();
            showToast?.('Status atualizado!', 'success');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast?.('Erro ao atualizar status', 'error');
    }
}

async function deleteAppointment(id) {
    const token =
        sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken');

    try {
        const response = await fetch(`/api/appointments/${id}`, {
            method: 'DELETE',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (response.ok) {
            closeViewModal();
            agendaSlots.refresh();
            showToast?.('Agendamento excluído!', 'success');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast?.('Erro ao excluir agendamento', 'error');
    }
}

// Quick Schedule Form
document.getElementById('quickScheduleForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const token =
        sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken');

    const dateTime = new Date(document.getElementById('quickDateTime').value);
    const endTime = new Date(dateTime);
    endTime.setMinutes(endTime.getMinutes() + 30);

    const data = {
        patient_name: document.getElementById('quickPatientName').value,
        patient_phone: document.getElementById('quickPatientPhone').value || '',
        doctor_id: document.getElementById('quickDoctor')?.value || null,
        type: document.getElementById('quickType')?.value || '',
        insurance: document.getElementById('quickInsurance').value || 'Particular',
        value: document.getElementById('quickValue')?.value || '',
        notes: document.getElementById('quickNotes')?.value || '',
        appointment_date: dateTime.toISOString(),
        start_time: dateTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: 30,
        status: document.getElementById('quickStatus')?.value || 'scheduled',
    };

    try {
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            closeQuickScheduleModal();
            document.getElementById('quickScheduleForm').reset();
            agendaSlots.refresh();
            showToast?.('Agendamento criado com sucesso!', 'success');
        } else {
            throw new Error('Erro ao criar agendamento');
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast?.('Erro ao criar agendamento', 'error');
    }
});

// Toast simples se não existir
if (typeof showToast !== 'function') {
    window.showToast = function (message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 animate-pulse ${
            type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };
}
