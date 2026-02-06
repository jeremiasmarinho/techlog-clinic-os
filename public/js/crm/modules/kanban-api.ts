/**
 * Kanban API Module - API interactions
 */

declare function showConfirmModal(options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    icon?: string;
    variant?: string;
}): Promise<boolean>;

interface Lead {
    id: number;
    name: string;
    phone: string;
    status: string;
    type?: string;
    attendance_status?: string;
    appointment_date?: string;
    doctor?: string;
    notes?: string;
    created_at: string;
}

interface PromptOption {
    value: string;
    label: string;
    icon: string;
}

type RenderLeadsFn = (leads: Lead[]) => void;
type ShowLoadingFn = (show: boolean) => void;
type LoadLeadsFn = () => void;
type CloseModalFn = () => void;
type CustomPromptFn = (message: string, options: PromptOption[]) => Promise<string | null>;

// Load leads from API
export async function loadLeads(
    API_URL: string,
    token: string,
    renderLeads: RenderLeadsFn,
    showLoading: ShowLoadingFn
): Promise<void> {
    try {
        showLoading(true);

        const response = await fetch(`${API_URL}?view=kanban`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar leads');
        }

        const leads: Lead[] = await response.json();
        renderLeads(leads);
    } catch (error) {
        console.error('Erro ao carregar leads:', error);
        alert('Erro ao carregar leads. Verifique sua conexão.');
    } finally {
        showLoading(false);
    }
}

// Delete lead
export async function deleteLead(
    id: number,
    API_URL: string,
    token: string,
    loadLeads: LoadLeadsFn
): Promise<void> {
    const confirmDelete = await showConfirmModal({
        title: 'Excluir Lead',
        message: 'Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        icon: 'fa-trash-alt',
        variant: 'danger',
    });

    if (!confirmDelete) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
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
export async function moveToColumn(
    newStatus: string,
    API_URL: string,
    token: string,
    currentMoveLeadId: number | null,
    currentMoveLeadStatus: string,
    customPromptOptions: CustomPromptFn,
    showLoading: ShowLoadingFn,
    closeMoveModal: CloseModalFn,
    loadLeads: LoadLeadsFn
): Promise<void> {
    if (!currentMoveLeadId || newStatus === currentMoveLeadStatus) {
        closeMoveModal();
        return;
    }

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

    showLoading(true);

    try {
        const body: Record<string, string> = { status: newStatus };
        if (attendanceStatus) {
            body.attendance_status = attendanceStatus;
        }

        const response = await fetch(`${API_URL}/${currentMoveLeadId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
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
