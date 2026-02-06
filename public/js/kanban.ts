/**
 * Kanban Controller (Root)
 * Controlador genérico de drag-and-drop para boards Kanban
 */

// Tipos do Kanban Controller
interface KanbanOptions {
    board: string;
    cardSelector?: string;
    columnSelector?: string;
    cardsContainerSelector?: string;
}

interface PatientStatusMap {
    [key: string]: string;
}

declare global {
    interface Window {
        KanbanController: typeof KanbanController;
        submitAttendance: (patientId: number) => Promise<void>;
        downloadPrescription: (prescriptionId: number, patientId: number) => Promise<void>;
        kanbanController: KanbanController | null;
        PATIENT_STATUSES: PatientStatusMap;
        PATIENT_STATUS_VALUES: string[];
    }
}

class KanbanController {
    board: HTMLElement | null;
    cardSelector: string;
    columnSelector: string;
    cardsContainerSelector: string;
    draggedCard: HTMLElement | null;
    origin: HTMLElement | null;

    constructor(options: KanbanOptions) {
        this.board = document.querySelector(options.board);
        this.cardSelector = options.cardSelector || '.kanban-card';
        this.columnSelector = options.columnSelector || '.kanban-column';
        this.cardsContainerSelector = options.cardsContainerSelector || '.kanban-cards';
        this.draggedCard = null;
        this.origin = null;
    }

    init(): void {
        if (!this.board) return;

        // Bind drag events nos cards
        const cards = this.board.querySelectorAll<HTMLElement>(this.cardSelector);
        cards.forEach((card) => this.bindCard(card));

        // Bind drop events nas colunas
        const columns = this.board.querySelectorAll<HTMLElement>(this.cardsContainerSelector);
        columns.forEach((col) => this.bindColumn(col));

        this.updateCounts();
    }

    bindCard(card: HTMLElement): void {
        card.draggable = true;

        card.addEventListener('dragstart', (e: DragEvent) => {
            this.draggedCard = card;
            this.origin = card.parentElement;
            card.classList.add('opacity-50', 'scale-95');
            if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move';
            }
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('opacity-50', 'scale-95');
            this.draggedCard = null;
            this.origin = null;
        });
    }

    bindColumn(column: HTMLElement): void {
        column.addEventListener('dragover', (e: DragEvent) => {
            e.preventDefault();
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'move';
            }
            column.classList.add('bg-gray-700/30');
        });

        column.addEventListener('dragleave', () => {
            column.classList.remove('bg-gray-700/30');
        });

        column.addEventListener('drop', (e: DragEvent) => {
            e.preventDefault();
            column.classList.remove('bg-gray-700/30');

            if (this.draggedCard && column !== this.origin) {
                column.appendChild(this.draggedCard);
                this.updateCounts();

                // Dispara evento customizado
                const newStatus =
                    column.closest(this.columnSelector)?.getAttribute('data-status') || '';
                const patientId = this.draggedCard.getAttribute('data-patient-id') || '';

                const event = new CustomEvent('card-moved', {
                    detail: {
                        patientId,
                        newStatus,
                        card: this.draggedCard,
                    },
                });
                this.board?.dispatchEvent(event);
            }
        });
    }

    updateCounts(): void {
        if (!this.board) return;

        const columns = this.board.querySelectorAll<HTMLElement>(this.columnSelector);
        columns.forEach((col) => {
            const container = col.querySelector(this.cardsContainerSelector);
            const counter = col.querySelector('.kanban-count');
            if (container && counter) {
                counter.textContent = String(container.children.length);
            }
        });
    }

    findCardByPatientId(patientId: string | number): HTMLElement | null {
        if (!this.board) return null;
        return this.board.querySelector(`${this.cardSelector}[data-patient-id="${patientId}"]`);
    }

    moveCardToStatus(patientId: string | number, newStatus: string): void {
        const card = this.findCardByPatientId(patientId);
        if (!card) return;

        const targetColumn = this.board?.querySelector(
            `${this.columnSelector}[data-status="${newStatus}"] ${this.cardsContainerSelector}`
        ) as HTMLElement | null;

        if (targetColumn) {
            targetColumn.appendChild(card);
            this.updateCounts();
        }
    }

    setLoading(patientId: string | number, loading: boolean): void {
        const card = this.findCardByPatientId(patientId);
        if (!card) return;

        if (loading) {
            card.classList.add('opacity-50', 'pointer-events-none');
        } else {
            card.classList.remove('opacity-50', 'pointer-events-none');
        }
    }

    flashSuccess(patientId: string | number): void {
        const card = this.findCardByPatientId(patientId);
        if (!card) return;

        card.classList.add('ring-2', 'ring-green-500');
        setTimeout(() => {
            card.classList.remove('ring-2', 'ring-green-500');
        }, 1500);
    }
}

// Funções utilitárias globais

async function updatePatientStatus(patientId: number, newStatus: string): Promise<void> {
    try {
        const token =
            sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('accessToken');

        const response = await fetch(`/api/patients/${patientId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar status');
        }

        // Atualiza visualmente
        if (window.kanbanController) {
            window.kanbanController.moveCardToStatus(patientId, newStatus);
            window.kanbanController.flashSuccess(patientId);
        }

        showToast('Status atualizado com sucesso!', 'success');
    } catch (error) {
        showToast('Erro ao atualizar status do paciente', 'error');
    }
}

async function submitAttendance(patientId: number): Promise<void> {
    try {
        const token =
            sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('accessToken');

        const modalEl = document.getElementById('attendanceModal');
        const notesEl = document.getElementById('attendanceNotes') as HTMLTextAreaElement | null;
        const statusEl = document.getElementById('attendanceStatus') as HTMLSelectElement | null;

        const notes = notesEl?.value || '';
        const status = statusEl?.value || 'compareceu';

        const response = await fetch(`/api/patients/${patientId}/attendance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ notes, attendance_status: status }),
        });

        if (!response.ok) {
            throw new Error('Erro ao registrar atendimento');
        }

        closeAttendanceModal();
        showToast('Atendimento registrado com sucesso!', 'success');

        // Recarrega dados
        if (window.kanbanController) {
            window.kanbanController.moveCardToStatus(patientId, 'finalizado');
        }
    } catch (error) {
        showToast('Erro ao registrar atendimento', 'error');
    }
}

async function downloadPrescription(prescriptionId: number, patientId: number): Promise<void> {
    try {
        const token =
            sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('accessToken');

        const response = await fetch(
            `/api/patients/${patientId}/prescriptions/${prescriptionId}/download`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error('Erro ao baixar receita');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receita-${prescriptionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        showToast('Erro ao baixar receita', 'error');
    }
}

function getPatientName(patientId: number): string {
    const card = document.querySelector(`[data-patient-id="${patientId}"]`);
    if (!card) return 'Paciente';
    return card.querySelector('.patient-name')?.textContent || 'Paciente';
}

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
}

function closeAttendanceModal(): void {
    const modal = document.getElementById('attendanceModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    const colors: Record<string, string> = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500',
    };

    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Expor globalmente
window.KanbanController = KanbanController;
window.submitAttendance = submitAttendance;
window.downloadPrescription = downloadPrescription;
window.kanbanController = null;

export { KanbanController, updatePatientStatus, submitAttendance, downloadPrescription, showToast };
