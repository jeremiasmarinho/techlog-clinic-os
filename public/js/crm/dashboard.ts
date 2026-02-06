// ============================================
// Dashboard - Analytics & Charts
// ============================================

declare const Chart: {
    new (ctx: CanvasRenderingContext2D, config: Record<string, unknown>): ChartInstance;
};

interface ChartInstance {
    destroy(): void;
}

declare function showNotification(message: string, type?: string): void;

interface StatusItem {
    status: string;
    count: number;
}

interface TypeItem {
    type: string;
    count: number;
}

interface HistoryItem {
    date: string;
    count: number;
}

interface AttendanceItem {
    attendance_status: string;
    count: number;
}

interface DashboardData {
    total: number;
    byStatus: StatusItem[];
    byType: TypeItem[];
    history: HistoryItem[];
    byAttendanceStatus?: AttendanceItem[];
}

interface MetricsResponse {
    taxaConversao: {
        value: number;
        convertidos: number;
        total: number;
    };
    noShows: {
        value: number;
        periodo: string;
    };
    consultasSemana: {
        value: number;
        periodo: string;
    };
}

// Chart instances (prevent memory leaks)
let statusChartInstance: ChartInstance | null = null;
let typeChartInstance: ChartInstance | null = null;
let historyChartInstance: ChartInstance | null = null;

