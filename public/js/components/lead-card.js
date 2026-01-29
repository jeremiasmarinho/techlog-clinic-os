/**
 * Lead Card Web Component
 * Componente reutilizável para cards de leads no kanban
 */

class LeadCard extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        // Parse attributes
        const leadData = JSON.parse(this.getAttribute('data-lead') || '{}');
        this.leadId = leadData.id;
        this.status = leadData.status;
        
        this.render(leadData);
        this.attachEvents();
    }

    render(lead) {
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

        this.className = 'lead-card glass-card rounded-xl p-4 cursor-move hover:shadow-2xl transition-all border border-white/10 backdrop-blur-xl';
        this.draggable = true;
        this.dataset.id = lead.id;
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

    attachEvents() {
        // Edit button
        const editBtn = this.querySelector('.lead-edit-btn');
        if (editBtn && typeof window.openEditModal === 'function') {
            editBtn.addEventListener('click', () => {
                const leadData = JSON.parse(this.getAttribute('data-lead'));
                window.openEditModal(
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
        const whatsappBtn = this.querySelector('.lead-whatsapp-btn');
        if (whatsappBtn && typeof window.openWhatsAppMenuKanban === 'function') {
            whatsappBtn.addEventListener('click', (e) => {
                const leadData = JSON.parse(this.getAttribute('data-lead'));
                window.openWhatsAppMenuKanban(leadData.id, e);
            });
        }

        // Delete button
        const deleteBtn = this.querySelector('.lead-delete-btn');
        if (deleteBtn && typeof window.deleteLead === 'function') {
            deleteBtn.addEventListener('click', () => {
                const leadData = JSON.parse(this.getAttribute('data-lead'));
                window.deleteLead(leadData.id);
            });
        }

        // Drag events
        this.addEventListener('dragstart', (e) => {
            if (typeof window.handleDragStart === 'function') {
                window.handleDragStart(e);
            }
        });

        this.addEventListener('dragend', (e) => {
            if (typeof window.handleDragEnd === 'function') {
                window.handleDragEnd(e);
            }
        });
    }

    getTypeBadge(type) {
        if (!type) return `<span class="inline-block px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs font-semibold">📄 Geral</span>`;

        const badges = {
            'primeira_consulta': { icon: '⭐', text: 'Primeira Consulta', color: 'yellow' },
            'retorno': { icon: '🔄', text: 'Retorno', color: 'blue' },
            'recorrente': { icon: '🔁', text: 'Sessão/Recorrente', color: 'purple' },
            'exame': { icon: '🔬', text: 'Exame', color: 'pink' },
            'Atendimento Humano': { icon: '👤', text: 'Atendimento Humano', color: 'green' }
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

    getAttendanceBadge(attendanceStatus) {
        if (!attendanceStatus) return '';

        const statusMap = {
            'compareceu': { icon: '✅', text: 'Compareceu', color: 'green' },
            'nao_compareceu': { icon: '❌', text: 'Não veio', color: 'red' },
            'cancelado': { icon: '🚫', text: 'Cancelado', color: 'yellow' },
            'remarcado': { icon: '📅', text: 'Remarcado', color: 'blue' }
        };

        const status = statusMap[attendanceStatus] || { icon: '❓', text: attendanceStatus, color: 'gray' };
        return `<span class="inline-block px-2 py-1 bg-${status.color}-500/20 text-${status.color}-300 rounded-full text-xs font-semibold ml-2">${status.icon} ${status.text}</span>`;
    }

    getConsultationDetails(type) {
        if (!type || !type.startsWith('Consulta - ')) return '';

        const detailsPart = type.replace('Consulta - ', '');
        const parts = detailsPart.split(' - ');
        
        return `
            <div class="bg-cyan-500/10 rounded-lg p-2 mb-2">
                <div class="text-xs text-cyan-200 font-semibold mb-1">Detalhes da Consulta:</div>
                ${parts.map(part => `<div class="text-xs text-cyan-300">• ${part}</div>`).join('')}
            </div>
        `;
    }

    getAppointmentInfo(appointmentDate, doctor) {
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

    getFinancialBadges(financial) {
        if (!financial) return '';

        let badges = '';

        // Payment type badge
        if (financial.paymentType) {
            const typeMap = {
                'particular': { icon: '💵', text: 'Particular', color: 'emerald' },
                'plano': { icon: '🏥', text: financial.insuranceName || 'Plano', color: 'blue' },
                'retorno': { icon: '🔄', text: 'Retorno', color: 'purple' }
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

    getTimeAgo(createdAt) {
        const now = new Date();
        const created = new Date(createdAt);
        const diff = now - created;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `🕒 ${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `🕒 ${hours}h ${minutes % 60}m`;
        return `🕒 ${minutes}m`;
    }

    formatPhone(phone) {
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
