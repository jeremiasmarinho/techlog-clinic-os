// ============================================
// Dashboard - Analytics & Charts
// ============================================

// Chart instances (prevent memory leaks)
let statusChartInstance = null;
let typeChartInstance = null;
let historyChartInstance = null;

// Load summary metrics on page load
async function loadSummaryMetrics() {
    try {
        const token = sessionStorage.getItem('MEDICAL_CRM_TOKEN');
        const response = await fetch('/api/metrics/resumo', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar métricas');
        
        const data = await response.json();
        
        // Update cards
        document.getElementById('taxaConversao').textContent = `${data.taxaConversao.value}%`;
        document.getElementById('taxaConversaoDetail').textContent = `${data.taxaConversao.convertidos} de ${data.taxaConversao.total} leads`;
        
        document.getElementById('noShows').textContent = data.noShows.value;
        document.getElementById('noShowsDetail').textContent = data.noShows.periodo;
        
        document.getElementById('consultasSemana').textContent = data.consultasSemana.value;
        document.getElementById('consultasSemanaDetail').textContent = data.consultasSemana.periodo;
    } catch (error) {
        console.error('Erro ao carregar métricas:', error);
    }
}

async function openDashboard() {
    const modal = document.getElementById('dashboardModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
    
    try {
        const token = sessionStorage.getItem('MEDICAL_CRM_TOKEN');
        const response = await fetch('/api/leads/dashboard', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
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
        
        // Update attendance metrics
        const attended = data.byAttendanceStatus?.find(a => a.attendance_status === 'compareceu')?.count || 0;
        const noShow = data.byAttendanceStatus?.find(a => a.attendance_status === 'nao_compareceu')?.count || 0;
        const canceled = data.byAttendanceStatus?.find(a => a.attendance_status === 'cancelado')?.count || 0;
        const total = attended + noShow + canceled;
        const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;
        
        const attendanceRateElement = document.getElementById('attendanceRate');
        if (attendanceRateElement) {
            attendanceRateElement.textContent = `${attendanceRate}%`;
        }
        
        const attendanceDetailElement = document.getElementById('attendanceDetail');
        if (attendanceDetailElement) {
            attendanceDetailElement.textContent = `${attended} compareceram, ${noShow} faltas`;
        }

        // Render charts
        renderStatusChart(data.byStatus);
        renderTypeChart(data.byType);
        renderHistoryChart(data.history);
        
        // Generate quick reports
        generateQuickReports(data);
        
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

// ============================================
// Quick Reports Generation
// ============================================

function generateQuickReports(data) {
    generateWeeklyReport(data.history, data.byAttendanceStatus);
    generateStatusReport(data.byStatus, data.total);
    generateTypesReport(data.byType, data.byAttendanceStatus);
}

function generateWeeklyReport(history, byAttendanceStatus) {
    const element = document.getElementById('weeklyReportText');
    if (!element) return;
    
    // Calculate total leads in the period
    const totalInPeriod = history.reduce((sum, day) => sum + day.count, 0);
    
    // Find strongest day
    let strongestDay = { date: '', count: 0 };
    history.forEach(day => {
        if (day.count > strongestDay.count) {
            strongestDay = { date: day.date, count: day.count };
        }
    });
    
    const strongestDateFormatted = strongestDay.date 
        ? new Date(strongestDay.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        : '--';
    
    // Attendance stats
    const attended = byAttendanceStatus?.find(a => a.attendance_status === 'compareceu')?.count || 0;
    const noShow = byAttendanceStatus?.find(a => a.attendance_status === 'nao_compareceu')?.count || 0;
    const canceled = byAttendanceStatus?.find(a => a.attendance_status === 'cancelado')?.count || 0;
    
    const attendanceText = (attended + noShow + canceled) > 0 
        ? `\n\nNo período analisado, ${attended} pacientes compareceram às consultas, ${noShow} faltaram e ${canceled} cancelaram com antecedência.`
        : '';
    
    const report = `📊 RESUMO DA SEMANA

Nos últimos 7 dias você recebeu ${totalInPeriod} novos leads.

${strongestDay.count > 0 ? `O dia mais forte foi ${strongestDateFormatted} com ${strongestDay.count} leads.` : 'Nenhum lead registrado no período.'}${attendanceText}

Continue acompanhando suas métricas para melhorar ainda mais! 💪`;
    
    element.textContent = report;
}

function generateStatusReport(byStatus, total) {
    const element = document.getElementById('statusReportText');
    if (!element) return;
    
    // Build status breakdown
    const statusMap = {};
    byStatus.forEach(item => {
        statusMap[item.status || 'Sem Status'] = item.count;
    });
    
    const novo = statusMap['novo'] || 0;
    const emAtendimento = statusMap['Em Atendimento'] || 0;
    const agendado = statusMap['agendado'] || statusMap['Agendado'] || 0;
    const finalizado = statusMap['Finalizado'] || 0;
    
    const report = `📈 FUNIL DE ATENDIMENTO

Atualmente você tem:

• ${novo} leads em Novo
• ${emAtendimento} em Atendimento  
• ${agendado} Agendados
• ${finalizado} Finalizados

Total de ${total} leads no sistema.

Continue convertendo! 🎯`;
    
    element.textContent = report;
}

function generateTypesReport(byType, byAttendanceStatus) {
    const element = document.getElementById('typesReportText');
    if (!element) return;
    
    if (byType.length === 0) {
        element.textContent = 'Nenhum tipo de atendimento registrado ainda.';
        return;
    }
    
    // Build breakdown
    let breakdown = '';
    let totalServices = 0;
    
    byType.forEach(item => {
        const type = item.type || 'Geral';
        const count = item.count;
        totalServices += count;
        breakdown += `• ${count} ${type}${count !== 1 ? 's' : ''}\n`;
    });
    
    // Attendance stats
    const attended = byAttendanceStatus?.find(a => a.attendance_status === 'compareceu')?.count || 0;
    const noShow = byAttendanceStatus?.find(a => a.attendance_status === 'nao_compareceu')?.count || 0;
    const canceled = byAttendanceStatus?.find(a => a.attendance_status === 'cancelado')?.count || 0;
    const totalAttendance = attended + noShow + canceled;
    const attendanceRate = totalAttendance > 0 ? Math.round((attended / totalAttendance) * 100) : 0;
    
    const attendanceText = totalAttendance > 0 
        ? `\nTaxa de presença: ${attendanceRate}% (${attended} compareceram de ${totalAttendance})`
        : '';
    
    const report = `🏥 TIPOS DE ATENDIMENTO

No período atual foram registradas:

${breakdown}
Total: ${totalServices} atendimentos programados.${attendanceText}

Sua clínica está crescendo! 🚀`;
    
    element.textContent = report;
}

// ============================================
// Copy Report Text to Clipboard
// ============================================

function copyReportText(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const text = element.textContent;
    
    // Use modern clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showNotification('✅ Texto copiado! Cole onde quiser.', 'success');
            })
            .catch(err => {
                console.error('Erro ao copiar:', err);
                fallbackCopyText(text);
            });
    } else {
        fallbackCopyText(text);
    }
}

function fallbackCopyText(text) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showNotification('✅ Texto copiado! Cole onde quiser.', 'success');
    } catch (err) {
        console.error('Erro ao copiar:', err);
        showNotification('❌ Erro ao copiar. Tente selecionar e copiar manualmente.', 'error');
    }
    
    document.body.removeChild(textarea);
}
