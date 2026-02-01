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

    findCardByPatientId(patientId) {
        if (!this.board) return null;
        return this.board.querySelector(`${this.cardSelector}[data-patient-id="${patientId}"]`);
    }

    moveCardToStatus(patientId, status) {
        if (!this.board) return;
        const card = this.findCardByPatientId(patientId);
        const column = this.board.querySelector(`${this.columnSelector}[data-status="${status}"]`);
        if (!card || !column) return;

        const targetContainer = column.querySelector(this.cardsContainerSelector) || column;
        targetContainer.appendChild(card);
        this.updateCounts();
        this.flashSuccess(card);
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

async function submitAttendance(patientId) {
    const button =
        document.querySelector(`[data-attendance-submit="${patientId}"]`) ||
        document.getElementById('attendanceSubmitBtn');

    const anamnesisEl =
        document.getElementById('anamnesisText') ||
        document.getElementById('anamnesis') ||
        document.querySelector('[data-anamnesis]');

    const diagnosisEl =
        document.getElementById('diagnosisText') ||
        document.getElementById('diagnosis') ||
        document.querySelector('[data-diagnosis]');

    const medsContainer =
        document.getElementById('medicationsList') ||
        document.querySelector('[data-medications-list]');

    const anamnesisText = anamnesisEl ? anamnesisEl.value?.trim() : '';
    const diagnosis = diagnosisEl ? diagnosisEl.value?.trim() : '';

    const medications = medsContainer
        ? Array.from(medsContainer.querySelectorAll('[data-medication], .medication-item, li'))
              .map((el) => el.dataset?.medication || el.textContent?.trim())
              .filter(Boolean)
        : [];

    if (!patientId) {
        showToast('Paciente inválido', 'error');
        return;
    }

    const originalText = button ? button.textContent : null;
    if (button) {
        button.textContent = 'Salvando...';
        button.disabled = true;
    }

    const token = sessionStorage.getItem('token') || sessionStorage.getItem('MEDICAL_CRM_TOKEN');

    try {
        const response = await fetch(`/api/patients/${patientId}/finish`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
                anamnesisText,
                diagnosis,
                medications,
            }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data?.error || 'Falha ao finalizar atendimento');
        }

        const data = await response.json().catch(() => ({}));
        const prescriptionId = data?.prescription_id;
        if (prescriptionId) {
            const downloadBtn = document.getElementById('prescriptionDownloadBtn');
            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.dataset.prescriptionId = String(prescriptionId);
                downloadBtn.onclick = () => downloadPrescription(prescriptionId, patientId);
            }

            const card = window.kanbanController?.findCardByPatientId?.(patientId);
            if (card) {
                card.dataset.prescriptionId = String(prescriptionId);
            }
        }

        showToast('Atendimento finalizado', 'success');

        const finishedStatus = window.PATIENT_STATUSES?.FINISHED || 'finished';
        if (window.kanbanController) {
            window.kanbanController.moveCardToStatus(patientId, finishedStatus);
        }

        closeAttendanceModal();
    } catch (error) {
        showToast(error?.message || 'Erro ao salvar atendimento', 'error');
    } finally {
        if (button) {
            button.textContent = originalText || 'Salvar';
            button.disabled = false;
        }
    }
}

async function downloadPrescription(prescriptionId, patientId) {
    if (!prescriptionId) {
        showToast('Receita não disponível', 'error');
        return;
    }

    const token = sessionStorage.getItem('token') || sessionStorage.getItem('MEDICAL_CRM_TOKEN');

    const response = await fetch(`/api/prescriptions/${prescriptionId}/pdf`, {
        method: 'GET',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showToast(data?.error || 'Erro ao gerar PDF', 'error');
        return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const patientName = getPatientName(patientId) || 'paciente';
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `receita-${slugify(patientName)}-${dateStr}.pdf`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

function getPatientName(patientId) {
    const card = window.kanbanController?.findCardByPatientId?.(patientId);
    if (!card) return null;
    const nameEl = card.querySelector('.font-semibold');
    return nameEl ? nameEl.textContent?.trim() : null;
}

function slugify(text) {
    return (text || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
}

function closeAttendanceModal() {
    const modal =
        document.getElementById('attendanceModal') ||
        document.getElementById('medicalModal') ||
        document.getElementById('patientModal');

    if (modal) {
        modal.classList.add('hidden');
    }
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
    window.kanbanController = kanban;
});

window.KanbanController = KanbanController;
window.submitAttendance = submitAttendance;
window.downloadPrescription = downloadPrescription;
