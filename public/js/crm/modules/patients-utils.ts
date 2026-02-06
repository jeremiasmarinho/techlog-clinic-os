/**
 * Patients Utils Module - Helper functions
 */

interface PatientStats {
    total: number;
    new: number;
    inProgress: number;
    scheduled: number;
}

// Format phone number
export function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
}

// Get type badge colors
export function getTypeBadgeColor(type: string | undefined): string {
    const typeColors: Record<string, string> = {
        'Primeira Consulta': 'bg-yellow-100 text-yellow-800',
        primeira_consulta: 'bg-yellow-100 text-yellow-800',
        Retorno: 'bg-indigo-100 text-indigo-800',
        retorno: 'bg-indigo-100 text-indigo-800',
        Exame: 'bg-purple-100 text-purple-800',
        exame: 'bg-purple-100 text-purple-800',
        Consulta: 'bg-blue-100 text-blue-800',
        recorrente: 'bg-pink-100 text-pink-800',
    };

    // Check if type starts with "Consulta -" (detailed from chat)
    if (type && type.startsWith('Consulta - ')) {
        return 'bg-cyan-100 text-cyan-800';
    }

    return (type && typeColors[type]) || 'bg-gray-100 text-gray-800';
}

// Get status badge colors
export function getStatusBadgeColor(status: string): string {
    const statusColors: Record<string, string> = {
        novo: 'bg-green-100 text-green-800',
        em_atendimento: 'bg-yellow-100 text-yellow-800',
        agendado: 'bg-blue-100 text-blue-800',
        finalizado: 'bg-gray-100 text-gray-800',
        archived: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
}

// Format status text
export function formatStatusText(status: string): string {
    const statusMap: Record<string, string> = {
        novo: 'Novo',
        em_atendimento: 'Em Atendimento',
        agendado: 'Agendado',
        finalizado: 'Finalizado',
        archived: 'Arquivado',
    };
    return statusMap[status] || status;
}

// Update statistics
export function updateStats(list: Array<{ status: string }>): void {
    const stats: PatientStats = {
        total: list.length,
        new: list.filter((p) => p.status === 'novo').length,
        inProgress: list.filter((p) => p.status === 'em_atendimento').length,
        scheduled: list.filter((p) => p.status === 'agendado').length,
    };

    (document.getElementById('totalPatients') as HTMLElement).textContent = String(stats.total);
    (document.getElementById('newPatients') as HTMLElement).textContent = String(stats.new);
    (document.getElementById('inProgressPatients') as HTMLElement).textContent = String(
        stats.inProgress
    );
    (document.getElementById('scheduledPatients') as HTMLElement).textContent = String(
        stats.scheduled
    );
}

// Show notification
export function showNotification(message: string, type: string = 'success'): void {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium animate-fade-in ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('animate-fade-out');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
