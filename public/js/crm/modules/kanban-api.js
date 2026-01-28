/**
 * Kanban API Module - API interactions
 */

// Load leads from API
export async function loadLeads(API_URL, token, renderLeads, showLoading) {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_URL}?view=kanban`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar leads');
        }

        const leads = await response.json();
        renderLeads(leads);

    } catch (error) {
        console.error('Erro ao carregar leads:', error);
        alert('Erro ao carregar leads. Verifique sua conexão.');
    } finally {
        showLoading(false);
    }
}

// Delete lead
export async function deleteLead(id, API_URL, token, loadLeads) {
    const confirmDelete = await confirm('Tem certeza que deseja excluir este lead?');
    
    if (!confirmDelete) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao excluir lead');
        }

        alert('Lead excluído com sucesso!');
        loadLeads();

    } catch (error) {
        console.error('Erro ao excluir lead:', error);
        alert('Erro ao excluir lead');
    }
}

// Move lead to column
export async function moveToColumn(newStatus, API_URL, token, currentMoveLeadId, currentMoveLeadStatus, customPromptOptions, showLoading, closeMoveModal, loadLeads) {
    if (!currentMoveLeadId || newStatus === currentMoveLeadStatus) {
        closeMoveModal();
        return;
    }
    
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
    
    showLoading(true);
    
    try {
        const body = { status: newStatus };
        if (attendanceStatus) {
            body.attendance_status = attendanceStatus;
        }
        
        const response = await fetch(`${API_URL}/${currentMoveLeadId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Erro ao mover lead');
        }

        closeMoveModal();
        loadLeads();

    } catch (error) {
        console.error('Erro ao mover lead:', error);
        alert('Erro ao mover lead');
    } finally {
        showLoading(false);
    }
}
