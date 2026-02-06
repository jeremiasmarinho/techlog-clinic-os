/**
 * Kanban Drag and Drop Module
 */

interface PromptOption {
    value: string;
    label: string;
    icon: string;
}

type CustomPromptFn = (message: string, options: PromptOption[]) => Promise<string | null>;
type ShowNotificationFn = (msg: string, type: string) => void;
type LoadLeadsFn = () => void;

let currentDraggedCard: HTMLElement | null = null;

// Drag start handler
export function dragStart(e: DragEvent): void {
    currentDraggedCard = e.target as HTMLElement;
    (e.target as HTMLElement).classList.add('dragging');
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', (e.target as HTMLElement).innerHTML);
    }
}

// Drag end handler
export function dragEnd(e: DragEvent): void {
    (e.target as HTMLElement).classList.remove('dragging');
}

// Allow drop handler
export function allowDrop(e: DragEvent): void {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.add('drag-over');
}

// Drag leave handler
export function dragLeave(e: DragEvent): void {
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
}

// Drop handler
export async function drop(
    e: DragEvent,
    API_URL: string,
    token: string,
    customPromptOptions: CustomPromptFn,
    showNotification: ShowNotificationFn,
    loadLeads: LoadLeadsFn
): Promise<void> {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('drag-over');

    const dropZone = e.currentTarget as HTMLElement;
    // Get status from the column itself or from parent if dropped on inner div
    const newStatus =
        dropZone.dataset.status || (dropZone.parentElement as HTMLElement).dataset.status;
    const leadId = (currentDraggedCard as HTMLElement).dataset.id;
    const oldStatus = (currentDraggedCard as HTMLElement).dataset.status;

    // If same column, do nothing
    if (newStatus === oldStatus) {
        return;
    }

    // Find the correct container to append the card (the div with id="column-*")
    const columnContainer = (dropZone.querySelector('[id^="column-"]') as HTMLElement) || dropZone;

    // Move card visually
    columnContainer.appendChild(currentDraggedCard as HTMLElement);
    (currentDraggedCard as HTMLElement).dataset.status = newStatus || '';

    // If moving to "Finalizado", ask for attendance status
    let attendanceStatus: string | null = null;
    if (newStatus === 'Finalizado' || newStatus === 'finalizado') {
        const result = await customPromptOptions('Qual foi o resultado da consulta?', [
            { value: 'compareceu', label: 'Compareceu', icon: 'fas fa-check-circle' },
            { value: 'nao_compareceu', label: 'Não veio', icon: 'fas fa-times-circle' },
            { value: 'cancelado', label: 'Cancelado', icon: 'fas fa-ban' },
            { value: 'remarcado', label: 'Remarcado', icon: 'fas fa-calendar-alt' },
        ]);

        attendanceStatus = result || 'compareceu';
    }

    // Update backend
    try {
        const body: Record<string, string> = { status: newStatus || '' };
        if (attendanceStatus) {
            body.attendance_status = attendanceStatus;
        }

        const response = await fetch(`${API_URL}/${leadId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar status');
        }

        showNotification('✅ Lead movido com sucesso!', 'success');
        loadLeads();
    } catch (error) {
        console.error('Erro ao mover lead:', error);
        showNotification('❌ Erro ao mover lead', 'error');
        loadLeads();
    }
}

// Get current dragged card
export function getCurrentDraggedCard(): HTMLElement | null {
    return currentDraggedCard;
}
