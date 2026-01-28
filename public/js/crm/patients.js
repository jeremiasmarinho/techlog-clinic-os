/**
 * CRM Patients Page Logic
 * Handles advanced filtering and archiving for patients
 */

// ============================================
// Authentication Check
// ============================================
const token = sessionStorage.getItem('MEDICAL_CRM_TOKEN');
if (!token) {
    alert('Sessão inválida. Faça login novamente.');
    window.location.href = '/login.html';
}

// ============================================
// State Management
// ============================================
let allPatients = [];
let filteredPatients = [];
let viewingArchive = false;

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    loadPatients();
    
    // Set user name if available
    const userName = sessionStorage.getItem('MEDICAL_CRM_USER');
    if (userName) {
        document.getElementById('userName').textContent = userName;
    }
});

// ============================================
// Core Functions
// ============================================

async function loadPatients() {
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('emptyState');
    const tableBody = document.getElementById('patientsTableBody');
    
    loading.classList.remove('hidden');
    emptyState.classList.add('hidden');
    tableBody.innerHTML = '';
    
    try {
        const response = await fetch(`${API_URL}?view=all`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar pacientes');
        }
        
        allPatients = await response.json();
        applyFilters();
        
    } catch (error) {
        console.error('Erro ao carregar pacientes:', error);
        showNotification('❌ Erro ao carregar pacientes. Tente novamente.', 'error');
        emptyState.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
    }
}

