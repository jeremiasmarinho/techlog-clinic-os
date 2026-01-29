/**
 * Kanban Column Web Component
 * Componente reutilizável para colunas do kanban board
 */

class KanbanColumn extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const columnId = this.getAttribute('column-id');
        const title = this.getAttribute('title');
        const icon = this.getAttribute('icon') || '📋';
        const count = this.getAttribute('count') || '0';
        
        this.render(columnId, title, icon, count);
        this.attachEvents();
    }

    render(columnId, title, icon, count) {
        this.className = 'kanban-column bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50 min-h-[600px]';
        
        this.innerHTML = `
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
                <h3 class="text-lg font-bold text-white flex items-center gap-2">
                    <span class="text-2xl">${icon}</span>
                    <span>${title}</span>
                </h3>
                <span class="column-count bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm font-bold">
                    ${count}
                </span>
            </div>
            <div id="${columnId}" 
                 class="kanban-column-content min-h-[500px] space-y-3"
                 data-status="${columnId.replace('column-', '')}">
                <!-- Lead cards will be inserted here -->
            </div>
        `;
    }

    attachEvents() {
        const columnContent = this.querySelector('.kanban-column-content');
        
        if (columnContent) {
            // Drag over event
            columnContent.addEventListener('dragover', (e) => {
                e.preventDefault();
                columnContent.classList.add('bg-cyan-500/10', 'border-2', 'border-cyan-400/50');
            });

            // Drag leave event
            columnContent.addEventListener('dragleave', (e) => {
                if (e.target === columnContent) {
                    columnContent.classList.remove('bg-cyan-500/10', 'border-2', 'border-cyan-400/50');
                }
            });

            // Drop event
            columnContent.addEventListener('drop', (e) => {
                e.preventDefault();
                columnContent.classList.remove('bg-cyan-500/10', 'border-2', 'border-cyan-400/50');
                
                if (typeof window.handleDrop === 'function') {
                    window.handleDrop(e);
                }
            });
        }
    }

    updateCount(count) {
        const countElement = this.querySelector('.column-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    getColumnContent() {
        return this.querySelector('.kanban-column-content');
    }

    addLeadCard(leadElement) {
        const columnContent = this.getColumnContent();
        if (columnContent) {
            columnContent.appendChild(leadElement);
        }
    }

    clearLeads() {
        const columnContent = this.getColumnContent();
        if (columnContent) {
            columnContent.innerHTML = '';
        }
    }

    getLeadCount() {
        const columnContent = this.getColumnContent();
        return columnContent ? columnContent.querySelectorAll('lead-card').length : 0;
    }
}

// Register the custom element
customElements.define('kanban-column', KanbanColumn);
