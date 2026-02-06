/**
 * Dashboard Reports Module - Report generation
 */

interface HistoryEntry {
    date: string;
    count: number;
}

interface AttendanceEntry {
    attendance_status: string;
    count: number;
}

interface StatusEntry {
    status: string;
    count: number;
}

interface TypeEntry {
    type: string;
    count: number;
}

// Generate weekly report
export function generateWeeklyReport(
    history: HistoryEntry[],
    byAttendanceStatus?: AttendanceEntry[]
): string {
    const thisWeek = history.slice(-7).reduce((sum, day) => sum + day.count, 0);
    const lastWeek = history.slice(-14, -7).reduce((sum, day) => sum + day.count, 0);
    const growth = lastWeek > 0 ? (((thisWeek - lastWeek) / lastWeek) * 100).toFixed(1) : '0';

    const attended =
        byAttendanceStatus?.find((a) => a.attendance_status === 'compareceu')?.count || 0;
    const noShow =
        byAttendanceStatus?.find((a) => a.attendance_status === 'nao_compareceu')?.count || 0;

    return `
📊 *Relatório Semanal - Medical CRM*
━━━━━━━━━━━━━━━━━━━━━━━━

📈 *Novos Leads*
• Esta semana: ${thisWeek}
• Semana passada: ${lastWeek}
• Crescimento: ${parseFloat(growth) > 0 ? '+' : ''}${growth}%

✅ *Atendimentos*
• Compareceram: ${attended}
• Não compareceram: ${noShow}
${attended + noShow > 0 ? `• Taxa de presença: ${((attended / (attended + noShow)) * 100).toFixed(1)}%` : ''}

📅 *Período*
${new Date(history[history.length - 7].date).toLocaleDateString('pt-BR')} a ${new Date(history[history.length - 1].date).toLocaleDateString('pt-BR')}
    `.trim();
}

// Generate status report
export function generateStatusReport(byStatus: StatusEntry[], total: number): string {
    const statusMap: Record<string, string> = {
        novo: '🟢 Novos',
        em_atendimento: '🟡 Em Atendimento',
        agendado: '🔵 Agendados',
        finalizado: '⚪ Finalizados',
    };

    let report = '📊 *Relatório por Status*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    byStatus.forEach((status) => {
        const percentage = ((status.count / total) * 100).toFixed(1);
        const statusName = statusMap[status.status] || status.status;
        report += `${statusName}\n• ${status.count} leads (${percentage}%)\n\n`;
    });

    report += `*Total: ${total} leads*`;

    return report.trim();
}

// Generate types report
export function generateTypesReport(
    byType: TypeEntry[],
    byAttendanceStatus?: AttendanceEntry[]
): string {
    let report = '📋 *Relatório por Tipo*\n━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    byType.forEach((type) => {
        let typeName = type.type || 'Geral';

        // Handle detailed consultation types from chat
        if (type.type && type.type.startsWith('Consulta - ')) {
            const parts = type.type.split(' - ');
            typeName = `📋 ${parts[1] || 'Consulta'}`;
            if (parts[2]) typeName += ` (${parts[2]})`;
        }

        report += `${typeName}\n• ${type.count} agendamentos\n\n`;
    });

    // Add attendance info
    const attended =
        byAttendanceStatus?.find((a) => a.attendance_status === 'compareceu')?.count || 0;
    const noShow =
        byAttendanceStatus?.find((a) => a.attendance_status === 'nao_compareceu')?.count || 0;
    const canceled =
        byAttendanceStatus?.find((a) => a.attendance_status === 'cancelado')?.count || 0;
    const rescheduled =
        byAttendanceStatus?.find((a) => a.attendance_status === 'remarcado')?.count || 0;

    if (attended + noShow + canceled + rescheduled > 0) {
        report += '\n📊 *Status de Comparecimento*\n';
        if (attended > 0) report += `• ✅ Compareceram: ${attended}\n`;
        if (noShow > 0) report += `• ❌ Não compareceram: ${noShow}\n`;
        if (canceled > 0) report += `• 🚫 Cancelados: ${canceled}\n`;
        if (rescheduled > 0) report += `• 📅 Remarcados: ${rescheduled}\n`;
    }

    return report.trim();
}

// Copy report text to clipboard
export function copyReportText(elementId: string): void {
    const element = document.getElementById(elementId);
    if (!element) return;

    const text = element.textContent || '';

    // Modern clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                alert('✅ Relatório copiado para área de transferência!');
            })
            .catch((err) => {
                console.error('Erro ao copiar:', err);
                fallbackCopyText(text);
            });
    } else {
        fallbackCopyText(text);
    }
}

// Fallback copy method for older browsers
function fallbackCopyText(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
        alert('✅ Relatório copiado para área de transferência!');
    } catch (err) {
        console.error('Erro ao copiar:', err);
        alert('❌ Erro ao copiar. Por favor, copie manualmente.');
    }

    document.body.removeChild(textarea);
}
