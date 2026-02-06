/**
 * Agenda Slots - Lista de Horários do Dia
 * Uma visualização mais intuitiva para clínicas médicas
 */

declare function showConfirmModal(options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    icon?: string;
    variant?: string;
}): Promise<boolean>;

interface AgendaSlotsOptions {
    startHour?: number;
    endHour?: number;
    slotDuration?: number;
}

interface Appointment {
    id: number;
    patient_name: string;
    patient_phone?: string;
    start_time?: string;
    appointment_date?: string;
    end_time?: string;
    duration_minutes?: number;
    status: string;
    doctor_id?: number | string;
    doctor_name?: string;
    type?: string;
    insurance?: string;
    notes?: string;
    value?: string;
}

interface Doctor {
    id: number;
    name: string;
}

interface TimeSlot {
    hour: number;
    minute: number;
    time: string;
}

interface StatusInfo {
    label: string;
    color: string;
    icon: string;
}

interface DateInfo {
    weekday: string;
    day: number;
    month: string;
    year: number;
    full: string;
}

interface AgendaStats {
    total: number;
    confirmed: number;
    scheduled: number;
    completed: number;
    available: number;
    totalSlots: number;
}

interface ParsedNotes {
    cleanText: string;
    financial: { paymentType?: string; insuranceName?: string; value?: string } | null;
}

declare function showToast(message: string, type?: string): void;

declare global {
    interface Window {
        agendaSlots: AgendaSlots;
        currentViewAppointmentId: number | null;
        currentViewAppointment: Appointment | null;
        showToast: (message: string, type?: string) => void;
        closeQuickScheduleModal: () => void;
    }
}

class AgendaSlots {
    container: HTMLElement | null;
    currentDate: Date;
    appointments: Appointment[];
    doctors: Doctor[];
    selectedDoctor: string;
    startHour: number;
    endHour: number;
    slotDuration: number;
    token: string | null;
    insurancePlans: string[];

