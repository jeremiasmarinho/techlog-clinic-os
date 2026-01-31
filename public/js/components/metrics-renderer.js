/**
 * ============================================
 * DASHBOARD METRICS RENDERER
 * Renderização visual das métricas no dashboard
 * ============================================
 */

/**
 * Renderiza todas as métricas nos cards do dashboard
 * @param {object} metrics - Métricas calculadas
 */
export function renderMetrics(metrics) {
    if (!metrics) return;
    
    renderDailyRevenue(metrics.dailyRevenue, metrics.revenueGrowth);
    renderTomorrowConfirmations(metrics.tomorrowConfirmations);
    renderTodayOccupancy(metrics.todayOccupancy);
    renderAverageTicket(metrics.averageTicket);
}

/**
 * Renderiza card de faturamento diário
 * @param {object} revenue - Dados de receita
 * @param {object} growth - Dados de crescimento
 */
function renderDailyRevenue(revenue, growth) {
    const revenueEl = document.getElementById('dailyRevenue');
    const growthEl = document.getElementById('revenueGrowth');
    
    if (revenueEl) {
        revenueEl.textContent = revenue.formatted;
        revenueEl.classList.add('animate-fade-in');
    }
    
    if (growthEl) {
        const icon = growth.isPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
        const colorClass = growth.isPositive ? 'text-emerald-400' : 'text-red-400';
        const bgClass = growth.isPositive ? 'bg-emerald-400/10' : 'bg-red-400/10';
        
        growthEl.innerHTML = `
            <i class="fa-solid ${icon} mr-1"></i>
            <span>${growth.formatted} vs Ontem</span>
        `;
        
        // Reset classes
        growthEl.className = `flex items-center text-xs ${colorClass} ${bgClass} w-fit px-2 py-1 rounded-lg`;
    }
}

/**
 * Renderiza card de confirmações de amanhã
 * @param {object} confirmations - Dados de confirmações
 */
function renderTomorrowConfirmations(confirmations) {
    const countEl = document.getElementById('tomorrowCount');
    const confirmEl = document.getElementById('tomorrowConfirm');
    
    if (countEl) {
        countEl.textContent = confirmations.count;
        countEl.classList.add('animate-fade-in');
    }
    
    // Adiciona badge de urgência se houver muitos
    if (confirmEl && confirmations.count > 5) {
        confirmEl.classList.add('ring-2', 'ring-amber-500/50');
    }
}

/**
 * Renderiza card de ocupação da agenda
 * @param {object} occupancy - Dados de ocupação
 */
function renderTodayOccupancy(occupancy) {
    const appointmentsEl = document.getElementById('todayAppointments');
    const barEl = document.getElementById('occupancyBar');
    const badgeEl = document.getElementById('occupancyBadge');
    
    if (appointmentsEl) {
        appointmentsEl.textContent = occupancy.count;
        appointmentsEl.classList.add('animate-fade-in');
    }
    
    if (barEl) {
        const percent = Math.round(occupancy.percent);
        barEl.style.width = `${percent}%`;
        
        // Cor baseada na ocupação
        const colorClass = getOccupancyColor(percent);
        barEl.className = `h-1.5 rounded-full transition-all duration-500 ${colorClass}`;
    }
    
    if (badgeEl) {
        const percent = Math.round(occupancy.percent);
        badgeEl.textContent = `${percent}% Cheia`;
        
        const colorClass = getOccupancyBadgeColor(percent);
        badgeEl.className = `text-xs px-2 py-1 rounded ${colorClass}`;
    }
}

/**
 * Renderiza card de ticket médio
 * @param {object} ticket - Dados de ticket médio
 */
function renderAverageTicket(ticket) {
    const ticketEl = document.getElementById('averageTicket');
    
    if (ticketEl) {
        ticketEl.textContent = ticket.formatted;
        ticketEl.classList.add('animate-fade-in');
    }
}

/**
 * Retorna classe de cor baseada na ocupação
 * @param {number} percent - Porcentagem de ocupação
 * @returns {string} Classe CSS
 */
function getOccupancyColor(percent) {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-amber-500';
    if (percent >= 50) return 'bg-blue-500';
    return 'bg-emerald-500';
}

/**
 * Retorna classe de cor do badge baseada na ocupação
 * @param {number} percent - Porcentagem de ocupação
 * @returns {string} Classe CSS
 */
function getOccupancyBadgeColor(percent) {
    if (percent >= 90) return 'text-red-400 bg-red-400/10';
    if (percent >= 70) return 'text-amber-400 bg-amber-400/10';
    if (percent >= 50) return 'text-blue-400 bg-blue-400/10';
    return 'text-emerald-400 bg-emerald-400/10';
}

/**
 * Limpa todas as métricas (reseta para valores padrão)
 */
export function clearMetrics() {
    const elements = [
        { id: 'dailyRevenue', value: 'R$ 0,00' },
        { id: 'revenueGrowth', value: '+0% vs Ontem' },
        { id: 'tomorrowCount', value: '0' },
        { id: 'todayAppointments', value: '0' },
        { id: 'occupancyBar', value: null },
        { id: 'occupancyBadge', value: '0% Cheia' },
        { id: 'averageTicket', value: 'R$ 0,00' }
    ];
    
    elements.forEach(({ id, value }) => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'occupancyBar') {
                el.style.width = '0%';
            } else {
                el.textContent = value;
            }
        }
    });
}