// Load summary metrics on page load
async function loadSummaryMetrics(): Promise<void> {
    try {
        const token: string | null =
            sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('accessToken');
        const response: Response = await fetch('/api/metrics/resumo', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error('Erro ao carregar métricas');

        const data: MetricsResponse = await response.json();

        // Update cards (with null checks)
        const taxaConversao: HTMLElement | null = document.getElementById('taxaConversao');
        if (taxaConversao) taxaConversao.textContent = `${data.taxaConversao.value}%`;

        const taxaConversaoDetail: HTMLElement | null =
            document.getElementById('taxaConversaoDetail');
        if (taxaConversaoDetail)
            taxaConversaoDetail.textContent = `${data.taxaConversao.convertidos} de ${data.taxaConversao.total} leads`;

        const noShows: HTMLElement | null = document.getElementById('noShows');
        if (noShows) noShows.textContent = String(data.noShows.value);

        const noShowsDetail: HTMLElement | null = document.getElementById('noShowsDetail');
        if (noShowsDetail) noShowsDetail.textContent = data.noShows.periodo;

        const consultasSemana: HTMLElement | null = document.getElementById('consultasSemana');
        if (consultasSemana) consultasSemana.textContent = String(data.consultasSemana.value);

        const consultasSemanaDetail: HTMLElement | null =
            document.getElementById('consultasSemanaDetail');
        if (consultasSemanaDetail) consultasSemanaDetail.textContent = data.consultasSemana.periodo;
    } catch (error: unknown) {
        // Metrics loading failed silently
    }
}

// New function to load dashboard data for the standalone page
async function loadDashboardData(): Promise<void> {
    try {
        const token: string | null =
            sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('accessToken');
        const response: Response = await fetch('/api/leads/dashboard', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar métricas');
        }

        const data: DashboardData = await response.json();

        // Update total
        const totalLeadsElement: HTMLElement | null = document.getElementById('totalLeads');
        if (totalLeadsElement) {
            totalLeadsElement.textContent = String(data.total);
        }

        // Calculate potential revenue
        const consultas: number =
            data.byType.find((t: TypeItem) => t.type === 'Consulta')?.count || 0;
        const exames: number = data.byType.find((t: TypeItem) => t.type === 'Exame')?.count || 0;
        const revenue: number = consultas * 300 + exames * 150;

        const revenueElement: HTMLElement | null = document.getElementById('revenueEstimate');
        if (revenueElement) {
            revenueElement.textContent = `R$ ${revenue.toLocaleString('pt-BR')}`;
        }

        // Update attendance metrics
        const attended: number =
            data.byAttendanceStatus?.find(
                (a: AttendanceItem) => a.attendance_status === 'compareceu'
            )?.count || 0;
        const noShow: number =
            data.byAttendanceStatus?.find(
                (a: AttendanceItem) => a.attendance_status === 'nao_compareceu'
            )?.count || 0;
        const canceled: number =
            data.byAttendanceStatus?.find(
                (a: AttendanceItem) => a.attendance_status === 'cancelado'
            )?.count || 0;
        const total: number = attended + noShow + canceled;
        const attendanceRate: number = total > 0 ? Math.round((attended / total) * 100) : 0;

        const attendanceRateElement: HTMLElement | null = document.getElementById('attendanceRate');
        if (attendanceRateElement) {
            attendanceRateElement.textContent = `${attendanceRate}%`;
        }

        const attendanceDetailElement: HTMLElement | null =
            document.getElementById('attendanceDetail');
        if (attendanceDetailElement) {
            attendanceDetailElement.textContent = `${attended} de ${total} compareceram`;
        }

        // Create charts
        renderStatusChart(data.byStatus);
        renderTypeChart(data.byType);

        // Create history chart
        if (data.history && data.history.length > 0) {
            renderHistoryChart(data.history);
        }

        // Generate quick reports
        generateQuickReports(data);
    } catch (error: unknown) {
        showNotification('Erro ao carregar dashboard', 'error');
    }
}

async function openDashboard(): Promise<void> {
    const modal: HTMLElement | null = document.getElementById('dashboardModal');
    if (modal) {
        modal.classList.remove('hidden');
    }

    try {
        const token: string | null =
            sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('accessToken');
        const response: Response = await fetch('/api/leads/dashboard', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar métricas');
        }

        const data: DashboardData = await response.json();

        // Update total
        const totalLeadsElement: HTMLElement | null = document.getElementById('totalLeads');
        if (totalLeadsElement) {
            totalLeadsElement.textContent = String(data.total);
        }

        // Calculate potential revenue
        const consultas: number =
            data.byType.find((t: TypeItem) => t.type === 'Consulta')?.count || 0;
        const exames: number = data.byType.find((t: TypeItem) => t.type === 'Exame')?.count || 0;
        const revenue: number = consultas * 300 + exames * 150;

        const revenueElement: HTMLElement | null = document.getElementById('revenueEstimate');
        if (revenueElement) {
            revenueElement.textContent = `R$ ${revenue.toLocaleString('pt-BR')}`;
        }

        // Update attendance metrics
        const attended: number =
            data.byAttendanceStatus?.find(
                (a: AttendanceItem) => a.attendance_status === 'compareceu'
            )?.count || 0;
        const noShow: number =
            data.byAttendanceStatus?.find(
                (a: AttendanceItem) => a.attendance_status === 'nao_compareceu'
            )?.count || 0;
        const canceled: number =
            data.byAttendanceStatus?.find(
                (a: AttendanceItem) => a.attendance_status === 'cancelado'
            )?.count || 0;
        const total: number = attended + noShow + canceled;
        const attendanceRate: number = total > 0 ? Math.round((attended / total) * 100) : 0;

        const attendanceRateElement: HTMLElement | null = document.getElementById('attendanceRate');
        if (attendanceRateElement) {
            attendanceRateElement.textContent = `${attendanceRate}%`;
        }

        const attendanceDetailElement: HTMLElement | null =
            document.getElementById('attendanceDetail');
        if (attendanceDetailElement) {
            attendanceDetailElement.textContent = `${attended} compareceram, ${noShow} faltas`;
        }

        // Render charts
        renderStatusChart(data.byStatus);
        renderTypeChart(data.byType);
        renderHistoryChart(data.history);

        // Generate quick reports
        generateQuickReports(data);
    } catch (error: unknown) {
        showNotification('Erro ao carregar métricas', 'error');
        closeDashboard();
    }
}

function closeDashboard(): void {
    const modal: HTMLElement | null = document.getElementById('dashboardModal');
    if (modal) {
        modal.classList.add('hidden');
    }

    // Destroy charts to prevent memory leaks
    if (statusChartInstance) {
        statusChartInstance.destroy();
        statusChartInstance = null;
    }
    if (typeChartInstance) {
        typeChartInstance.destroy();
        typeChartInstance = null;
    }
    if (historyChartInstance) {
        historyChartInstance.destroy();
        historyChartInstance = null;
    }
}

function renderStatusChart(byStatus: StatusItem[]): void {
    const canvas: HTMLCanvasElement | null = document.getElementById(
        'statusChart'
    ) as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) return;

    if (statusChartInstance) {
        statusChartInstance.destroy();
    }

    const labels: string[] = byStatus.map((item: StatusItem) => item.status || 'Sem Status');
    const values: number[] = byStatus.map((item: StatusItem) => item.count);

    const colors: Record<string, string> = {
        novo: '#10b981',
        'Em Atendimento': '#f59e0b',
        Agendado: '#3b82f6',
        Finalizado: '#6b7280',
    };

    const backgroundColors: string[] = labels.map((label: string) => colors[label] || '#9ca3af');

    statusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [
                {
                    data: values,
                    backgroundColor: backgroundColors,
                    borderWidth: 2,
                    borderColor: '#fff',
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12, weight: 'bold' },
                    },
                },
                tooltip: {
                    callbacks: {
                        label: function (context: Record<string, unknown>): string {
                            const label: string = (context.label as string) || '';
                            const value: number = (context.parsed as number) || 0;
                            const dataset = context.dataset as { data: number[] };
                            const totalVal: number = dataset.data.reduce(
                                (a: number, b: number) => a + b,
                                0
                            );
                            const percentage: string = ((value / totalVal) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        },
                    },
                },
            },
            animation: {
                animateRotate: true,
                animateScale: true,
            },
        },
    });
}

