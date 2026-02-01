class KanbanController {
    constructor(options = {}) {
        this.board = document.querySelector(options.boardSelector || '.kanban-grid');
        this.cardSelector = options.cardSelector || '.kanban-card';
        this.columnSelector = options.columnSelector || '.kanban-column';
        this.cardsContainerSelector = options.cardsContainerSelector || '.kanban-cards';
        this.draggedCard = null;
        this.origin = null;
    }

    init() {
        if (!this.board) return;

        this.columns = Array.from(this.board.querySelectorAll(this.columnSelector));
        this.cards = Array.from(this.board.querySelectorAll(this.cardSelector));

        this.statusOrder = window.PATIENT_STATUSES
            ? [
                  window.PATIENT_STATUSES.WAITING,
                  window.PATIENT_STATUSES.TRIAGE,
                  window.PATIENT_STATUSES.CONSULTATION,
                  window.PATIENT_STATUSES.FINISHED,
              ]
            : ['waiting', 'triage', 'consultation', 'finished'];

        this.columns.forEach((column, index) => {
            const currentStatus = column.dataset.status;
            if (!window.PATIENT_STATUS_VALUES?.includes(currentStatus)) {
                column.dataset.status = this.statusOrder[index] || this.statusOrder[0];
            }
        });

        this.cards.forEach((card) => this.bindCard(card));
        this.columns.forEach((column) => this.bindColumn(column));

        this.updateCounts();
    }

    bindCard(card) {
        card.setAttribute('draggable', 'true');

        card.addEventListener('dragstart', (event) => {
            this.draggedCard = card;
            this.origin = {
                parent: card.parentElement,
                nextSibling: card.nextElementSibling,
            };

            card.classList.add('is-dragging');

            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', card.dataset.patientId || '');
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('is-dragging');
            this.columns.forEach((column) => column.classList.remove('is-drop-target'));
        });
    }

    bindColumn(column) {
        column.addEventListener('dragover', (event) => {
            event.preventDefault();
            column.classList.add('is-drop-target');
        });

        column.addEventListener('dragleave', () => {
            column.classList.remove('is-drop-target');
        });

        column.addEventListener('drop', (event) => {
            event.preventDefault();
            column.classList.remove('is-drop-target');

            const targetContainer = column.querySelector(this.cardsContainerSelector) || column;
            if (!this.draggedCard || !targetContainer) return;

            const patientId = this.draggedCard.dataset.patientId;
            const newStatus = column.dataset.status;

            if (!window.PATIENT_STATUS_VALUES?.includes(newStatus)) {
                showToast('Status inválido para o Kanban', 'error');
                return;
            }

            const previousParent = this.origin?.parent;
            const previousNextSibling = this.origin?.nextSibling;

            // Optimistic UI: move now
            targetContainer.appendChild(this.draggedCard);
            this.updateCounts();

            this.setLoading(this.draggedCard, true);

            updatePatientStatus(patientId, newStatus)
                .then(() => {
                    this.setLoading(this.draggedCard, false);
                    this.flashSuccess(this.draggedCard);
                    showToast('Status atualizado com sucesso', 'success');
                })
                .catch((error) => {
                    // Revert on error
                    if (previousParent) {
                        if (
                            previousNextSibling &&
                            previousNextSibling.parentElement === previousParent
                        ) {
                            previousParent.insertBefore(this.draggedCard, previousNextSibling);
                        } else {
                            previousParent.appendChild(this.draggedCard);
                        }
                    }
                    this.updateCounts();
                    this.setLoading(this.draggedCard, false);
                    showToast(error?.message || 'Erro ao atualizar status do paciente', 'error');
                });
        });
    }

    updateCounts() {
        this.columns.forEach((column) => {
            const countEl = column.querySelector('.kanban-count');
            const cards = column.querySelectorAll(this.cardSelector);
            if (countEl) countEl.textContent = String(cards.length);
        });
    }

    setLoading(card, isLoading) {
        if (!card) return;
        const existingSpinner = card.querySelector('.kanban-spinner');
        if (isLoading) {
            card.classList.add('is-loading');
            if (!existingSpinner) {
                const spinner = document.createElement('div');
                spinner.className = 'kanban-spinner';
                card.appendChild(spinner);
            }
        } else {
            card.classList.remove('is-loading');
            if (existingSpinner) existingSpinner.remove();
        }
    }

    flashSuccess(card) {
        if (!card) return;
        card.classList.add('is-success');

        const existingCheck = card.querySelector('.kanban-check');
        if (!existingCheck) {
            const check = document.createElement('div');
            check.className = 'kanban-check';
            check.textContent = '✓';
            card.appendChild(check);
            setTimeout(() => check.remove(), 900);
        }

        setTimeout(() => card.classList.remove('is-success'), 900);
    }
}

async function updatePatientStatus(patientId, newStatus) {
    if (!patientId || !newStatus) {
        return Promise.reject(new Error('Dados inválidos para atualização'));
    }

    if (!window.PATIENT_STATUS_VALUES?.includes(newStatus)) {
        return Promise.reject(new Error('Status não permitido'));
    }

    const token = sessionStorage.getItem('token') || sessionStorage.getItem('MEDICAL_CRM_TOKEN');

    const response = await fetch(`/api/patients/${patientId}/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || 'Falha ao atualizar status');
    }

    return response.json().catch(() => ({}));
}

function showToast(message, type = 'error') {
    let container = document.querySelector('.kanban-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'kanban-toast-container';
        container.style.position = 'fixed';
        container.style.bottom = '24px';
        container.style.right = '24px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        container.style.zIndex = '60';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `kanban-toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'error' ? '⚠️' : '✅'}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
        if (container && container.children.length === 0) {
            container.remove();
        }
    }, 3200);
}

document.addEventListener('DOMContentLoaded', () => {
    const kanban = new KanbanController();
    kanban.init();
});

window.KanbanController = KanbanController;
