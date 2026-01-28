/**
 * Patients API Module - API interactions
 */

// Load patients from API
export async function loadPatients(API_URL, token, viewingArchive = false) {
    const endpoint = viewingArchive 
        ? `${API_URL}?show_archived=true`
        : `${API_URL}?view=all`;
    
    const response = await fetch(endpoint, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Erro ao carregar pacientes');
    }
    
    return await response.json();
}

// Archive patient
export async function archivePatient(patientId, reason, API_URL, token) {
    const response = await fetch(`${API_URL}/${patientId}/archive`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ archive_reason: reason })
    });
    
    if (!response.ok) {
        throw new Error('Erro ao arquivar paciente');
    }
    
    return await response.json();
}

// Unarchive patient
export async function unarchivePatient(patientId, API_URL, token) {
    const response = await fetch(`${API_URL}/${patientId}/unarchive`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Erro ao desarquivar paciente');
    }
    
    return await response.json();
}
