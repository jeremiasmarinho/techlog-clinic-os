/**
 * Dashboard KPI Widget Component
 * Componente reutilizável para cards de métricas
 */

class DashboardKpi extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const title = this.getAttribute('title');
        const value = this.getAttribute('value') || '0';
        const subtitle = this.getAttribute('subtitle') || '';
        const icon = this.getAttribute('icon') || '📊';
        const color = this.getAttribute('color') || 'cyan';
        
        this.render(title, value, subtitle, icon, color);
    }

    render(title, value, subtitle, icon, color) {
        this.className = 'glass-card rounded-xl p-6 border border-white/10 backdrop-blur-xl hover:scale-105 transition-transform';
        
        this.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <h3 class="text-gray-300 text-sm font-semibold">${title}</h3>
                <span class="text-2xl">${icon}</span>
            </div>
            <div class="kpi-value text-${color}-400 text-4xl font-bold mb-1">${value}</div>
            ${subtitle ? `<p class="text-gray-400 text-xs">${subtitle}</p>` : ''}
        `;
    }

    updateValue(newValue) {
        const valueElement = this.querySelector('.kpi-value');
        if (valueElement) {
            valueElement.textContent = newValue;
        }
    }
}

// Register the custom element
customElements.define('dashboard-kpi', DashboardKpi);
