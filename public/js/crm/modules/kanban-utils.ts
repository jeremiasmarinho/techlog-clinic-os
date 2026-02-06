/**
 * Kanban Utilities - Helper functions
 */

interface ConsultationDetails {
    specialty: string | null;
    paymentType: string | null;
    period: string | null;
    days: string | null;
}

interface StatusCounts {
    novo: number;
    em_atendimento: number;
    agendado: number;
    finalizado: number;
    [key: string]: number;
}

// Format phone number
export function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
}

// Calculate time ago
export function getTimeAgo(date: string | null): string {
    if (!date) return 'Sem data';

    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
}

// Update status counters
export function updateCounters(leads: Array<{ status: string }>): void {
    const counts: StatusCounts = {
        novo: 0,
        em_atendimento: 0,
        agendado: 0,
        finalizado: 0,
    };

    leads.forEach((lead) => {
        const status = lead.status.toLowerCase().replace(' ', '_');
        if (counts.hasOwnProperty(status)) {
            counts[status]++;
        }
    });

    Object.keys(counts).forEach((status) => {
        const element = document.getElementById(`count-${status}`);
        if (element) {
            element.textContent = String(counts[status]);
        }
    });
}

// Privacy mode toggle
export function togglePrivacyMode(): void {
    const isPrivate = document.body.classList.toggle('privacy-mode');
    const icon = document.querySelector('#privacyToggle i') as HTMLElement | null;

    if (icon) {
        icon.className = isPrivate ? 'fas fa-eye' : 'fas fa-eye-slash';
    }

    document.querySelectorAll('.lead-name, .lead-phone').forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (isPrivate) {
            htmlEl.style.filter = 'blur(5px)';
        } else {
            htmlEl.style.filter = 'none';
        }
    });
}

// Parse consultation details from type string
export function parseConsultationDetails(type: string): ConsultationDetails | null {
    if (!type || !type.startsWith('Consulta - ')) {
        return null;
    }

    const parts = type.split(' - ');
    return {
        specialty: parts[1] || null,
        paymentType: parts[2] || null,
        period: parts[3] || null,
        days: parts[4] || null,
    };
}

// Build consultation details HTML
export function buildConsultationDetailsHTML(details: ConsultationDetails | null): string {
    if (!details) return '';

    return `
        <div class="bg-gray-800/50 rounded-lg p-2 mb-2 space-y-1 text-xs">
            ${details.specialty ? `<div>🩺 <strong>Especialidade:</strong> ${details.specialty}</div>` : ''}
            ${details.paymentType ? `<div>💳 <strong>Pagamento:</strong> ${details.paymentType}</div>` : ''}
            ${details.period ? `<div>🕐 <strong>Período:</strong> ${details.period}</div>` : ''}
            ${details.days ? `<div>📅 <strong>Dias:</strong> ${details.days}</div>` : ''}
        </div>
    `;
}