function renderTypeChart(byType: TypeItem[]): void {
    const canvas: HTMLCanvasElement | null = document.getElementById(
        'typeChart'
    ) as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) return;

    if (typeChartInstance) {
        typeChartInstance.destroy();
    }

    const labels: string[] = byType.map((item: TypeItem) => item.type || 'Geral');
    const values: number[] = byType.map((item: TypeItem) => item.count);

    typeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Quantidade',
                    data: values,
                    backgroundColor: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
                    borderWidth: 0,
                    borderRadius: 8,
                    barThickness: 50,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context: Record<string, unknown>): string {
                            return `${(context.parsed as { y: number }).y} leads`;
                        },
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { weight: 'bold' },
                    },
                    grid: {
                        color: '#e5e7eb',
                    },
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { weight: 'bold' },
                    },
                },
            },
            animation: {
                duration: 1500,
                easing: 'easeOutBounce',
            },
        },
    });
}

function renderHistoryChart(history: HistoryItem[]): void {
    const canvas: HTMLCanvasElement | null = document.getElementById(
        'historyChart'
    ) as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) return;

    if (historyChartInstance) {
        historyChartInstance.destroy();
    }

    const labels: string[] = history.map((item: HistoryItem) => {
        const date: Date = new Date(item.date);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
        });
    });
    const values: number[] = history.map((item: HistoryItem) => item.count);

    historyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Leads por Dia',
                    data: values,
                    borderColor: '#0d9488',
                    backgroundColor: 'rgba(13, 148, 136, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#0d9488',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context: Record<string, unknown>): string {
                            return `${(context.parsed as { y: number }).y} leads`;
                        },
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { weight: 'bold' },
                    },
                    grid: {
                        color: '#e5e7eb',
                    },
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { weight: 'bold' },
                    },
                },
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart',
            },
        },
    });
}

// ============================================
// Quick Reports Generation
// ============================================

function generateQuickReports(data: DashboardData): void {
    generateWeeklyReport(data.history, data.byAttendanceStatus);
    generateStatusReport(data.byStatus, data.total);
    generateTypesReport(data.byType, data.byAttendanceStatus);
}

function generateWeeklyReport(history: HistoryItem[], byAttendanceStatus?: AttendanceItem[]): void {
    const element: HTMLElement | null = document.getElementById('weeklyReportText');
    if (!element) return;

    // Calculate total leads in the period
    const totalInPeriod: number = history.reduce(
        (sum: number, day: HistoryItem) => sum + day.count,
        0
    );

    // Find strongest day
    let strongestDay: { date: string; count: number } = { date: '', count: 0 };
    history.forEach((day: HistoryItem) => {
        if (day.count > strongestDay.count) {
            strongestDay = { date: day.date, count: day.count };
        }
    });

    const strongestDateFormatted: string = strongestDay.date
        ? new Date(strongestDay.date).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
          })
        : '--';

    // Attendance stats
    const attended: number =
        byAttendanceStatus?.find((a: AttendanceItem) => a.attendance_status === 'compareceu')
            ?.count || 0;
    const noShow: number =
        byAttendanceStatus?.find((a: AttendanceItem) => a.attendance_status === 'nao_compareceu')
            ?.count || 0;
    const canceled: number =
        byAttendanceStatus?.find((a: AttendanceItem) => a.attendance_status === 'cancelado')
            ?.count || 0;

    const attendanceText: string =
        attended + noShow + canceled > 0
            ? `\n\nNo período analisado, ${attended} pacientes compareceram às consultas, ${noShow} faltaram e ${canceled} cancelaram com antecedência.`
            : '';

    const report: string = `📊 RESUMO DA SEMANA

Nos últimos 7 dias você recebeu ${totalInPeriod} novos leads.

${strongestDay.count > 0 ? `O dia mais forte foi ${strongestDateFormatted} com ${strongestDay.count} leads.` : 'Nenhum lead registrado no período.'}${attendanceText}

Continue acompanhando suas métricas para melhorar ainda mais! 💪`;

    element.textContent = report;
}