function renderPatients(list) {
    const tableBody = document.getElementById('patientsTableBody');
    const emptyState = document.getElementById('emptyState');
    
    tableBody.innerHTML = '';
    
    if (list.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    list.forEach(patient => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition';
        row.dataset.patientId = patient.id;
        
        // Type badge color
        const typeColors = {
            'Primeira Consulta': 'bg-yellow-100 text-yellow-800',
            'Retorno': 'bg-indigo-100 text-indigo-800',
            'Exame': 'bg-purple-100 text-purple-800',
            'Consulta': 'bg-blue-100 text-blue-800'
        };
        const typeColor = typeColors[patient.type] || 'bg-gray-100 text-gray-800';
        
        // Status badge color
        const statusColors = {
            'novo': 'bg-green-100 text-green-800',
            'Em Atendimento': 'bg-orange-100 text-orange-800',
            'agendado': 'bg-blue-100 text-blue-800',
            'Finalizado': 'bg-gray-100 text-gray-800'
        };
        const statusColor = statusColors[patient.status] || 'bg-gray-100 text-gray-800';
        
        // Date formatting
        const date = patient.appointment_date 
            ? new Date(patient.appointment_date).toLocaleDateString('pt-BR')
            : patient.created_at 
            ? new Date(patient.created_at).toLocaleDateString('pt-BR')
            : '--';
        
        // Attendance status badge (if exists)
        const attendanceLabels = {
            'compareceu': '<span class="px-2 py-1 text-xs rounded bg-green-500/20 text-green-300 border border-green-500/30"><i class="fas fa-check mr-1"></i>Compareceu</span>',
            'nao_compareceu': '<span class="px-2 py-1 text-xs rounded bg-red-500/20 text-red-300 border border-red-500/30"><i class="fas fa-times mr-1"></i>Não veio</span>',
            'cancelado': '<span class="px-2 py-1 text-xs rounded bg-gray-500/20 text-gray-300 border border-gray-500/30"><i class="fas fa-ban mr-1"></i>Cancelado</span>',
            'remarcado': '<span class="px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"><i class="fas fa-calendar-alt mr-1"></i>Remarcado</span>'
        };
        const attendanceBadge = patient.attendance_status ? attendanceLabels[patient.attendance_status] || '' : '';
        
        // Archive reason icon
        const archiveIcon = patient.archive_reason ? 
            `<span class="text-yellow-400 ml-1 cursor-help" title="Motivo: ${patient.archive_reason.replace(/_/g, ' ')}" style="font-size: 16px;">📁</span>` 
            : '';
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-white">${patient.name}${archiveIcon}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-300">${formatPhone(patient.phone)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${typeColor}">
                    ${patient.type || 'Geral'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-col gap-1">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                        ${patient.status || 'novo'}
                    </span>
                    ${attendanceBadge}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                ${date}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button 
                    onclick="openPatientWhatsApp(${patient.id}, event)"
                    class="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    title="WhatsApp"
                >
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button 
                    onclick="viewPatientHistory(${patient.id})"
                    class="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    title="Ver Histórico"
                >
                    <i class="fas fa-history"></i>
                </button>
                ${viewingArchive 
                    ? `<button 
                        onclick="unarchivePatient(${patient.id})"
                        class="inline-flex items-center px-3 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                        title="Restaurar"
                    >
                        <i class="fas fa-undo"></i>
                    </button>`
                    : `<button 
                        onclick="archivePatient(${patient.id})"
                        class="inline-flex items-center px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                        title="Arquivar"
                    >
                        <i class="fas fa-archive"></i>
                    </button>`
                }
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function updateStats(list) {
    const total = list.length;
    const firstConsult = list.filter(p => 
        p.type && (p.type.includes('Primeira') || p.type.includes('primeira'))
    ).length;
    const recurrent = list.filter(p => 
        p.type && (p.type.includes('Retorno') || p.type.includes('retorno') || p.type.includes('Recorrente'))
    ).length;
    const finalized = list.filter(p => p.status === 'Finalizado').length;
    
    // Attendance stats
    const totalAttended = list.filter(p => p.attendance_status === 'compareceu').length;
    const totalNoShow = list.filter(p => p.attendance_status === 'nao_compareceu').length;
    const totalCanceled = list.filter(p => p.attendance_status === 'cancelado').length;
    
    const totalPatientsEl = document.getElementById('totalPatients');
    const totalFirstConsultEl = document.getElementById('totalFirstConsult');
    const totalRecurrentEl = document.getElementById('totalRecurrent');
    const totalFinalizedEl = document.getElementById('totalFinalized');
    const totalAttendedEl = document.getElementById('totalAttended');
    const totalNoShowEl = document.getElementById('totalNoShow');
    const totalCanceledEl = document.getElementById('totalCanceled');
    
    if (totalPatientsEl) totalPatientsEl.textContent = total;
    if (totalFirstConsultEl) totalFirstConsultEl.textContent = firstConsult;
    if (totalRecurrentEl) totalRecurrentEl.textContent = recurrent;
    if (totalFinalizedEl) totalFinalizedEl.textContent = finalized;
    if (totalAttendedEl) totalAttendedEl.textContent = totalAttended;
    if (totalNoShowEl) totalNoShowEl.textContent = totalNoShow;
    if (totalCanceledEl) totalCanceledEl.textContent = totalCanceled;
}

function filterPatients() {
    applyFilters();
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    const dateStart = document.getElementById('filterDateStart')?.value || '';
    const dateEnd = document.getElementById('filterDateEnd')?.value || '';
    const typeFilter = document.getElementById('filterType')?.value || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    const attendanceFilterElement = document.getElementById('filterAttendance');
    const attendanceFilter = attendanceFilterElement ? attendanceFilterElement.value : '';
    
    filteredPatients = allPatients.filter(patient => {
        // Archive filter
        const isArchived = patient.is_archived === 1 || patient.is_archived === true;
        if (viewingArchive && !isArchived) return false;
        if (!viewingArchive && isArchived) return false;
        
        // Search filter
        if (searchTerm) {
            const matchesSearch = 
                patient.name.toLowerCase().includes(searchTerm) ||
                patient.phone.includes(searchTerm) ||
                (patient.type && patient.type.toLowerCase().includes(searchTerm)) ||
                (patient.status && patient.status.toLowerCase().includes(searchTerm));
            
            if (!matchesSearch) return false;
        }
        
        // Date filter
        if (dateStart || dateEnd) {
            const patientDate = patient.appointment_date || patient.created_at;
            if (!patientDate) return false;
            
            const date = new Date(patientDate).setHours(0, 0, 0, 0);
            
            if (dateStart) {
                const start = new Date(dateStart).setHours(0, 0, 0, 0);
                if (date < start) return false;
            }
            
            if (dateEnd) {
                const end = new Date(dateEnd).setHours(23, 59, 59, 999);
                if (date > end) return false;
            }
        }
        
        // Type filter
        if (typeFilter && patient.type !== typeFilter) {
            return false;
        }
        
        // Status filter
        if (statusFilter && patient.status !== statusFilter) {
            return false;
        }
        
        // Attendance status filter
        if (attendanceFilter && patient.attendance_status !== attendanceFilter) {
            return false;
        }
        
        return true;
    });
    
    renderPatients(filteredPatients);
    updateStats(filteredPatients);
}
            return false;
        }
        
        // Status filter
        if (statusFilter && patient.status !== statusFilter) {
            return false;
        }
        
        return true;
    });
    
    renderPatients(filteredPatients);
    updateStats(filteredPatients);
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterDateStart').value = '';
    document.getElementById('filterDateEnd').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterStatus').value = '';
    const attendanceFilterElement = document.getElementById('filterAttendance');
    if (attendanceFilterElement) {
        attendanceFilterElement.value = '';
    }
    
    applyFilters();
}

function toggleArchiveView() {
    viewingArchive = !viewingArchive;
    
    const toggleBtn = document.getElementById('toggleArchive');
    const tableTitle = document.getElementById('tableTitle');
    
    if (viewingArchive) {
        toggleBtn.innerHTML = '<i class="fas fa-users mr-1"></i> Voltar para Pacientes Ativos';
        tableTitle.textContent = 'Arquivo Morto 🗑️';
    } else {
        toggleBtn.innerHTML = '<i class="fas fa-archive mr-1"></i> Ver Arquivo Morto';
        tableTitle.textContent = 'Lista de Pacientes 📋';
    }
    
    applyFilters();
}

// ============================================
// Archive Modal Functions
// ============================================

let currentArchivePatientId = null;

function openArchiveModal(patientId) {
    currentArchivePatientId = patientId;
    const modal = document.getElementById('archiveModal');
    modal.classList.remove('hidden');
}

function closeArchiveModal() {
    currentArchivePatientId = null;
    const modal = document.getElementById('archiveModal');
    modal.classList.add('hidden');
}

async function confirmArchive() {
    if (!currentArchivePatientId) return;
    
    // Get selected reason
    const selectedReason = document.querySelector('input[name="archiveReason"]:checked');
    if (!selectedReason) {
        alert('Selecione um motivo para arquivar.');
        return;
    }
    
    const archiveReason = selectedReason.value;
    
    try {
        const response = await fetch(`${API_URL}/${currentArchivePatientId}/archive`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ archive_reason: archiveReason })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao arquivar');
        }
        
        showNotification('✅ Paciente arquivado com sucesso!', 'success');
        closeArchiveModal();
        await loadPatients();
        
    } catch (error) {
        console.error('Erro ao arquivar paciente:', error);
        showNotification('❌ Erro ao arquivar paciente', 'error');
    }
}

