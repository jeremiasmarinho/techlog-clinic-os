// ============================================
// Dashboard - Analytics & Charts
// ============================================

// Chart instances (prevent memory leaks)
let statusChartInstance = null;
let typeChartInstance = null;
let historyChartInstance = null;

async function openDashboard() {
    const modal = document.getElementById('dashboardModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
    
    try {
        const response = await fetch('/api/leads/dashboard', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': ACCESS_TOKEN
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar métricas');
        }

        const data = await response.json();
        
        // Update total
        const totalLeadsElement = document.getElementById('totalLeads');
        if (totalLeadsElement) {
            totalLeadsElement.textContent = data.total;
        }

        // Calculate potential revenue
        const consultas = data.byType.find(t => t.type === 'Consulta')?.count || 0;
        const exames = data.byType.find(t => t.type === 'Exame')?.count || 0;
        const revenue = (consultas * 300) + (exames * 150);
        
        const revenueElement = document.getElementById('revenueEstimate');
        if (revenueElement) {
            revenueElement.textContent = `R$ ${revenue.toLocaleString('pt-BR')}`;
        }

        // Render charts
        renderStatusChart(data.byStatus);
        renderTypeChart(data.byType);
        renderHistoryChart(data.history);
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showNotification('Erro ao carregar métricas', 'error');
        closeDashboard();
    }
}

function closeDashboard() {
    const modal = document.getElementById('dashboardModal');
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

function renderStatusChart(byStatus) {
    const canvas = document.getElementById('statusChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (statusChartInstance) {
        statusChartInstance.destroy();
    }

    const labels = byStatus.map(item => item.status || 'Sem Status');
    const values = byStatus.map(item => item.count);
    
    const colors = {
        'novo': '#10b981',
        'Em Atendimento': '#f59e0b',
        'Agendado': '#3b82f6',
        'Finalizado': '#6b7280'
    };

    const backgroundColors = labels.map(label => colors[label] || '#9ca3af');

    statusChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12, weight: 'bold' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    });
}

function renderTypeChart(byType) {
    const canvas = document.getElementById('typeChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (typeChartInstance) {
        typeChartInstance.destroy();
    }

    const labels = byType.map(item => item.type || 'Geral');
    const values = byType.map(item => item.count);

    typeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade',
                data: values,
                backgroundColor: [
                    '#8b5cf6',
                    '#ec4899',
                    '#f59e0b',
                    '#10b981'
                ],
                borderWidth: 0,
                borderRadius: 8,
                barThickness: 50
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} leads`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { weight: 'bold' }
                    },
                    grid: {
                        color: '#e5e7eb'
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { weight: 'bold' }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeOutBounce'
            }
        }
    });
}

function renderHistoryChart(history) {
    const canvas = document.getElementById('historyChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    if (historyChartInstance) {
        historyChartInstance.destroy();
    }

    const labels = history.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });
    const values = history.map(item => item.count);

    historyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
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
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} leads`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { weight: 'bold' }
                    },
                    grid: {
                        color: '#e5e7eb'
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        font: { weight: 'bold' }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });
}