function generateStatusReport(byStatus: StatusItem[], total: number): void {
    const element: HTMLElement | null = document.getElementById('statusReportText');
    if (!element) return;

    // Build status breakdown
    const statusMap: Record<string, number> = {};
    byStatus.forEach((item: StatusItem) => {
        statusMap[item.status || 'Sem Status'] = item.count;
    });

    const novo: number = statusMap['novo'] || 0;
    const emAtendimento: number = statusMap['Em Atendimento'] || 0;
    const agendado: number = statusMap['agendado'] || statusMap['Agendado'] || 0;
    const finalizado: number = statusMap['Finalizado'] || 0;

    const report: string = `📈 FUNIL DE ATENDIMENTO

Atualmente você tem:

• ${novo} leads em Novo
• ${emAtendimento} em Atendimento  
• ${agendado} Agendados
• ${finalizado} Finalizados

Total de ${total} leads no sistema.

Continue convertendo! 🎯`;

    element.textContent = report;
}

function generateTypesReport(byType: TypeItem[], byAttendanceStatus?: AttendanceItem[]): void {
    const element: HTMLElement | null = document.getElementById('typesReportText');
    if (!element) return;

    if (byType.length === 0) {
        element.textContent = 'Nenhum tipo de atendimento registrado ainda.';
        return;
    }

    // Build breakdown
    let breakdown: string = '';
    let totalServices: number = 0;

    byType.forEach((item: TypeItem) => {
        const type: string = item.type || 'Geral';
        const count: number = item.count;
        totalServices += count;
        breakdown += `• ${count} ${type}${count !== 1 ? 's' : ''}\n`;
    });

    // Attendance stats
    const attended: number =
        byAttendanceStatus?.find((a: AttendanceItem) => a.attendance_status === 'compareceu')
            ?.count || 0;
    const noShow: number =
        byAttendanceStatus?.find((a: AttendanceItem) => a.attendance_status === 'nao_compareceu')
            ?.count || 0;
    const canceled: number =
        byAttendanceStatus?.find((a: AttendanceItem) => a.attendance_status === 'cancelado')
            ?.count || 0;
    const totalAttendance: number = attended + noShow + canceled;
    const attendanceRate: number =
        totalAttendance > 0 ? Math.round((attended / totalAttendance) * 100) : 0;

    const attendanceText: string =
        totalAttendance > 0
            ? `\nTaxa de presença: ${attendanceRate}% (${attended} compareceram de ${totalAttendance})`
            : '';

    const report: string = `🏥 TIPOS DE ATENDIMENTO

No período atual foram registradas:

${breakdown}
Total: ${totalServices} atendimentos programados.${attendanceText}

Sua clínica está crescendo! 🚀`;

    element.textContent = report;
}

// ============================================
// Copy Report Text to Clipboard
// ============================================

function copyReportText(elementId: string): void {
    const element: HTMLElement | null = document.getElementById(elementId);
    if (!element) return;

    const text: string = element.textContent || '';

    // Use modern clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                showNotification('✅ Texto copiado! Cole onde quiser.', 'success');
            })
            .catch((err: Error) => {
                fallbackCopyText(text);
            });
    } else {
        fallbackCopyText(text);
    }
}

function fallbackCopyText(text: string): void {
    // Fallback for older browsers
    const textarea: HTMLTextAreaElement = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
        showNotification('✅ Texto copiado! Cole onde quiser.', 'success');
    } catch (err: unknown) {
        showNotification('❌ Erro ao copiar. Tente selecionar e copiar manualmente.', 'error');
    }

    document.body.removeChild(textarea);
}

// Expose globals for cross-file access (IIFE isolation)
(window as unknown as Record<string, unknown>).loadSummaryMetrics = loadSummaryMetrics;
(window as unknown as Record<string, unknown>).openDashboard = openDashboard;
(window as unknown as Record<string, unknown>).closeDashboard = closeDashboard;
(window as unknown as Record<string, unknown>).copyReportText = copyReportText;
(window as unknown as Record<string, unknown>).loadDashboardData = loadDashboardData;