// ============================================
// Patient Actions
// ============================================

function openPatientWhatsApp(patientId, event) {
    event.stopPropagation();
    
    const row = document.querySelector(`tr[data-patient-id="${patientId}"]`);
    if (!row) return;
    
    const patient = allPatients.find(p => p.id === patientId);
    if (!patient) return;
    
    const leadData = {
        name: patient.name,
        phone: patient.phone.replace(/\D/g, ''),
        appointment_date: patient.appointment_date,
        doctor: patient.doctor
    };
    
    openWhatsAppMenu(event.currentTarget, leadData, row);
}

function viewPatientHistory(patientId) {
    showNotification('🔜 Em breve: Visualização completa do histórico do paciente', 'info');
    // TODO: Future implementation - open modal with patient history
    // const modal = document.getElementById('patientModal');
    // modal.classList.remove('hidden');
}

function archivePatient(patientId) {
    openArchiveModal(patientId);
}

async function _archivePatientOld(patientId) {
    const confirmed = confirm('Tem certeza que deseja arquivar? O paciente sumirá da lista principal.');
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_URL}/${patientId}/archive`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        showNotification('✅ Paciente arquivado com sucesso!', 'success');
        
        // Update local state
        const patient = allPatients.find(p => p.id === patientId);
        if (patient) {
            patient.is_archived = true;
        }
        
        applyFilters();
        
    } catch (error) {
        console.error('Erro ao arquivar paciente:', error);
        showNotification('❌ Erro ao arquivar paciente. Tente novamente.', 'error');
    }
}

async function unarchivePatient(patientId) {
    try {
        const response = await fetch(`${API_URL}/${patientId}/unarchive`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        showNotification('✅ Paciente restaurado com sucesso!', 'success');
        
        // Update local state
        const patient = allPatients.find(p => p.id === patientId);
        if (patient) {
            patient.is_archived = false;
        }
        
        applyFilters();
        
    } catch (error) {
        console.error('Erro ao restaurar paciente:', error);
        showNotification('❌ Erro ao restaurar paciente. Tente novamente.', 'error');
    }
}

// ============================================
// Helper Functions
// ============================================

function formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.substr(0, 2)}) ${cleaned.substr(2, 5)}-${cleaned.substr(7)}`;
    }
    if (cleaned.length === 10) {
        return `(${cleaned.substr(0, 2)}) ${cleaned.substr(2, 4)}-${cleaned.substr(6)}`;
    }
    return phone;
}

function showNotification(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    const messageEl = document.getElementById('notificationMessage');
    
    if (!toast || !messageEl) {
        console.log(message);
        return;
    }
    
    messageEl.textContent = message;
    
    // Update border color based on type
    const borderColors = {
        success: 'border-green-500',
        error: 'border-red-500',
        info: 'border-blue-500'
    };
    
    toast.querySelector('div').className = 
        `bg-white rounded-lg shadow-lg border-l-4 ${borderColors[type] || borderColors.success} px-6 py-4 max-w-md`;
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function logout() {
    sessionStorage.clear();
    window.location.href = '/login.html';
}