    constructor(options: AgendaSlotsOptions = {}) {
        this.container = document.getElementById('slotsContainer');
        this.currentDate = new Date();
        this.currentDate.setHours(0, 0, 0, 0);
        this.appointments = [];
        this.doctors = [];
        this.selectedDoctor = '';
        this.insurancePlans = [];

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

    async init(): Promise<void> {
        this.bindEvents();
        await this.loadDoctors();
        await this.loadInsurancePlans();
        await this.loadAppointments();
        this.render();
    }

    bindEvents(): void {
        // Navegação de data
        document.getElementById('prevDay')?.addEventListener('click', () => this.changeDay(-1));
        document.getElementById('nextDay')?.addEventListener('click', () => this.changeDay(1));
        document.getElementById('todayBtn')?.addEventListener('click', () => this.goToToday());

        // Filtro de profissional
        document.getElementById('doctorFilter')?.addEventListener('change', (e: Event) => {
            this.selectedDoctor = (e.target as HTMLSelectElement).value;
            this.render();
        });
    }

    changeDay(delta: number): void {
        this.currentDate.setDate(this.currentDate.getDate() + delta);
        this.loadAppointments().then(() => this.render());
    }

    goToToday(): void {
        this.currentDate = new Date();
        this.currentDate.setHours(0, 0, 0, 0);
        this.loadAppointments().then(() => this.render());
    }

    async loadDoctors(): Promise<void> {
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

    async loadInsurancePlans(): Promise<void> {
        try {
            const response = await fetch('/api/clinic/settings', {
                headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
            });
            if (response.ok) {
                const data = await response.json();
                let plans: string[] = data.settings?.insurancePlans || data.insurancePlans || [];
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

    populateInsuranceSelects(): void {
        const selects: string[] = ['quickInsurance', 'editInsurance'];
        selects.forEach((selectId: string) => {
            const select = document.getElementById(selectId) as HTMLSelectElement | null;
            if (!select) return;

            select.innerHTML = '';
            this.insurancePlans.forEach((plan: string) => {
                const option = document.createElement('option');
                option.value = plan;
                option.textContent = plan;
                select.appendChild(option);
            });
        });
        console.log('✅ Convênios carregados:', this.insurancePlans);
    }

    populateDoctorFilter(): void {
        const select = document.getElementById('doctorFilter') as HTMLSelectElement | null;
        if (!select) return;

        select.innerHTML = '<option value="">Todos os Profissionais</option>';
        this.doctors.forEach((doc: Doctor) => {
            const option = document.createElement('option');
            option.value = String(doc.id);
            option.textContent = doc.name;
            select.appendChild(option);
        });

        // Também popula os selects dos modais
        this.populateModalDoctorSelects();
    }

    populateModalDoctorSelects(): void {
        const selects: string[] = ['quickDoctor', 'editDoctor'];
        selects.forEach((selectId: string) => {
            const select = document.getElementById(selectId) as HTMLSelectElement | null;
            if (!select) return;

            select.innerHTML = '<option value="">Selecione...</option>';
            this.doctors.forEach((doc: Doctor) => {
                const option = document.createElement('option');
                option.value = String(doc.id);
                option.textContent = doc.name;
                select.appendChild(option);
            });
        });
    }

    async loadAppointments(): Promise<void> {
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

    generateTimeSlots(): TimeSlot[] {
        const slots: TimeSlot[] = [];
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

    getAppointmentForSlot(slotTime: string): Appointment | undefined {
        return this.appointments.find((apt: Appointment) => {
            const aptDate = new Date(apt.start_time || apt.appointment_date || '');
            const aptTime = `${String(aptDate.getHours()).padStart(2, '0')}:${String(aptDate.getMinutes()).padStart(2, '0')}`;

            // Filtro por médico se selecionado
            if (this.selectedDoctor && apt.doctor_id != this.selectedDoctor) {
                return false;
            }

            return aptTime === slotTime;
        });
    }

    getStatusInfo(status: string): StatusInfo {
        const statusMap: Record<string, StatusInfo> = {
            // English statuses
            scheduled: { label: 'Agendado', color: 'amber', icon: 'fa-clock' },
            confirmed: { label: 'Confirmado', color: 'green', icon: 'fa-check-circle' },
            completed: { label: 'Atendido', color: 'cyan', icon: 'fa-user-check' },
            cancelled: { label: 'Cancelado', color: 'red', icon: 'fa-times-circle' },
            no_show: { label: 'Faltou', color: 'slate', icon: 'fa-user-slash' },
            waiting: { label: 'Aguardando', color: 'amber', icon: 'fa-hourglass-half' },
            triage: { label: 'Triagem', color: 'blue', icon: 'fa-clipboard-list' },
            consultation: { label: 'Em Consulta', color: 'purple', icon: 'fa-stethoscope' },
            finished: { label: 'Finalizado', color: 'cyan', icon: 'fa-check-double' },
            in_progress: { label: 'Em Andamento', color: 'blue', icon: 'fa-spinner' },
            pending: { label: 'Pendente', color: 'yellow', icon: 'fa-hourglass-start' },
            // Portuguese statuses
            agendado: { label: 'Agendado', color: 'amber', icon: 'fa-clock' },
            confirmado: { label: 'Confirmado', color: 'green', icon: 'fa-check-circle' },
            atendido: { label: 'Atendido', color: 'cyan', icon: 'fa-user-check' },
            cancelado: { label: 'Cancelado', color: 'red', icon: 'fa-times-circle' },
            finalizado: { label: 'Finalizado', color: 'cyan', icon: 'fa-check-double' },
            em_atendimento: { label: 'Em Atendimento', color: 'purple', icon: 'fa-stethoscope' },
            em_andamento: { label: 'Em Andamento', color: 'blue', icon: 'fa-spinner' },
            novo: { label: 'Novo', color: 'blue', icon: 'fa-plus' },
        };

        // Normalize status to lowercase for matching
        const normalizedStatus: string = (status || '').toLowerCase().trim();

        return (
            statusMap[normalizedStatus] ||
            statusMap[status] || {
                label: this.formatStatusLabel(status),
                color: 'gray',
                icon: 'fa-question',
            }
        );
    }

    /**
     * Format status label for unknown statuses
     */
    formatStatusLabel(status: string): string {
        if (!status) return 'Desconhecido';
        return status
            .replace(/[_-]/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
    }

    /**
     * Format appointment type for display
     */
    formatType(type?: string): string {
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

        // Se existe no mapa, retorna o valor formatado
        if (typeMap[type.toLowerCase()]) {
            return typeMap[type.toLowerCase()];
        }

        // Se já está formatado (ex: "Primeira Consulta"), retorna como está
        if (type.includes(' ') || /^[A-Z]/.test(type)) {
            return type;
        }

        // Converte snake_case/kebab-case para Title Case
        return type
            .replace(/[_-]/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (char: string) => char.toUpperCase());
    }

    /**
     * Parse notes field to extract clean text (remove JSON financial data)
     */
    parseNotes(text?: string): ParsedNotes {
        if (!text) return { cleanText: '', financial: null };

        try {
            // Flexible regex to handle spaces in JSON
            const jsonMatch = text.match(/\{\s*"financial"\s*:\s*\{[^{}]*\}\s*\}/);
            if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[0]);
                const cleanText = text.replace(jsonMatch[0], '').trim();
                return { cleanText, financial: jsonData.financial };
            }
        } catch (e) {
            console.warn('Error parsing notes JSON:', e);
        }

        return { cleanText: text, financial: null };
    }

    formatDateDisplay(date: Date): DateInfo {
        const weekdays: string[] = [
            'Domingo',
            'Segunda',
            'Terça',
            'Quarta',
            'Quinta',
            'Sexta',
            'Sábado',
        ];
        const months: string[] = [
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

    formatDateISO(date: Date): string {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    isToday(date: Date): boolean {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    isPast(date: Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    }

    getStats(): AgendaStats {
        const filtered: Appointment[] = this.selectedDoctor
            ? this.appointments.filter((a: Appointment) => a.doctor_id == this.selectedDoctor)
            : this.appointments;

        const total = filtered.length;
        const confirmed = filtered.filter((a: Appointment) => a.status === 'confirmed').length;
        const scheduled = filtered.filter((a: Appointment) => a.status === 'scheduled').length;
        const completed = filtered.filter((a: Appointment) =>
            ['completed', 'finished'].includes(a.status)
        ).length;
        const totalSlots = (this.endHour - this.startHour) * (60 / this.slotDuration);
        const available = totalSlots - total;

        return { total, confirmed, scheduled, completed, available, totalSlots };
    }

    render(): void {
        if (!this.container) return;

        const dateInfo = this.formatDateDisplay(this.currentDate);
        const stats = this.getStats();
        const slots = this.generateTimeSlots();
        const isToday = this.isToday(this.currentDate);
        const isPastDay = this.isPast(this.currentDate);

        // Atualiza o header de data
        const currentDateDisplay = document.getElementById('currentDateDisplay');
        if (currentDateDisplay) {
            currentDateDisplay.innerHTML = `
                <span class="text-cyan-400">${dateInfo.weekday}</span>, 
                <span class="text-white font-bold">${dateInfo.day}</span> de 
                <span class="text-white">${dateInfo.month}</span>
            `;
        }

        // Atualiza o badge "Hoje" e o botão "Hoje"
        const todayBadge = document.getElementById('todayBadge');
        const todayBtn = document.getElementById('todayBtn');
        if (todayBadge) {
            todayBadge.classList.toggle('hidden', !isToday);
        }
        // Esconde o botão "Hoje" quando já está no dia atual (evita duplicação visual)
        if (todayBtn) {
            todayBtn.classList.toggle('hidden', isToday);
        }

        // Atualiza estatísticas
        const statTotal = document.getElementById('statTotal');
        const statConfirmed = document.getElementById('statConfirmed');
        const statAvailable = document.getElementById('statAvailable');
        if (statTotal) statTotal.textContent = String(stats.total);
        if (statConfirmed) statConfirmed.textContent = String(stats.confirmed);
        if (statAvailable) statAvailable.textContent = String(stats.available);

        // Renderiza os slots
        let slotsHTML = '';
        const now = new Date();

        slots.forEach((slot: TimeSlot) => {
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

    getInitials(name: string): string {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    quickSchedule(time: string): void {
        const dateStr = this.formatDateISO(this.currentDate);
        const dateTime = `${dateStr}T${time}`;

        // Abre o modal de agendamento rápido
        const modal = document.getElementById('quickScheduleModal');
        const dateInput = document.getElementById('quickDateTime') as HTMLInputElement | null;
        const nameInput = document.getElementById('quickPatientName') as HTMLInputElement | null;

        if (modal && dateInput) {
            dateInput.value = dateTime;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            if (nameInput) setTimeout(() => nameInput.focus(), 100);
        }
    }

    viewAppointment(id: number): void {
        const apt = this.appointments.find((a: Appointment) => a.id === id);
        if (!apt) return;

        // Parse notes to extract clean text and financial data
        const { cleanText, financial } = this.parseNotes(apt.notes);

        // Preenche o modal de visualização
        const viewPatientInitial = document.getElementById('viewPatientInitial');
        if (viewPatientInitial) {
            viewPatientInitial.textContent = this.getInitials(apt.patient_name);
            // Apply avatar color
            if (typeof getAvatarColorClass === 'function') {
                const colorClass = getAvatarColorClass(apt.patient_name);
                viewPatientInitial.className = viewPatientInitial.className
                    .replace(/avatar-\w+/g, '')
                    .trim();
                viewPatientInitial.classList.add('avatar-profile', 'avatar-profile-lg', colorClass);
            }
        }

        const viewPatientName = document.getElementById('viewPatientName');
        if (viewPatientName) {
            viewPatientName.textContent = apt.patient_name;
        }

        const viewPatientPhone = document.getElementById('viewPatientPhone');
        if (viewPatientPhone) {
            viewPatientPhone.innerHTML = `<i class="fas fa-phone text-cyan-400 mr-2"></i>${apt.patient_phone || 'Não informado'}`;
        }

        const aptDate = new Date(apt.start_time || apt.appointment_date || '');
        const viewDateTime = document.getElementById('viewDateTime');
        if (viewDateTime) {
            viewDateTime.innerHTML = `<i class="fas fa-clock text-cyan-400 mr-2"></i>${aptDate.toLocaleDateString('pt-BR')} às ${aptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        }

        const status = this.getStatusInfo(apt.status);
        const viewStatus = document.getElementById('viewStatus');
        if (viewStatus) {
            viewStatus.innerHTML = `<span class="px-3 py-1 rounded-full text-xs font-semibold bg-${status.color}-500/20 text-${status.color}-300">${status.label}</span>`;
        }

        const viewType = document.getElementById('viewType');
        if (viewType) {
            viewType.textContent = this.formatType(apt.type);
        }

        const viewDoctor = document.getElementById('viewDoctor');
        if (viewDoctor) {
            viewDoctor.textContent = apt.doctor_name || '-';
        }

        // Financial - use parsed data if available, otherwise use apt fields
        const value = financial?.value
            ? `R$ ${parseFloat(financial.value).toFixed(2).replace('.', ',')}`
            : `R$ ${apt.value || '0,00'}`;
        const payment =
            financial?.paymentType || financial?.insuranceName || apt.insurance || 'Particular';
        const viewFinancial = document.getElementById('viewFinancial');
        if (viewFinancial) {
            viewFinancial.textContent = `${value} - ${payment}`;
        }

        // Notes - use clean text without JSON
        const viewNotes = document.getElementById('viewNotes');
        if (viewNotes) {
            viewNotes.textContent = cleanText || '-';
        }

        // Armazena o ID atual
        window.currentViewAppointmentId = id;
        window.currentViewAppointment = apt;

        // Abre o modal
        const modal = document.getElementById('viewModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    editAppointment(id: number): void {
        const apt = this.appointments.find((a: Appointment) => a.id === id);
        if (!apt) return;

        // Parse notes to extract clean text
        const { cleanText, financial } = this.parseNotes(apt.notes);

        // Preenche o formulário de edição
        const editId = document.getElementById('editId') as HTMLInputElement | null;
        if (editId) editId.value = String(apt.id);

        const editName = document.getElementById('editName') as HTMLInputElement | null;
        if (editName) editName.value = apt.patient_name || '';

        const editPhone = document.getElementById('editPhone') as HTMLInputElement | null;
        if (editPhone) editPhone.value = apt.patient_phone || '';

        const aptDate = new Date(apt.start_time || apt.appointment_date || '');
        const editDate = document.getElementById('editDate') as HTMLInputElement | null;
        if (editDate) editDate.value = aptDate.toISOString().slice(0, 16);

        const editDoctor = document.getElementById('editDoctor') as HTMLSelectElement | null;
        if (editDoctor) editDoctor.value = String(apt.doctor_id || '');

        const editType = document.getElementById('editType') as HTMLSelectElement | null;
        if (editType) editType.value = apt.type || '';

        const editStatus = document.getElementById('editStatus') as HTMLSelectElement | null;
        if (editStatus) editStatus.value = apt.status || 'scheduled';

        // Financial fields - use parsed data if available
        const editValueEl = document.getElementById('editValue') as HTMLInputElement | null;
        if (editValueEl) {
            if (financial?.value) {
                editValueEl.value = `R$ ${parseFloat(financial.value).toFixed(2).replace('.', ',')}`;
            } else {
                editValueEl.value = apt.value || '';
            }
        }

        const editInsuranceEl = document.getElementById(
            'editInsurance'
        ) as HTMLSelectElement | null;
        if (editInsuranceEl) {
            editInsuranceEl.value =
                financial?.insuranceName || financial?.paymentType || apt.insurance || '';
        }

        // Notes - use clean text without JSON
        const editNotes = document.getElementById('editNotes') as HTMLTextAreaElement | null;
        if (editNotes) editNotes.value = cleanText || '';

        // Abre o modal
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    openWhatsApp(phone: string): void {
        if (!phone) return;
        const cleanPhone = phone.replace(/\D/g, '');
        const whatsappPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
        window.open(`https://wa.me/${whatsappPhone}`, '_blank');
    }

    async refresh(): Promise<void> {
        await this.loadAppointments();
        this.render();
    }
}

// Inicializa quando o DOM estiver pronto
let agendaSlots: AgendaSlots;

document.addEventListener('DOMContentLoaded', () => {
    agendaSlots = new AgendaSlots();
    window.agendaSlots = agendaSlots;
});

// Funções globais para os modais
function closeViewModal(): void {
    const modal = document.getElementById('viewModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function closeEditModal(): void {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function closeQuickScheduleModal(): void {
    const modal = document.getElementById('quickScheduleModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}
window.closeQuickScheduleModal = closeQuickScheduleModal;

// Salvar edição
async function saveEdit(event: Event): Promise<void> {
    event.preventDefault();

    const id = (document.getElementById('editId') as HTMLInputElement).value;
    const token =
        sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken');

    const data: Record<string, string | null> = {
        patient_name: (document.getElementById('editName') as HTMLInputElement).value,
        patient_phone: (document.getElementById('editPhone') as HTMLInputElement).value,
        appointment_date: new Date(
            (document.getElementById('editDate') as HTMLInputElement).value
        ).toISOString(),
        start_time: new Date(
            (document.getElementById('editDate') as HTMLInputElement).value
        ).toISOString(),
        doctor_id: (document.getElementById('editDoctor') as HTMLSelectElement).value || null,
        type: (document.getElementById('editType') as HTMLSelectElement).value,
        status: (document.getElementById('editStatus') as HTMLSelectElement).value,
        value: (document.getElementById('editValue') as HTMLInputElement).value,
        insurance: (document.getElementById('editInsurance') as HTMLSelectElement).value,
        notes: (document.getElementById('editNotes') as HTMLTextAreaElement).value,
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
function confirmAppointmentFromView(): void {
    if (window.currentViewAppointmentId) {
        updateAppointmentStatus(window.currentViewAppointmentId, 'confirmed');
    }
}

function editAppointmentFromView(): void {
    closeViewModal();
    if (window.currentViewAppointmentId) {
        agendaSlots.editAppointment(window.currentViewAppointmentId);
    }
}

function openWhatsAppFromView(): void {
    if (window.currentViewAppointment?.patient_phone) {
        agendaSlots.openWhatsApp(window.currentViewAppointment.patient_phone);
    }
}

function archiveAppointmentFromView(): void {
    if (window.currentViewAppointmentId) {
        updateAppointmentStatus(window.currentViewAppointmentId, 'completed');
    }
}

async function deleteAppointmentFromView(): Promise<void> {
    if (window.currentViewAppointmentId) {
        const confirmed = await showConfirmModal({
            title: 'Excluir Agendamento',
            message: 'Tem certeza que deseja excluir este agendamento?',
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            icon: 'fa-trash-alt',
            variant: 'danger',
        });
        if (confirmed) {
            deleteAppointment(window.currentViewAppointmentId);
        }
    }
}

async function updateAppointmentStatus(id: number, status: string): Promise<void> {
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

async function deleteAppointment(id: number): Promise<void> {
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
document.getElementById('quickScheduleForm')?.addEventListener('submit', async (event: Event) => {
    event.preventDefault();

    const token =
        sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken');

    const dateTime = new Date((document.getElementById('quickDateTime') as HTMLInputElement).value);
    const endTime = new Date(dateTime);
    endTime.setMinutes(endTime.getMinutes() + 30);

    const data: Record<string, string | number | null> = {
        patient_name: (document.getElementById('quickPatientName') as HTMLInputElement).value,
        patient_phone:
            (document.getElementById('quickPatientPhone') as HTMLInputElement).value || '',
        doctor_id: (document.getElementById('quickDoctor') as HTMLSelectElement)?.value || null,
        type: (document.getElementById('quickType') as HTMLSelectElement)?.value || '',
        insurance:
            (document.getElementById('quickInsurance') as HTMLSelectElement).value || 'Particular',
        value: (document.getElementById('quickValue') as HTMLInputElement)?.value || '',
        notes: (document.getElementById('quickNotes') as HTMLTextAreaElement)?.value || '',
        appointment_date: dateTime.toISOString(),
        start_time: dateTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: 30,
        status: (document.getElementById('quickStatus') as HTMLSelectElement)?.value || 'scheduled',
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
            (document.getElementById('quickScheduleForm') as HTMLFormElement).reset();
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
    window.showToast = function (message: string, type: string = 'info'): void {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 animate-pulse ${
            type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };
}
