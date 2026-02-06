/**
 * Lead Card Web Component
 * Componente reutilizável para cards de leads no kanban
 */

interface LeadFinancial {
    paymentType?: string;
    insuranceName?: string;
    value?: string | number;
    paymentValue?: string;
}

interface LeadCardData {
    id: number;
    name: string;
    phone: string;
    status: string;
    type?: string;
    attendance_status?: string;
    created_at: string;
    appointment_date?: string;
    doctor?: string;
    notes?: string;
    financial?: LeadFinancial;
}

interface BadgeConfig {
    icon: string;
    text: string;
    color: string;
}

declare global {
    interface Window {
        openWhatsAppMenuKanban: (id: number, e: MouseEvent) => void;
        handleDragStart: (e: DragEvent) => void;
        handleDragEnd: (e: DragEvent) => void;
    }
}

class LeadCard extends HTMLElement {
    private leadId: number | undefined;
    private status: string | undefined;

    constructor() {
        super();
    }

    connectedCallback(): void {
        // Parse attributes
        const leadData = JSON.parse(this.getAttribute('data-lead') || '{}') as LeadCardData;
        this.leadId = leadData.id;
        this.status = leadData.status;

        this.render(leadData);
        this.attachEvents();
    }

    render(lead: LeadCardData): void {
        // Type badge
        const typeBadge = this.getTypeBadge(lead.type);

        // Attendance status badge (for Finalizado)
        const attendanceBadge = this.getAttendanceBadge(lead.attendance_status);

        // Time ago badge
        const timeAgo = this.getTimeAgo(lead.created_at);
        const timeBadge = `<span class="text-xs text-gray-400"><i class="far fa-clock mr-1"></i>${timeAgo}</span>`;

        // Consultation details
        const consultaDetails = this.getConsultationDetails(lead.type);

        // Appointment info
        const appointmentInfo = this.getAppointmentInfo(lead.appointment_date, lead.doctor);

        // Financial badges
        const financialBadges = this.getFinancialBadges(lead.financial);

        this.className =
            'lead-card glass-card rounded-xl p-4 cursor-move hover:shadow-2xl transition-all border border-white/10 backdrop-blur-xl';
        this.draggable = true;
        this.dataset.id = String(lead.id);
        this.dataset.status = lead.status;

        if (lead.appointment_date) {
            this.dataset.appointmentDate = lead.appointment_date;
        }

        this.innerHTML = `
            <div class="flex items-start justify-between mb-2">
                <div class="flex-1">${typeBadge}${attendanceBadge}</div>
                ${timeBadge}
            </div>

            ${consultaDetails}
            ${appointmentInfo}
            ${financialBadges}

            <h3 class="lead-name text-white font-bold text-lg mb-2 truncate">${lead.name}</h3>
            <p class="lead-phone text-gray-300 text-sm mb-3 flex items-center">
                <i class="fas fa-phone mr-2 text-cyan-400"></i>${this.formatPhone(lead.phone)}
            </p>

            <div class="flex space-x-2">
                <button class="lead-edit-btn text-gray-300 hover:text-blue-400 transition" title="Editar">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="lead-whatsapp-btn text-gray-300 hover:text-green-400 transition" title="WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button class="lead-delete-btn text-gray-300 hover:text-red-400 transition ml-auto" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }

    attachEvents(): void {
        // Edit button
        const editBtn = this.querySelector('.lead-edit-btn') as HTMLElement | null;
        if (editBtn && typeof window.openEditModal === 'function') {
            editBtn.addEventListener('click', () => {
                const leadData = JSON.parse(this.getAttribute('data-lead') || '{}') as LeadCardData;
                window.openEditModal!(
                    leadData.id,
                    leadData.name,
                    leadData.appointment_date || '',
                    leadData.doctor || '',
                    leadData.notes || '',
                    leadData.type || ''
                );
            });
        }

        // WhatsApp button
        const whatsappBtn = this.querySelector('.lead-whatsapp-btn') as HTMLElement | null;
        if (whatsappBtn && typeof window.openWhatsAppMenuKanban === 'function') {
            whatsappBtn.addEventListener('click', (e: MouseEvent) => {
                const leadData = JSON.parse(this.getAttribute('data-lead') || '{}') as LeadCardData;
                window.openWhatsAppMenuKanban(leadData.id, e);
            });
        }

        // Delete button
        const deleteBtn = this.querySelector('.lead-delete-btn') as HTMLElement | null;
        if (deleteBtn && typeof window.deleteLead === 'function') {
            deleteBtn.addEventListener('click', () => {
                const leadData = JSON.parse(this.getAttribute('data-lead') || '{}') as LeadCardData;
                window.deleteLead!(leadData.id);
            });
        }

        // Drag events
        this.addEventListener('dragstart', (e: DragEvent) => {
            if (typeof window.handleDragStart === 'function') {
                window.handleDragStart(e);
            }
        });

        this.addEventListener('dragend', (e: DragEvent) => {
            if (typeof window.handleDragEnd === 'function') {
                window.handleDragEnd(e);
            }
        });
    }

    getTypeBadge(type: string | undefined): string {
        if (!type)
            return `<span class="inline-block px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs font-semibold">📄 Geral</span>`;

        const badges: Record<string, BadgeConfig> = {
            primeira_consulta: { icon: '⭐', text: 'Primeira Consulta', color: 'yellow' },
            retorno: { icon: '🔄', text: 'Retorno', color: 'blue' },
            recorrente: { icon: '🔁', text: 'Sessão/Recorrente', color: 'purple' },
            exame: { icon: '🔬', text: 'Exame', color: 'pink' },
            'Atendimento Humano': { icon: '👤', text: 'Atendimento Humano', color: 'green' },
        };

        if (type.startsWith('Consulta - ')) {
            return `<span class="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-semibold">📋 Consulta</span>`;
        }

        const badge = badges[type];
        if (badge) {
            return `<span class="inline-block px-3 py-1 bg-${badge.color}-500/20 text-${badge.color}-300 rounded-full text-xs font-semibold">${badge.icon} ${badge.text}</span>`;
        }

        return `<span class="inline-block px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs font-semibold">? ${type}</span>`;
    }

    getAttendanceBadge(attendanceStatus: string | undefined): string {
        if (!attendanceStatus) return '';

        const statusMap: Record<string, BadgeConfig> = {
            compareceu: { icon: '✅', text: 'Compareceu', color: 'green' },
            nao_compareceu: { icon: '❌', text: 'Não veio', color: 'red' },
            cancelado: { icon: '🚫', text: 'Cancelado', color: 'yellow' },
            remarcado: { icon: '📅', text: 'Remarcado', color: 'blue' },
        };

        const status = statusMap[attendanceStatus] || {
            icon: '❓',
            text: attendanceStatus,
            color: 'gray',
        };
        return `<span class="inline-block px-2 py-1 bg-${status.color}-500/20 text-${status.color}-300 rounded-full text-xs font-semibold ml-2">${status.icon} ${status.text}</span>`;
    }

    getConsultationDetails(type: string | undefined): string {
        if (!type || !type.startsWith('Consulta - ')) return '';

        const detailsPart = type.replace('Consulta - ', '');
        const parts = detailsPart.split(' - ');

        return `
            <div class="bg-cyan-500/10 rounded-lg p-2 mb-2">
                <div class="text-xs text-cyan-200 font-semibold mb-1">Detalhes da Consulta:</div>
                ${parts.map((part) => `<div class="text-xs text-cyan-300">• ${part}</div>`).join('')}
            </div>
        `;
    }

    getAppointmentInfo(appointmentDate: string | undefined, doctor: string | undefined): string {
        if (!appointmentDate) return '';

        const date = new Date(appointmentDate);
        const formatted = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        return `
            <div class="bg-blue-500/10 rounded-lg p-2 mb-2 text-sm">
                📅 ${formatted}
                ${doctor ? `<span class="ml-2">👨‍⚕️ ${doctor}</span>` : ''}
            </div>
        `;
    }

    getFinancialBadges(financial: LeadFinancial | undefined): string {
        if (!financial) return '';

        let badges = '';

        // Payment type badge
        if (financial.paymentType) {
            const typeMap: Record<string, BadgeConfig> = {
                particular: { icon: '💵', text: 'Particular', color: 'emerald' },
                plano: { icon: '🏥', text: financial.insuranceName || 'Plano', color: 'blue' },
                retorno: { icon: '🔄', text: 'Retorno', color: 'purple' },
            };

            const type = typeMap[financial.paymentType];
            if (type) {
                badges += `<span class="inline-block px-2 py-1 bg-${type.color}-500/20 text-${type.color}-300 rounded-full text-xs font-semibold mr-1">${type.icon} ${type.text}</span>`;
            }
        }

        // Value badge
        if (financial.value) {
            badges += `<span class="inline-block px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-semibold">💰 ${financial.value}</span>`;
        }

        if (badges) {
            return `<div class="mb-2 flex flex-wrap gap-1">${badges}</div>`;
        }

        return '';
    }

    getTimeAgo(createdAt: string): string {
        const now = new Date();
        const created = new Date(createdAt);
        const diff = now.getTime() - created.getTime();

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `🕒 ${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `🕒 ${hours}h ${minutes % 60}m`;
        return `🕒 ${minutes}m`;
    }

    formatPhone(phone: string): string {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
        }
        return phone;
    }
}

// Register the custom element
customElements.define('lead-card', LeadCard);

export { LeadCard };
