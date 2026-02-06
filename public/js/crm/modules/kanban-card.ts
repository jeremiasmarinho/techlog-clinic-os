/**
 * Kanban Card Module - Card creation and rendering
 */

import {
    formatPhone,
    getTimeAgo,
    parseConsultationDetails,
    buildConsultationDetailsHTML,
} from './kanban-utils.ts';
import { formatDateTimeShort } from '../../utils/formatters.ts';

interface KanbanLead {
    id: number;
    name: string;
    phone: string;
    status: string;
    type?: string;
    attendance_status?: string;
    appointment_date?: string;
    doctor?: string;
    notes?: string;
    created_at: string;
}

interface AttendanceStatusInfo {
    icon: string;
    text: string;
    color: string;
}

export function createLeadCard(
    lead: KanbanLead,
    dragStart: (e: DragEvent) => void,
    dragEnd: (e: DragEvent) => void
): HTMLDivElement {
    const card = document.createElement('div');
    card.className =
        'lead-card glass-card rounded-xl p-4 cursor-move hover:shadow-2xl transition-all border border-white/10 backdrop-blur-xl';
    card.draggable = true;
    card.dataset.id = String(lead.id);
    card.dataset.status = lead.status;

    // Type badge (First line)
    let typeBadge = '';
    let consultaDetails = '';

    if (lead.type && lead.type.startsWith('Consulta - ')) {
        const details = parseConsultationDetails(lead.type);
        consultaDetails = buildConsultationDetailsHTML(details);
        typeBadge = `<span class="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-semibold">📋 Consulta</span>`;
    } else if (lead.type === 'primeira_consulta') {
        typeBadge = `<span class="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-semibold">⭐ Primeira Consulta</span>`;
    } else if (lead.type === 'retorno') {
        typeBadge = `<span class="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-semibold">🔄 Retorno</span>`;
    } else if (lead.type === 'recorrente') {
        typeBadge = `<span class="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-semibold">🔁 Sessão/Recorrente</span>`;
    } else if (lead.type === 'exame') {
        typeBadge = `<span class="inline-block px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs font-semibold">🔬 Exame</span>`;
    } else if (lead.type === 'Atendimento Humano') {
        typeBadge = `<span class="inline-block px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-semibold">👤 Atendimento Humano</span>`;
    } else {
        typeBadge = `<span class="inline-block px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs font-semibold">? ${lead.type || 'Geral'}</span>`;
    }

    // Attendance status badge - STRICT RULES
    let attendanceBadge = '';
    if (lead.attendance_status) {
        const currentStatus = (lead.status || '').toLowerCase().trim();
        const attendanceStatus = lead.attendance_status.toLowerCase().trim();

        const statusMap: Record<string, AttendanceStatusInfo> = {
            compareceu: { icon: '✅', text: 'Compareceu', color: 'green' },
            nao_compareceu: { icon: '❌', text: 'Não veio', color: 'red' },
            cancelado: { icon: '🚫', text: 'Cancelado', color: 'gray' },
            remarcado: { icon: '📅', text: 'Remarcado', color: 'yellow' },
        };

        // STRICT RULE 1: Outcome badges (Compareceu, Não veio, Cancelado) ONLY in Finalizados
        const outcomeStatuses = ['compareceu', 'nao_compareceu', 'cancelado'];
        if (outcomeStatuses.includes(attendanceStatus)) {
            if (currentStatus === 'finalizado') {
                const status = statusMap[attendanceStatus];
                attendanceBadge = `<span class="inline-block px-2 py-1 bg-${status.color}-500/20 text-${status.color}-300 rounded-full text-xs font-semibold ml-2">${status.icon} ${status.text}</span>`;
            }
            // Else: DON'T show outcome badges outside Finalizados
        }
        // STRICT RULE 2: Remarcado badge ONLY in Agendado/Em Atendimento
        else if (attendanceStatus === 'remarcado') {
            if (currentStatus === 'agendado' || currentStatus === 'em_atendimento') {
                const status = statusMap['remarcado'];
                attendanceBadge = `<span class="inline-block px-2 py-1 bg-${status.color}-500/20 text-${status.color}-300 rounded-full text-xs font-semibold ml-2">${status.icon} ${status.text}</span>`;
            }
            // Else: DON'T show remarcado badge in Novos/Finalizados
        }
    }

    // Current status for conditional rendering
    const currentStatus = (lead.status || '').toLowerCase().trim();

    // Time ago badge
    const timeAgo = getTimeAgo(lead.created_at);
    const timeBadge = `<span class="text-xs text-gray-400"><i class="far fa-clock mr-1"></i>${timeAgo}</span>`;

    // Appointment info (if exists)
    let appointmentInfo = '';
    if (lead.appointment_date) {
        const formatted = formatDateTimeShort(lead.appointment_date);
        appointmentInfo = `
            <div class="appointment-block bg-blue-500/10 rounded-lg p-2 mb-2 flex items-center text-sm">
                <i class="fas fa-calendar-check text-blue-400 mr-2"></i>
                <span class="text-blue-200 font-medium">${formatted}</span>
                ${lead.doctor ? `<span class="text-blue-300 ml-2">👨‍⚕️ ${lead.doctor}</span>` : ''}
            </div>
        `;
    }

    card.innerHTML = `
        <div class="flex items-start justify-between mb-2">
            <div class="flex-1">${typeBadge}${attendanceBadge}</div>
            ${timeBadge}
        </div>

        ${consultaDetails}
        ${appointmentInfo}

        <h3 class="lead-name text-white font-bold text-lg mb-2 truncate">${lead.name}</h3>
        <p class="lead-phone text-gray-300 text-sm mb-3 flex items-center">
            <i class="fas fa-phone mr-2 text-cyan-400"></i>${formatPhone(lead.phone)}
        </p>

        <!-- Post-Attendance Actions (ONLY for Finalizados) -->
        ${
            currentStatus === 'finalizado'
                ? `
        <div class="flex space-x-2 mb-3">
            <button onclick="setupReturn(${lead.id})" class="flex-1 glass-card p-2.5 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-white rounded-lg transition-all border border-cyan-500/30 hover:border-cyan-500 group" title="Agendar Retorno">
                <i class="fas fa-calendar-plus mr-1 group-hover:animate-pulse"></i>Retorno
            </button>
            <button onclick="archiveLead(${lead.id})" class="flex-1 glass-card p-2.5 bg-slate-500/20 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-500/30 hover:border-slate-600 group" title="Arquivar Lead">
                <i class="fas fa-archive mr-1 group-hover:animate-pulse"></i>Arquivar
            </button>
        </div>
        `
                : ''
        }

        <div class="flex space-x-2">
            <button onclick="openEditModal(${lead.id}, '${lead.name}', '${lead.appointment_date || ''}', '${lead.doctor || ''}', \`${(lead.notes || '').replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`, '${lead.type || ''}')" class="text-gray-300 hover:text-blue-400 transition" title="Editar">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="openWhatsAppMenuKanban(${lead.id}, event)" class="text-gray-300 hover:text-green-400 transition" title="Abrir WhatsApp">
                <i class="fab fa-whatsapp"></i>
            </button>
            <button onclick="deleteLead(${lead.id})" class="text-gray-300 hover:text-red-400 transition ml-auto" title="Excluir">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    // Store appointment date for sorting
    if (lead.appointment_date) {
        card.dataset.appointmentDate = lead.appointment_date;
    }

    // Event listeners for drag (desktop only)
    card.addEventListener('dragstart', dragStart);
    card.addEventListener('dragend', dragEnd);

    return card;
}
