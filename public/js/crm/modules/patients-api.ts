/**
 * Patients API Module - API interactions
 */

interface Patient {
    id: number;
    name: string;
    phone: string;
    type?: string;
    status: string;
    doctor?: string;
    appointment_date?: string;
    created_at: string;
    notes?: string;
}

// Load patients from API
export async function loadPatients(
    API_URL: string,
    token: string,
    viewingArchive: boolean = false
): Promise<Patient[]> {
    const endpoint = viewingArchive ? `${API_URL}?show_archived=true` : `${API_URL}?view=all`;

    const response = await fetch(endpoint, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Erro ao carregar pacientes');
    }

    return await response.json();
}

// Archive patient
export async function archivePatient(
    patientId: number,
    reason: string,
    API_URL: string,
    token: string
): Promise<unknown> {
    const response = await fetch(`${API_URL}/${patientId}/archive`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ archive_reason: reason }),
    });

    if (!response.ok) {
        throw new Error('Erro ao arquivar paciente');
    }

    return await response.json();
}

// Unarchive patient
export async function unarchivePatient(
    patientId: number,
    API_URL: string,
    token: string
): Promise<unknown> {
    const response = await fetch(`${API_URL}/${patientId}/unarchive`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Erro ao desarquivar paciente');
    }

    return await response.json();
}
