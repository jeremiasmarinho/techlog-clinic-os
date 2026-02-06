/**
 * Patient Table Row Component
 * Componente reutilizável para linhas da tabela de pacientes
 */

interface PatientRowData {
    id: number;
    name: string;
    phone: string;
    status: string;
    type?: string;
    created_at: string;
}

interface StatusInfo {
    text: string;
    color: string;
}

declare global {
    interface Window {
        viewPatientDetails: (id: number) => void;
        openWhatsApp: (phone: string) => void;
    }
}

class PatientRow extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback(): void {
        const patientData = JSON.parse(this.getAttribute('data-patient') || '{}') as PatientRowData;
        this.render(patientData);
        this.attachEvents();
    }

    render(patient: PatientRowData): void {
        this.className = 'patient-row hover:bg-slate-700/30 transition-colors';

        const statusBadge = this.getStatusBadge(patient.status);
        const typeBadge = this.getTypeBadge(patient.type);

        this.innerHTML = `
            <tr class="border-b border-slate-700/50">
                <td class="px-4 py-3">
                    <div class="text-white font-semibold">${patient.name}</div>
                </td>
                <td class="px-4 py-3">
                    <span class="text-gray-300">${this.formatPhone(patient.phone)}</span>
                </td>
                <td class="px-4 py-3">
                    ${statusBadge}
                </td>
                <td class="px-4 py-3">
                    ${typeBadge}
                </td>
                <td class="px-4 py-3">
                    <span class="text-gray-400 text-sm">${this.formatDate(patient.created_at)}</span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex space-x-2">
                        <button class="patient-view-btn text-cyan-400 hover:text-cyan-300 transition" title="Ver Detalhes">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="patient-whatsapp-btn text-green-400 hover:text-green-300 transition" title="WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    attachEvents(): void {
        const viewBtn = this.querySelector('.patient-view-btn') as HTMLElement | null;
        if (viewBtn && typeof window.viewPatientDetails === 'function') {
            viewBtn.addEventListener('click', () => {
                const patientData = JSON.parse(
                    this.getAttribute('data-patient') || '{}'
                ) as PatientRowData;
                window.viewPatientDetails(patientData.id);
            });
        }

        const whatsappBtn = this.querySelector('.patient-whatsapp-btn') as HTMLElement | null;
        if (whatsappBtn && typeof window.openWhatsApp === 'function') {
            whatsappBtn.addEventListener('click', () => {
                const patientData = JSON.parse(
                    this.getAttribute('data-patient') || '{}'
                ) as PatientRowData;
                window.openWhatsApp(patientData.phone);
            });
        }
    }

    getStatusBadge(status: string): string {
        const statusMap: Record<string, StatusInfo> = {
            novo: { text: 'Novo', color: 'yellow' },
            em_atendimento: { text: 'Em Atendimento', color: 'blue' },
            agendado: { text: 'Agendado', color: 'purple' },
            finalizado: { text: 'Finalizado', color: 'green' },
        };

        const statusInfo = statusMap[status] || { text: status, color: 'gray' };
        return `<span class="px-2 py-1 bg-${statusInfo.color}-500/20 text-${statusInfo.color}-300 rounded-full text-xs font-semibold">${statusInfo.text}</span>`;
    }

    getTypeBadge(type: string | undefined): string {
        if (!type) return '<span class="text-gray-400 text-sm">-</span>';
        return `<span class="text-gray-300 text-sm">${type}</span>`;
    }

    formatPhone(phone: string): string {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
        }
        return phone;
    }

    formatDate(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
}

// Register the custom element
customElements.define('patient-row', PatientRow);

export { PatientRow };
