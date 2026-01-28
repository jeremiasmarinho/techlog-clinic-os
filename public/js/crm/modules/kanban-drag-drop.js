/**
 * Kanban Drag and Drop Module
 */

let currentDraggedCard = null;

// Drag start handler
export function dragStart(e) {
    currentDraggedCard = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
}

// Drag end handler
export function dragEnd(e) {
    e.target.classList.remove('dragging');
}

// Allow drop handler
export function allowDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

// Drag leave handler
export function dragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

// Drop handler
export async function drop(e, API_URL, token, customPromptOptions, showNotification, loadLeads) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const dropZone = e.currentTarget;
    // Get status from the column itself or from parent if dropped on inner div
    const newStatus = dropZone.dataset.status || dropZone.parentElement.dataset.status;
    const leadId = currentDraggedCard.dataset.id;
    const oldStatus = currentDraggedCard.dataset.status;

    // If same column, do nothing
    if (newStatus === oldStatus) {
        return;
    }

    // Find the correct container to append the card (the div with id="column-*")
    const columnContainer = dropZone.querySelector('[id^="column-"]') || dropZone;
    
    // Move card visually
    columnContainer.appendChild(currentDraggedCard);
    currentDraggedCard.dataset.status = newStatus;

    // If moving to "Finalizado", ask for attendance status
    let attendanceStatus = null;
    if (newStatus === 'Finalizado' || newStatus === 'finalizado') {
        const result = await customPromptOptions(
            'Qual foi o resultado da consulta?',
            [
                { value: 'compareceu', label: 'Compareceu', icon: 'fas fa-check-circle' },
                { value: 'nao_compareceu', label: 'Não veio', icon: 'fas fa-times-circle' },
                { value: 'cancelado', label: 'Cancelado', icon: 'fas fa-ban' },
                { value: 'remarcado', label: 'Remarcado', icon: 'fas fa-calendar-alt' }
            ]
        );
        
        attendanceStatus = result || 'compareceu';
    }

    // Update backend
    try {
        const body = { status: newStatus };
        if (attendanceStatus) {
            body.attendance_status = attendanceStatus;
        }
        
        const response = await fetch(`${API_URL}/${leadId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
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
export function getCurrentDraggedCard() {
    return currentDraggedCard;
}
