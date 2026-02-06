/**
 * Dashboard Charts Module - Chart.js rendering
 */

declare const Chart: {
    new (ctx: HTMLElement, config: Record<string, unknown>): ChartInstance;
};

interface ChartInstance {
    destroy(): void;
}

interface StatusData {
    status: string;
    count: number;
}

interface TypeData {
    type: string;
    count: number;
}

interface HistoryData {
    date: string;
    count: number;
}

// Chart instances (prevent memory leaks)
let statusChartInstance: ChartInstance | null = null;
let typeChartInstance: ChartInstance | null = null;
let historyChartInstance: ChartInstance | null = null;

// Render status distribution chart
export function renderStatusChart(byStatus: StatusData[]): void {
    const ctx = document.getElementById('statusChart') as HTMLCanvasElement | null;
    if (!ctx) return;

    // Destroy previous instance
    if (statusChartInstance) {
        statusChartInstance.destroy();
    }

    const statusMap: Record<string, string> = {
        novo: 'Novos',
        em_atendimento: 'Em Atendimento',
        agendado: 'Agendados',
        finalizado: 'Finalizados',
    };

    const labels = byStatus.map((s) => {
        return statusMap[s.status] || s.status;
    });

    const data = byStatus.map((s) => s.count);

    statusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [
                {
                    data: data,
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)', // green - novo
                        'rgba(251, 191, 36, 0.8)', // yellow - em atendimento
                        'rgba(59, 130, 246, 0.8)', // blue - agendado
                        'rgba(107, 114, 128, 0.8)', // gray - finalizado
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(251, 191, 36, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(107, 114, 128, 1)',
                    ],
                    borderWidth: 2,
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
                        color: '#fff',
                        font: { size: 12 },
                    },
                },
                title: {
                    display: true,
                    text: 'Distribuição por Status',
                    color: '#fff',
                    font: { size: 16, weight: 'bold' },
                },
            },
        },
    });
}

// Render type distribution chart
export function renderTypeChart(byType: TypeData[]): void {
    const ctx = document.getElementById('typeChart') as HTMLCanvasElement | null;
    if (!ctx) return;

    // Destroy previous instance
    if (typeChartInstance) {
        typeChartInstance.destroy();
    }

    const labels = byType.map((t) => {
        // Handle detailed consultation types from chat
        if (t.type && t.type.startsWith('Consulta - ')) {
            const parts = t.type.split(' - ');
            return parts[1] || 'Consulta';
        }
        return t.type || 'Geral';
    });
    const data = byType.map((t) => t.count);

    typeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Quantidade',
                    data: data,
                    backgroundColor: 'rgba(6, 182, 212, 0.8)',
                    borderColor: 'rgba(6, 182, 212, 1)',
                    borderWidth: 2,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#fff',
                        stepSize: 1,
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                    },
                },
                x: {
                    ticks: {
                        color: '#fff',
                        maxRotation: 45,
                        minRotation: 45,
                    },
                    grid: {
                        display: false,
                    },
                },
            },
            plugins: {
                legend: {
                    display: false,
                },
                title: {
                    display: true,
                    text: 'Leads por Tipo de Atendimento',
                    color: '#fff',
                    font: { size: 16, weight: 'bold' },
                },
            },
        },
    });
}

// Render history timeline chart
export function renderHistoryChart(history: HistoryData[]): void {
    const ctx = document.getElementById('historyChart') as HTMLCanvasElement | null;
    if (!ctx) return;

    // Destroy previous instance
    if (historyChartInstance) {
        historyChartInstance.destroy();
    }

    const labels = history.map((h) => {
        const date = new Date(h.date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
    });
    const data = history.map((h) => h.count);

    historyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Novos Leads',
                    data: data,
                    borderColor: 'rgba(168, 85, 247, 1)',
                    backgroundColor: 'rgba(168, 85, 247, 0.2)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(168, 85, 247, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#fff',
                        stepSize: 1,
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                    },
                },
                x: {
                    ticks: { color: '#fff' },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                    },
                },
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#fff',
                    },
                },
                title: {
                    display: true,
                    text: 'Evolução nos Últimos 7 Dias',
                    color: '#fff',
                    font: { size: 16, weight: 'bold' },
                },
            },
        },
    });
}

// Destroy all chart instances
export function destroyAllCharts(): void {
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
