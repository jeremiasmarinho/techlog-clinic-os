/**
 * CRM Patients Page Logic
 * Handles advanced filtering and archiving for patients
 */

// ============================================
// Type Definitions
// ============================================
interface Patient {
    id: number;
    name: string;
    phone: string;
    type?: string;
    status: string;
    doctor?: string;
    appointment_date?: string;
    created_at?: string;
    attendance_status?: string;
    is_archived?: boolean | number;
    archive_reason?: string;
    notes?: string;
}

// External declarations
declare const API_URL: string;
declare function showNotification(message: string, type?: string): void;
declare function extractTimeFromDate(date: string): string;
declare function openWhatsAppMenu(
    button: HTMLElement,
    lead: Record<string, string>,
    container: HTMLElement
): void;

// ============================================
// Authentication Check
// ============================================
const token: string | null =
    sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('accessToken');
if (!token) {
    alert('Sessão inválida. Faça login novamente.');
    window.location.href = '/login.html';
}

// ============================================
// State Management
// ============================================
let allPatients: Patient[] = [];
let filteredPatients: Patient[] = [];
let viewingArchive: boolean = false;

// ============================================
// Initialization
// ============================================
document.addEventListener('DOMContentLoaded', (): void => {
    loadPatients();

    // Set user name if available
    const userName: string | null = sessionStorage.getItem('MEDICAL_CRM_USER');
    if (userName) {
        const userNameEl = document.getElementById('userName') as HTMLElement | null;
        if (userNameEl) {
            userNameEl.textContent = userName;
        }
    }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format text by removing underscores/hyphens and capitalizing words
 * @param text - Raw text from database (e.g., 'primeira_consulta')
 * @returns Formatted text (e.g., 'Primeira Consulta')
 */
function formatText(text: string | undefined | null): string {
    if (!text) return '';

    return text
        .replace(/[_-]/g, ' ') // Replace underscores and hyphens with spaces
        .toLowerCase() // Convert to lowercase first
        .replace(/\b\w/g, (char: string) => char.toUpperCase()); // Capitalize first letter of each word
}

/**
 * Format type display with special handling for detailed consultation types
 * @param type - Lead/patient type
 * @returns Formatted type string
 */
function formatTypeDisplay(type: string | undefined | null): string {
    if (!type) return 'Geral';

    // Handle detailed consultation format: "Consulta - Especialidade - Payment - Period - Days"
    if (type.startsWith('Consulta - ')) {
        const parts: string[] = type.split(' - ');
        const specialty: string = parts[1] || 'Consulta';
        return `📋 ${specialty}`;
    }

    // Format standard types (primeira_consulta → Primeira Consulta)
    return formatText(type);
}

/**
 * Format status display
 * @param status - Lead/patient status
 * @returns Formatted status string
 */
function formatStatusDisplay(status: string | undefined | null): string {
    if (!status) return 'Novo';

    // Special cases for better readability
    const statusMap: Record<string, string> = {
        em_atendimento: 'Em Atendimento',
        nao_compareceu: 'Não Compareceu',
        nao_veio: 'Não Veio',
    };

    const normalized: string = status.toLowerCase().trim();

    if (statusMap[normalized]) {
        return statusMap[normalized];
    }

    return formatText(status);
}

/**
 * Format phone number to (XX) XXXXX-XXXX
 */
function formatPhone(phone: string | undefined | null): string {
    if (!phone) return '-';
    const cleaned: string = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
}

// ============================================
// Helper: Get Attendance Badge (WITH STRICT RULES)
// ============================================
function getAttendanceBadge(patient: Patient): string {
    // Normalize status
    const currentStatus: string = (patient.status || '').toLowerCase().trim();
    const attendanceStatus: string = (patient.attendance_status || '').toLowerCase().trim();

    if (!attendanceStatus) return '';

    // Define outcome badges (Compareceu, Não veio, Cancelado)
    const outcomeBadges: string[] = ['compareceu', 'nao_compareceu', 'cancelado'];

    // STRICT RULE 1: Outcome badges ONLY in Finalizados
    if (outcomeBadges.includes(attendanceStatus)) {
        if (currentStatus !== 'finalizado') {
            console.log(
                `⚠️  Blocked outcome badge "${attendanceStatus}" for status "${currentStatus}" (Patient: ${patient.name})`
            );
            return ''; // DON'T show outcome badges outside Finalizados
        }
    }

    // STRICT RULE 2: Remarcado badge ONLY in Agendado/Em Atendimento
    if (attendanceStatus === 'remarcado') {
        if (currentStatus !== 'agendado' && currentStatus !== 'em_atendimento') {
            console.log(
                `⚠️  Blocked "remarcado" badge for status "${currentStatus}" (Patient: ${patient.name})`
            );
            return ''; // DON'T show remarcado in Novos/Finalizados
        }
    }

    // Badge templates (only rendered if rules pass)
    const attendanceLabels: Record<string, string> = {
        compareceu:
            '<span class="px-2 py-1 text-xs rounded bg-green-500/20 text-green-300 border border-green-500/30"><i class="fas fa-check mr-1"></i>Compareceu</span>',
        nao_compareceu:
            '<span class="px-2 py-1 text-xs rounded bg-red-500/20 text-red-300 border border-red-500/30"><i class="fas fa-times mr-1"></i>Não veio</span>',
        cancelado:
            '<span class="px-2 py-1 text-xs rounded bg-gray-500/20 text-gray-300 border border-gray-500/30"><i class="fas fa-ban mr-1"></i>Cancelado</span>',
        remarcado:
            '<span class="px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"><i class="fas fa-calendar-alt mr-1"></i>Remarcado</span>',
    };

    return attendanceLabels[attendanceStatus] || '';
}

// ============================================
// Core Functions
// ============================================

async function loadPatients(): Promise<void> {
    const loading = document.getElementById('loading') as HTMLElement | null;
    const emptyState = document.getElementById('emptyState') as HTMLElement | null;
    const tableBody = document.getElementById('patientsTableBody') as HTMLElement | null;

    if (loading) loading.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');
    if (tableBody) tableBody.innerHTML = '';

    try {
        const response: Response = await fetch(`${API_URL}?view=all`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar pacientes');
        }

        allPatients = (await response.json()) as Patient[];
        applyFilters();
    } catch (error: unknown) {
        console.error('Erro ao carregar pacientes:', error);
        showNotification('❌ Erro ao carregar pacientes. Tente novamente.', 'error');
        if (emptyState) emptyState.classList.remove('hidden');
    } finally {
        if (loading) loading.classList.add('hidden');
    }
}

function renderPatients(list: Patient[]): void {
    const tableBody = document.getElementById('patientsTableBody') as HTMLElement | null;
    const emptyState = document.getElementById('emptyState') as HTMLElement | null;

    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (list.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    console.log(`📊 Rendering ${list.length} patients with dark mode hover`);

    list.forEach((patient: Patient) => {
        const row: HTMLTableRowElement = document.createElement('tr');
        row.className =
            'hover:bg-slate-800/50 transition-colors duration-200 cursor-pointer border-b border-white/5';
        row.dataset.patientId = String(patient.id);

        // TYPE BADGE - with formatting
        const formattedType: string = formatTypeDisplay(patient.type);

        const typeColors: Record<string, string> = {
            'Primeira Consulta': 'bg-yellow-100 text-yellow-800',
            primeira_consulta: 'bg-yellow-100 text-yellow-800',
            Retorno: 'bg-indigo-100 text-indigo-800',
            retorno: 'bg-indigo-100 text-indigo-800',
            Exame: 'bg-purple-100 text-purple-800',
            exame: 'bg-purple-100 text-purple-800',
            Consulta: 'bg-blue-100 text-blue-800',
            recorrente: 'bg-pink-100 text-pink-800',
        };

        // Check if it's a detailed consultation type
        let typeColor: string = 'bg-gray-100 text-gray-800';
        if (patient.type && patient.type.startsWith('Consulta - ')) {
            typeColor = 'bg-cyan-100 text-cyan-800';
        } else {
            typeColor =
                typeColors[patient.type || ''] ||
                typeColors[formattedType] ||
                'bg-gray-100 text-gray-800';
        }

        // STATUS BADGE - with formatting
        const formattedStatus: string = formatStatusDisplay(patient.status);

        const statusColors: Record<string, string> = {
            novo: 'bg-green-100 text-green-800',
            Novo: 'bg-green-100 text-green-800',
            em_atendimento: 'bg-orange-100 text-orange-800',
            'Em Atendimento': 'bg-orange-100 text-orange-800',
            agendado: 'bg-blue-100 text-blue-800',
            Agendado: 'bg-blue-100 text-blue-800',
            finalizado: 'bg-gray-100 text-gray-800',
            Finalizado: 'bg-gray-100 text-gray-800',
        };
        const statusColor: string =
            statusColors[patient.status] ||
            statusColors[formattedStatus] ||
            'bg-gray-100 text-gray-800';

        // Date formatting
        const date: string = patient.appointment_date
            ? new Date(patient.appointment_date).toLocaleDateString('pt-BR')
            : patient.created_at
              ? new Date(patient.created_at).toLocaleDateString('pt-BR')
              : '--';

        // STRICT ATTENDANCE BADGE (using helper function)
        const attendanceBadge: string = getAttendanceBadge(patient);

        // Archive reason icon
        const archiveIcon: string = patient.archive_reason
            ? `<span class="text-yellow-400 ml-1 cursor-help" title="Motivo: ${formatText(patient.archive_reason)}" style="font-size: 16px;">📁</span>`
            : '';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-slate-100">${patient.name}${archiveIcon}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-slate-300">${formatPhone(patient.phone)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${typeColor}">
                    ${formattedType}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex flex-col gap-1">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                        ${formattedStatus}
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
                ${
                    viewingArchive
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

function updateStats(list: Patient[]): void {
    const total: number = list.length;
    const firstConsult: number = list.filter(
        (p: Patient) => p.type && (p.type.includes('Primeira') || p.type.includes('primeira'))
    ).length;
    const recurrent: number = list.filter(
        (p: Patient) =>
            p.type &&
            (p.type.includes('Retorno') ||
                p.type.includes('retorno') ||
                p.type.includes('Recorrente'))
    ).length;
    const finalized: number = list.filter((p: Patient) => p.status === 'Finalizado').length;

    // Attendance stats
    const totalAttended: number = list.filter(
        (p: Patient) => p.attendance_status === 'compareceu'
    ).length;
    const totalNoShow: number = list.filter(
        (p: Patient) => p.attendance_status === 'nao_compareceu'
    ).length;
    const totalCanceled: number = list.filter(
        (p: Patient) => p.attendance_status === 'cancelado'
    ).length;

    const totalPatientsEl = document.getElementById('totalPatients') as HTMLElement | null;
    const totalFirstConsultEl = document.getElementById('totalFirstConsult') as HTMLElement | null;
    const totalRecurrentEl = document.getElementById('totalRecurrent') as HTMLElement | null;
    const totalFinalizedEl = document.getElementById('totalFinalized') as HTMLElement | null;
    const totalAttendedEl = document.getElementById('totalAttended') as HTMLElement | null;
    const totalNoShowEl = document.getElementById('totalNoShow') as HTMLElement | null;
    const totalCanceledEl = document.getElementById('totalCanceled') as HTMLElement | null;

    if (totalPatientsEl) totalPatientsEl.textContent = String(total);
    if (totalFirstConsultEl) totalFirstConsultEl.textContent = String(firstConsult);
    if (totalRecurrentEl) totalRecurrentEl.textContent = String(recurrent);
    if (totalFinalizedEl) totalFinalizedEl.textContent = String(finalized);
    if (totalAttendedEl) totalAttendedEl.textContent = String(totalAttended);
    if (totalNoShowEl) totalNoShowEl.textContent = String(totalNoShow);
    if (totalCanceledEl) totalCanceledEl.textContent = String(totalCanceled);
}

function filterPatients(): void {
    applyFilters();
}

function applyFilters(): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
    const filterDateStart = document.getElementById('filterDateStart') as HTMLInputElement | null;
    const filterDateEnd = document.getElementById('filterDateEnd') as HTMLInputElement | null;
    const filterType = document.getElementById('filterType') as HTMLSelectElement | null;
    const filterStatus = document.getElementById('filterStatus') as HTMLSelectElement | null;
    const attendanceFilterElement = document.getElementById(
        'filterAttendance'
    ) as HTMLSelectElement | null;

    const searchTerm: string = searchInput?.value?.toLowerCase() || '';
    const dateStart: string = filterDateStart?.value || '';
    const dateEnd: string = filterDateEnd?.value || '';
    const typeFilter: string = filterType?.value || '';
    const statusFilter: string = filterStatus?.value || '';
    const attendanceFilter: string = attendanceFilterElement ? attendanceFilterElement.value : '';

    filteredPatients = allPatients.filter((patient: Patient): boolean => {
        // Archive filter
        const isArchived: boolean = patient.is_archived === 1 || patient.is_archived === true;
        if (viewingArchive && !isArchived) return false;
        if (!viewingArchive && isArchived) return false;

        // Search filter
        if (searchTerm) {
            const matchesSearch: boolean =
                patient.name.toLowerCase().includes(searchTerm) ||
                patient.phone.includes(searchTerm) ||
                (patient.type !== undefined &&
                    patient.type !== null &&
                    patient.type.toLowerCase().includes(searchTerm)) ||
                (patient.status !== undefined &&
                    patient.status !== null &&
                    patient.status.toLowerCase().includes(searchTerm));

            if (!matchesSearch) return false;
        }

        // Date filter
        if (dateStart || dateEnd) {
            const patientDate: string | undefined = patient.appointment_date || patient.created_at;
            if (!patientDate) return false;

            const date: number = new Date(patientDate).setHours(0, 0, 0, 0);

            if (dateStart) {
                const start: number = new Date(dateStart).setHours(0, 0, 0, 0);
                if (date < start) return false;
            }

            if (dateEnd) {
                const end: number = new Date(dateEnd).setHours(23, 59, 59, 999);
                if (date > end) return false;
            }
        }

        // Type filter
        if (typeFilter && patient.type !== typeFilter) {
            return false;
        }

        // Status filter
        if (statusFilter) {
            const patientStatus: string = (patient.status || '').toLowerCase();
            const filterStatusNormalized: string = statusFilter.toLowerCase();
            if (patientStatus !== filterStatusNormalized) return false;
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

function clearFilters(): void {
    const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
    const filterDateStart = document.getElementById('filterDateStart') as HTMLInputElement | null;
    const filterDateEnd = document.getElementById('filterDateEnd') as HTMLInputElement | null;
    const filterType = document.getElementById('filterType') as HTMLSelectElement | null;
    const filterStatus = document.getElementById('filterStatus') as HTMLSelectElement | null;
    const attendanceFilterElement = document.getElementById(
        'filterAttendance'
    ) as HTMLSelectElement | null;

    if (searchInput) searchInput.value = '';
    if (filterDateStart) filterDateStart.value = '';
    if (filterDateEnd) filterDateEnd.value = '';
    if (filterType) filterType.value = '';
    if (filterStatus) filterStatus.value = '';
    if (attendanceFilterElement) {
        attendanceFilterElement.value = '';
    }

    applyFilters();
}

function toggleArchiveView(): void {
    viewingArchive = !viewingArchive;

    const toggleBtn = document.getElementById('toggleArchive') as HTMLButtonElement | null;
    const tableTitle = document.getElementById('tableTitle') as HTMLElement | null;

    if (viewingArchive) {
        if (toggleBtn)
            toggleBtn.innerHTML = '<i class="fas fa-users mr-1"></i> Voltar para Pacientes Ativos';
        if (tableTitle) tableTitle.textContent = 'Arquivo Morto 🗑️';
    } else {
        if (toggleBtn)
            toggleBtn.innerHTML = '<i class="fas fa-archive mr-1"></i> Ver Arquivo Morto';
        if (tableTitle) tableTitle.textContent = 'Lista de Pacientes 📋';
    }

    applyFilters();
}

// ============================================
// Archive Modal Functions
// ============================================

let currentArchivePatientId: number | null = null;

function openArchiveModal(patientId: number): void {
    currentArchivePatientId = patientId;
    const modal = document.getElementById('archiveModal') as HTMLElement | null;
    if (modal) modal.classList.remove('hidden');
}

function closeArchiveModal(): void {
    currentArchivePatientId = null;
    const modal = document.getElementById('archiveModal') as HTMLElement | null;
    if (modal) modal.classList.add('hidden');
}

async function confirmArchive(): Promise<void> {
    if (!currentArchivePatientId) return;

    // Get selected reason
    const selectedReason = document.querySelector(
        'input[name="archiveReason"]:checked'
    ) as HTMLInputElement | null;
    if (!selectedReason) {
        alert('Selecione um motivo para arquivar.');
        return;
    }

    const archiveReason: string = selectedReason.value;

    try {
        const response: Response = await fetch(`${API_URL}/${currentArchivePatientId}/archive`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ archive_reason: archiveReason }),
        });

        if (!response.ok) {
            throw new Error('Erro ao arquivar');
        }

        showNotification('✅ Paciente arquivado com sucesso!', 'success');
        closeArchiveModal();
        await loadPatients();
    } catch (error: unknown) {
        console.error('Erro ao arquivar paciente:', error);
        showNotification('❌ Erro ao arquivar paciente', 'error');
    }
}

// ============================================
// Patient Actions
// ============================================

function openPatientWhatsApp(patientId: number, event: MouseEvent): void {
    event.stopPropagation();

    const row = document.querySelector(
        `tr[data-patient-id="${patientId}"]`
    ) as HTMLTableRowElement | null;
    if (!row) return;

    const patient: Patient | undefined = allPatients.find((p: Patient) => p.id === patientId);
    if (!patient) return;

    const leadData: Record<string, string> = {
        name: patient.name,
        phone: patient.phone.replace(/\D/g, ''),
        appointment_date: patient.appointment_date || '',
        doctor: patient.doctor || '',
    };

    openWhatsAppMenu(event.currentTarget as HTMLElement, leadData, row);
}

function viewPatientHistory(patientId: number): void {
    showNotification('🔜 Em breve: Visualização completa do histórico do paciente', 'info');
    // TODO: Future implementation - open modal with patient history
    // const modal = document.getElementById('patientModal');
    // modal.classList.remove('hidden');
}

function archivePatient(patientId: number): void {
    openArchiveModal(patientId);
}

async function _archivePatientOld(patientId: number): Promise<void> {
    const confirmed: boolean = confirm(
        'Tem certeza que deseja arquivar? O paciente sumirá da lista principal.'
    );
    if (!confirmed) return;

    try {
        const response: Response = await fetch(`${API_URL}/${patientId}/archive`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        showNotification('✅ Paciente arquivado com sucesso!', 'success');

        // Update local state
        const patient: Patient | undefined = allPatients.find((p: Patient) => p.id === patientId);
        if (patient) {
            patient.is_archived = true;
        }

        applyFilters();
    } catch (error: unknown) {
        console.error('Erro ao arquivar paciente:', error);
        showNotification('❌ Erro ao arquivar paciente. Tente novamente.', 'error');
    }
}

async function unarchivePatient(patientId: number): Promise<void> {
    try {
        const response: Response = await fetch(`${API_URL}/${patientId}/unarchive`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        showNotification('✅ Paciente restaurado com sucesso!', 'success');

        // Update local state
        const patient: Patient | undefined = allPatients.find((p: Patient) => p.id === patientId);
        if (patient) {
            patient.is_archived = false;
        }

        applyFilters();
    } catch (error: unknown) {
        console.error('Erro ao restaurar paciente:', error);
        showNotification('❌ Erro ao restaurar paciente. Tente novamente.', 'error');
    }
}

// ============================================
// Helper Functions
// ============================================

function formatPhoneHelper(phone: string | undefined | null): string {
    if (!phone) return '';
    const cleaned: string = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.substr(0, 2)}) ${cleaned.substr(2, 5)}-${cleaned.substr(7)}`;
    }
    if (cleaned.length === 10) {
        return `(${cleaned.substr(0, 2)}) ${cleaned.substr(2, 4)}-${cleaned.substr(6)}`;
    }
    return phone;
}

function showNotificationLocal(message: string, type: string = 'success'): void {
    const toast = document.getElementById('notificationToast') as HTMLElement | null;
    const messageEl = document.getElementById('notificationMessage') as HTMLElement | null;

    if (!toast || !messageEl) {
        console.log(message);
        return;
    }

    messageEl.textContent = message;

    // Update border color based on type
    const borderColors: Record<string, string> = {
        success: 'border-green-500',
        error: 'border-red-500',
        info: 'border-blue-500',
    };

    const innerDiv = toast.querySelector('div') as HTMLElement | null;
    if (innerDiv) {
        innerDiv.className = `bg-white rounded-lg shadow-lg border-l-4 ${borderColors[type] || borderColors.success} px-6 py-4 max-w-md`;
    }

    toast.classList.remove('hidden');

    setTimeout((): void => {
        toast.classList.add('hidden');
    }, 3000);
}

function logout(): void {
    sessionStorage.clear();
    window.location.href = '/login.html';
}
