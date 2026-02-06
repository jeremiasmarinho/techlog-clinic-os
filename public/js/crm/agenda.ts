/**
 * Agenda - Advanced Daily Appointments View
 * Features: JSON parsing, financial badges, CRUD actions, strict badge rules
 * NOTE: View modal and CRUD functions are now in appointments-service.js
 */

// Import centralized formatters
import { formatTime, formatDateTime } from '../utils/formatters.ts';

// ============================================
// INTERFACES
// ============================================

interface AgendaAppointment {
    id: number;
    name: string;
    phone: string;
    type?: string;
    status: string;
    attendance_status?: string;
    appointment_date?: string;
    start_time?: string;
    doctor?: string;
    notes?: string;
    patient_name?: string;
    patient_phone?: string;
    patient_id?: number;
    appointment_id?: number;
}

interface ParsedDescription {
    cleanText: string;
    financial: FinancialData | null;
}

interface FinancialData {
    paymentType: string | null;
    insuranceName: string | null;
    value: string | null;
}

interface TypeMapEntry {
    icon: string;
    text: string;
    color: string;
}

interface ClinicSettings {
    settings?: {
        insurancePlans?: string[];
    };
}

interface UpdatePayload {
    name: string;
    phone: string;
    appointment_date: string;
    doctor: string | null;
    type: string | null;
    status: string;
    notes: string;
}

interface CheckoutPayload {
    type: string;
    amount: number;
    category: string;
    payment_method: string;
    status: string;
    due_date: null;
    paid_at: string;
    patient_id: number | null;
    appointment_id: number | null;
}

// ============================================
// EXTERNAL GLOBALS
// ============================================

declare function getWhatsAppTemplates(
    lead: Record<string, unknown>
): { confirmar?: { url: string } } | null;
declare function showNotification(message: string, type?: string): void;
declare function showToast(options: {
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}): void;
declare function showConfirmModal(options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    icon?: string;
}): Promise<boolean>;

declare global {
    interface Window {
        saveEdit: typeof saveEdit;
        editAppointment: typeof editAppointment;
        markAttendance: typeof markAttendance;
        openWhatsAppAgenda: typeof openWhatsAppAgenda;
        openPaymentCheckout: typeof openPaymentCheckout;
        showEditForm: typeof showEditForm;
        openWhatsAppConfirmation: typeof openWhatsAppConfirmation;
    }
}

// Ensure API_URL is available in module scope
const API_URL: string = window.API_URL || '/api/leads';
const APPOINTMENTS_API_URL = '/api/appointments'; // For CRUD operations on appointments

// ============================================
// Authentication Check
// ============================================
const token: string | null =
    sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('accessToken');
if (!token) {
    showToast({ message: 'Sessão inválida. Faça login novamente.', type: 'warning' });
    window.location.href = '/login.html';
}

// Store appointments globally for WhatsApp menu
let currentAppointments: AgendaAppointment[] = [];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Parse description/notes field to extract JSON financial data and clean text
 */
function parseDescription(text: string | undefined | null): ParsedDescription {
    if (!text) return { cleanText: '', financial: null };

    try {
        // Try to extract JSON from notes - flexible regex to handle spaces
        const jsonMatch = text.match(/\{\s*"financial"\s*:\s*\{[^{}]*\}\s*\}/);

        if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[0]) as { financial?: Partial<FinancialData> };
            const financial = jsonData.financial || {};

            // Remove JSON from text to get clean observations
            const cleanText = text.replace(jsonMatch[0], '').trim();

            console.log('📊 Parsed financial data:', financial);

            return {
                cleanText: cleanText || '',
                financial: {
                    paymentType: financial.paymentType || null,
                    insuranceName: financial.insuranceName || null,
                    value: financial.value || null,
                },
            };
        }

        // Also try to match JSON at the end of text (common pattern)
        const endJsonMatch = text.match(/\{[^{}]*"financial"[^{}]*\{[^{}]*\}[^{}]*\}$/);
        if (endJsonMatch) {
            try {
                const jsonData = JSON.parse(endJsonMatch[0]) as {
                    financial?: Partial<FinancialData>;
                };
                const financial = jsonData.financial || {};
                const cleanText = text.replace(endJsonMatch[0], '').trim();

                return {
                    cleanText: cleanText || '',
                    financial: {
                        paymentType: financial.paymentType || null,
                        insuranceName: financial.insuranceName || null,
                        value: financial.value || null,
                    },
                };
            } catch (_e: unknown) {
                // Continue to next pattern
            }
        }

        // No JSON found, return original text
        return { cleanText: text, financial: null };
    } catch (error: unknown) {
        console.warn('⚠️ Failed to parse description JSON:', error);
        return { cleanText: text, financial: null };
    }
}

/**
 * Format currency to Brazilian Real (R$ X.XXX,XX)
 */
function formatCurrency(value: string | number | null | undefined): string {
    if (!value) return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue === 0) return '';
    return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get financial badges HTML from parsed financial data
 */
function getFinancialBadges(financial: FinancialData | null): string {
    if (!financial) return '';

    let badges = '';

    // Payment type badge
    if (financial.paymentType) {
        const typeMap: Record<string, TypeMapEntry> = {
            particular: { icon: '💵', text: 'Particular', color: 'emerald' },
            plano: { icon: '🏥', text: financial.insuranceName || 'Plano', color: 'blue' },
            retorno: { icon: '🔄', text: 'Retorno', color: 'purple' },
        };

        const type: TypeMapEntry = typeMap[financial.paymentType] || {
            icon: '💳',
            text: financial.paymentType,
            color: 'gray',
        };

        badges += `
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-${type.color}-500/20 text-${type.color}-300 border border-${type.color}-500/30">
                ${type.icon} ${type.text}
            </span>
        `;
    }

    // Value badge
    if (financial.value) {
        const formattedValue = formatCurrency(financial.value);
        if (formattedValue) {
            badges += `
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                    💰 ${formattedValue}
                </span>
            `;
        }
    }

    return badges;
}

/**
 * Get attendance badge with STRICT RULES (same as Kanban/Patients)
 */
function getAttendanceBadge(appointment: AgendaAppointment): string {
    const currentStatus = (appointment.status || '').toLowerCase().trim();
    const attendanceStatus = (appointment.attendance_status || '').toLowerCase().trim();

    if (!attendanceStatus) return '';

    // Define outcome badges
    const outcomeBadges = ['compareceu', 'nao_compareceu', 'cancelado'];

    // STRICT RULE 1: Outcome badges ONLY in Finalizados
    if (outcomeBadges.includes(attendanceStatus)) {
        if (currentStatus !== 'finalizado') {
            console.log(
                `⚠️  Blocked outcome badge "${attendanceStatus}" for status "${currentStatus}"`
            );
            return '';
        }
    }

    // STRICT RULE 2: Remarcado badge ONLY in Agendado/Em Atendimento
    if (attendanceStatus === 'remarcado') {
        if (currentStatus !== 'agendado' && currentStatus !== 'em_atendimento') {
            console.log(`⚠️  Blocked "remarcado" badge for status "${currentStatus}"`);
            return '';
        }
    }

    // Badge templates
    const attendanceLabels: Record<string, string> = {
        compareceu:
            '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30"><i class="fas fa-check mr-1"></i>Compareceu</span>',
        nao_compareceu:
            '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30"><i class="fas fa-times mr-1"></i>Não veio</span>',
        cancelado:
            '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-300 border border-gray-500/30"><i class="fas fa-ban mr-1"></i>Cancelado</span>',
        remarcado:
            '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"><i class="fas fa-calendar-alt mr-1"></i>Remarcado</span>',
    };

    return attendanceLabels[attendanceStatus] || '';
}

/**
 * Format phone number
 */
function formatPhone(phone: string | undefined | null): string {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', (): void => {
    // Set today as default date
    const today = new Date().toISOString().split('T')[0];
    const dateFilter = document.getElementById('dateFilter') as HTMLInputElement | null;
    if (dateFilter) dateFilter.value = today;

    loadDoctors();
    loadAgenda();
});

// ============================================
// LOAD DOCTORS FOR FILTER
// ============================================

async function loadDoctors(): Promise<void> {
    try {
        const response = await fetch(`${API_URL}?view=all`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error('Erro ao carregar médicos');

        const leads = (await response.json()) as AgendaAppointment[];

        // Extract unique doctors
        const doctors = [...new Set(leads.map((l) => l.doctor).filter((d): d is string => !!d))];

        const select = document.getElementById('doctorFilter') as HTMLSelectElement | null;
        if (!select) return;

        doctors.forEach((doctor: string) => {
            const option = document.createElement('option');
            option.value = doctor;
            option.textContent = doctor;
            select.appendChild(option);
        });
    } catch (error: unknown) {
        console.error('Erro ao carregar médicos:', error);
    }
}

// ============================================
// LOAD AGENDA (Simplified - Calendar handles display)
// ============================================

async function loadAgenda(): Promise<void> {
    const loading = document.getElementById('loading');

    loading?.classList.remove('hidden');

    try {
        const dateEl = document.getElementById('dateFilter') as HTMLInputElement | null;
        const doctorEl = document.getElementById('doctorFilter') as HTMLSelectElement | null;
        const date = dateEl?.value;
        const doctor = doctorEl?.value;

        let url = `${API_URL}?view=agenda&date=${date}`;
        if (doctor) url += `&doctor=${encodeURIComponent(doctor)}`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error('Erro ao carregar agenda');

        const appointments = (await response.json()) as AgendaAppointment[];
        currentAppointments = appointments;

        console.log(`✅ Loaded ${appointments.length} appointments`);

        // Refresh calendar if exists
        if (window.calendar && typeof window.calendar.refetchEvents === 'function') {
            window.calendar.refetchEvents();
        }
    } catch (error: unknown) {
        console.error('Erro ao carregar agenda:', error);
    } finally {
        loading?.classList.add('hidden');
    }
}

// ============================================
// CREATE APPOINTMENT CARD (ADVANCED LAYOUT)
// ============================================

function createAppointmentCard(appointment: AgendaAppointment): HTMLDivElement {
    const card = document.createElement('div');
    card.className =
        'glass-card rounded-xl p-5 bg-slate-800/50 hover:bg-slate-700 transition-colors duration-200 border border-white/10 cursor-pointer';
    card.dataset.appointmentId = String(appointment.id);

    // Parse description to extract financial data and clean text
    const parsed = parseDescription(appointment.notes);
    const financialBadges = getFinancialBadges(parsed.financial);
    const cleanNotes = parsed.cleanText;

    // Format time (HH:mm without seconds)
    const time = appointment.appointment_date ? formatTime(appointment.appointment_date) : '--:--';

    // Get attendance badge (with strict rules)
    const attendanceBadge = getAttendanceBadge(appointment);

    // Type badge
    let typeBadge = '';
    if (appointment.type) {
        if (appointment.type.startsWith('Consulta - ')) {
            const parts = appointment.type.split(' - ');
            const specialty = parts[1] || 'Consulta';
            typeBadge = `<span class="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">📋 ${specialty}</span>`;
        } else {
            const typeMap: Record<string, string> = {
                primeira_consulta: '⭐ Primeira Consulta',
                'Primeira Consulta': '⭐ Primeira Consulta',
                retorno: '🔄 Retorno',
                Retorno: '🔄 Retorno',
                exame: '🔬 Exame',
                Exame: '🔬 Exame',
                Consulta: '🩺 Consulta',
            };
            const typeText = typeMap[appointment.type] || appointment.type;
            typeBadge = `<span class="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">${typeText}</span>`;
        }
    }

    // Show quick action buttons only if not finalized yet
    const showQuickActions: boolean =
        !appointment.attendance_status &&
        (appointment.status === 'agendado' || appointment.status === 'em_atendimento');

    card.innerHTML = `
        <!-- HEADER ROW: Time | Name | Badges -->
        <div class="flex flex-col md:flex-row md:items-start gap-4 mb-4">
            <!-- Time (Large) -->
            <div class="text-4xl font-bold text-cyan-400 min-w-[100px]">
                ${time}
            </div>
            
            <!-- Patient Info -->
            <div class="flex-1">
                <h3 class="text-xl font-semibold text-slate-100 mb-2">${appointment.name}</h3>
                
                <!-- Contact & Doctor Row -->
                <div class="flex flex-wrap items-center gap-3 mb-2">
                    <span class="text-sm text-slate-300 flex items-center">
                        <i class="fas fa-phone mr-2 text-cyan-400"></i>
                        ${formatPhone(appointment.phone)}
                    </span>
                    ${
                        appointment.doctor
                            ? `
                        <span class="text-sm text-gray-300 flex items-center">
                            <i class="fas fa-user-md mr-2 text-purple-400"></i>
                            ${appointment.doctor}
                        </span>
                    `
                            : ''
                    }
                </div>
                
                <!-- Badges Row: Type + Attendance + Financial -->
                <div class="flex flex-wrap items-center gap-2">
                    ${typeBadge}
                    ${attendanceBadge}
                    ${financialBadges}
                </div>
            </div>
            
            <!-- ACTION BUTTONS (Right Side) -->
            <div class="flex items-center gap-2 flex-wrap">
                <!-- WhatsApp -->
                <button 
                    onclick="openWhatsAppAgenda(${appointment.id})"
                    class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center shadow-lg hover:shadow-green-500/50"
                    title="WhatsApp">
                    <i class="fab fa-whatsapp mr-2"></i>
                    <span class="hidden md:inline">WhatsApp</span>
                </button>
                
                <!-- Edit Button -->
                <button 
                    onclick="openEditModal(${appointment.id})"
                    class="bg-blue-500/20 hover:bg-blue-500 text-blue-300 hover:text-white px-4 py-2 rounded-lg transition-all border border-blue-500/30 hover:border-blue-500"
                    title="Editar Agendamento">
                    <i class="fas fa-edit"></i>
                </button>
                
                <!-- Archive Button -->
                <button 
                    onclick="archiveAppointment(${appointment.id})"
                    class="bg-gray-500/20 hover:bg-gray-600 text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-all border border-gray-500/30 hover:border-gray-600"
                    title="Arquivar">
                    <i class="fas fa-archive"></i>
                </button>
                
                <!-- Delete Button -->
                <button 
                    onclick="deleteAppointment(${appointment.id})"
                    class="bg-red-500/20 hover:bg-red-600 text-red-300 hover:text-white px-4 py-2 rounded-lg transition-all border border-red-500/30 hover:border-red-600"
                    title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        
        <!-- NOTES ROW (Clean Text) -->
        ${
            cleanNotes
                ? `
            <div class="bg-gray-800/50 rounded-lg p-3 mb-3">
                <p class="text-sm text-gray-300 flex items-start">
                    <i class="fas fa-sticky-note mr-2 text-yellow-400 mt-0.5"></i>
                    <span>${cleanNotes}</span>
                </p>
            </div>
        `
                : ''
        }
        
        <!-- QUICK ATTENDANCE ACTIONS (Only if not finalized) -->
        ${
            showQuickActions
                ? `
            <div class="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
                <span class="text-xs text-gray-400 font-medium mr-2">
                    <i class="fas fa-clipboard-check mr-1"></i>
                    Marcar Resultado:
                </span>
                <button 
                    onclick="markAttendance(${appointment.id}, 'compareceu')"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600/80 hover:bg-green-600 text-white transition-all flex items-center shadow-sm hover:shadow-green-500/50">
                    <i class="fas fa-check mr-1"></i> Compareceu
                </button>
                <button 
                    onclick="markAttendance(${appointment.id}, 'nao_compareceu')"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-all flex items-center shadow-sm hover:shadow-red-500/50">
                    <i class="fas fa-times mr-1"></i> Não veio
                </button>
                <button 
                    onclick="markAttendance(${appointment.id}, 'cancelado')"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-600/80 hover:bg-gray-600 text-white transition-all flex items-center shadow-sm hover:shadow-gray-500/50">
                    <i class="fas fa-ban mr-1"></i> Cancelou
                </button>
            </div>
        `
                : ''
        }
    `;

    return card;
}

// ============================================
// CRUD ACTIONS
// ============================================

/**
 * Edit Appointment (DEPRECATED - Now uses openEditModal)
 * Kept for backward compatibility
 */
async function editAppointment(appointmentId: number): Promise<void> {
    // Simply redirect to new modal-based edit
    openEditModal(appointmentId);
}

/**
 * Archive Appointment
 */
async function archiveAppointment(appointmentId: number | string): Promise<void> {
    const confirmed = await showConfirmModal({
        title: 'Arquivar agendamento',
        message: 'Arquivar este agendamento?',
        confirmText: 'Arquivar',
        cancelText: 'Cancelar',
        variant: 'warning',
        icon: 'fa-box-archive',
    });
    if (!confirmed) return;

    try {
        const response = await fetch(`${APPOINTMENTS_API_URL}/${appointmentId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: 'cancelled' }),
        });

        if (!response.ok) throw new Error('Erro ao arquivar');

        showToast({ message: 'Agendamento arquivado com sucesso!', type: 'success' });
        location.reload();
    } catch (error: unknown) {
        console.error('Erro ao arquivar:', error);
        showToast({ message: 'Erro ao arquivar agendamento', type: 'error' });
    }
}

/**
 * Delete Appointment
 */
async function deleteAppointment(appointmentId: number | string): Promise<void> {
    const confirmed = await showConfirmModal({
        title: 'Excluir agendamento',
        message:
            'Tem certeza que deseja EXCLUIR este agendamento? Esta ação não pode ser desfeita!',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        variant: 'danger',
        icon: 'fa-trash',
    });
    if (!confirmed) return;

    try {
        const response = await fetch(`${APPOINTMENTS_API_URL}/${appointmentId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error('Erro ao excluir');

        showToast({ message: 'Agendamento excluído com sucesso!', type: 'success' });
        location.reload();
    } catch (error: unknown) {
        console.error('Erro ao excluir:', error);
        showToast({ message: 'Erro ao excluir agendamento', type: 'error' });
    }
}

/**
 * Mark attendance result
 */
async function markAttendance(appointmentId: number, attendanceStatus: string): Promise<void> {
    try {
        const response = await fetch(`${APPOINTMENTS_API_URL}/${appointmentId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                attendance_status: attendanceStatus,
                status: 'finalizado',
            }),
        });

        if (!response.ok) throw new Error('Erro ao atualizar status');

        const labels: Record<string, string> = {
            compareceu: 'Presença confirmada!',
            nao_compareceu: 'Falta registrada.',
            cancelado: 'Cancelamento registrado.',
        };

        showToast({
            message: `${labels[attendanceStatus] || 'Status atualizado!'}`,
            type: 'success',
        });
        loadAgenda();
    } catch (error: unknown) {
        console.error('Erro ao marcar presença:', error);
        showToast({ message: 'Erro ao atualizar status', type: 'error' });
    }
}

// ============================================
// WHATSAPP INTEGRATION
// ============================================

function openWhatsAppAgenda(appointmentId: number): void {
    const appointment = currentAppointments.find((a) => a.id === appointmentId);
    if (!appointment) return;

    const phone = appointment.phone.replace(/\D/g, '');
    const message = `Olá *${appointment.name}*! 👋\n\nPassando para confirmar sua consulta${appointment.appointment_date ? ` agendada para *${new Date(appointment.appointment_date).toLocaleString('pt-BR')}*` : ''}.\n\nTudo confirmado?`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

// ============================================
// EDIT MODAL FUNCTIONS (NEW - SIMPLIFIED SINGLE MODAL)
// ============================================

let currentModalAppointment: AgendaAppointment | null = null;

function showEditForm(): void {
    const editForm = document.getElementById('editForm');
    const checkoutForm = document.getElementById('checkoutForm');

    if (editForm) editForm.classList.remove('hidden');
    if (checkoutForm) checkoutForm.classList.add('hidden');
}

function showCheckoutForm(): void {
    const editForm = document.getElementById('editForm');
    const checkoutForm = document.getElementById('checkoutForm');

    if (editForm) editForm.classList.add('hidden');
    if (checkoutForm) checkoutForm.classList.remove('hidden');
}

/**
 * Open Edit Modal with appointment data
 * Now fetches from API if not found locally
 */
async function openEditModal(appointmentId: number | string): Promise<void> {
    console.log('🔧 openEditModal called with ID:', appointmentId);

    let appointment: AgendaAppointment | undefined = currentAppointments.find(
        (a) =>
            a.id === appointmentId ||
            a.id === Number(appointmentId) ||
            String(a.id) === String(appointmentId)
    );

    // If not found locally, fetch from API
    if (!appointment) {
        console.log('📡 Appointment not in local cache, fetching from API...');
        try {
            const response = await fetch(`${APPOINTMENTS_API_URL}/${appointmentId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                showToast({ message: 'Agendamento não encontrado', type: 'error' });
                return;
            }

            const data = (await response.json()) as AgendaAppointment;
            // Map API response to expected format
            data.name = data.patient_name || '';
            data.phone = data.patient_phone || '';
            appointment = data;
        } catch (error: unknown) {
            console.error('Erro ao buscar agendamento:', error);
            showToast({ message: 'Erro ao carregar dados do agendamento', type: 'error' });
            return;
        }
    }

    currentModalAppointment = appointment;
    showEditForm();

    console.log('📝 Opening edit modal for appointment:', appointment);

    // Populate form fields - with null checks
    const editIdEl = document.getElementById('editId') as HTMLInputElement | null;
    const editNameEl = document.getElementById('editName') as HTMLInputElement | null;
    const editPhoneEl = document.getElementById('editPhone') as HTMLInputElement | null;
    const editDateEl = document.getElementById('editDate') as HTMLInputElement | null;

    if (editIdEl) editIdEl.value = String(appointment.id);
    if (editNameEl) editNameEl.value = appointment.name || appointment.patient_name || '';
    if (editPhoneEl) editPhoneEl.value = appointment.phone || appointment.patient_phone || '';

    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
    const appointmentDateValue = appointment.appointment_date || appointment.start_time;
    if (appointmentDateValue && editDateEl) {
        const date = new Date(appointmentDateValue);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
        editDateEl.value = formattedDate;
    } else if (editDateEl) {
        editDateEl.value = '';
    }

    // Set doctor (populate doctors select if not done yet)
    populateDoctorsInModal();
    const editDoctorEl = document.getElementById('editDoctor') as HTMLSelectElement | null;
    if (editDoctorEl) editDoctorEl.value = appointment.doctor || '';

    // Set type
    const editTypeEl = document.getElementById('editType') as HTMLSelectElement | null;
    if (editTypeEl) editTypeEl.value = appointment.type || '';

    // Set status
    const editStatusEl = document.getElementById('editStatus') as HTMLSelectElement | null;
    if (editStatusEl) editStatusEl.value = appointment.status || 'agendado';

    // Parse financial data from notes
    const { cleanText, financial } = parseDescription(appointment.notes);

    // Set financial fields
    if (financial) {
        if (financial.value) {
            // Format value as R$ 250,00
            const valueNumber = parseFloat(financial.value);
            const editValueEl = document.getElementById('editValue') as HTMLInputElement | null;
            if (!isNaN(valueNumber) && editValueEl) {
                editValueEl.value = `R$ ${valueNumber.toFixed(2).replace('.', ',')}`;
            }
        }
        if (financial.paymentType || financial.insuranceName) {
            // Populate insurance select
            populateInsuranceInModal();
            const editInsuranceEl = document.getElementById(
                'editInsurance'
            ) as HTMLSelectElement | null;
            if (editInsuranceEl) {
                editInsuranceEl.value = financial.insuranceName || financial.paymentType || '';
            }
        }
    }

    // Set clean notes (without JSON)
    const editNotesEl = document.getElementById('editNotes') as HTMLTextAreaElement | null;
    if (editNotesEl) editNotesEl.value = cleanText || '';

    // Show modal
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

/**
 * Close Edit Modal
 */
function closeEditModal(): void {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    currentModalAppointment = null;

    // Reset form
    const editForm = document.getElementById('editForm') as HTMLFormElement | null;
    if (editForm) editForm.reset();
    const checkoutFormEl = document.getElementById('checkoutForm') as HTMLFormElement | null;
    if (checkoutFormEl) checkoutFormEl.reset();
    showEditForm();
}

function openPaymentCheckout(): void {
    if (!currentModalAppointment) {
        showToast({ message: 'Nenhum agendamento selecionado', type: 'warning' });
        return;
    }

    const { financial } = parseDescription(currentModalAppointment.notes);
    const checkoutAmount = document.getElementById('checkoutAmount') as HTMLInputElement | null;
    const checkoutPaymentMethod = document.getElementById(
        'checkoutPaymentMethod'
    ) as HTMLSelectElement | null;

    if (checkoutAmount) {
        if (financial?.value) {
            const valueNumber = parseFloat(financial.value);
            if (!isNaN(valueNumber)) {
                checkoutAmount.value = `R$ ${valueNumber.toFixed(2).replace('.', ',')}`;
            }
        } else {
            checkoutAmount.value = '';
        }
    }

    if (checkoutPaymentMethod) {
        checkoutPaymentMethod.value = 'pix';
    }

    showCheckoutForm();
}

async function openWhatsAppConfirmation(): Promise<void> {
    if (!currentModalAppointment) {
        showToast({ message: 'Nenhum agendamento selecionado', type: 'warning' });
        return;
    }

    if (!currentModalAppointment.phone) {
        showToast({ message: 'Telefone do paciente não encontrado', type: 'warning' });
        return;
    }

    const templates: { confirmar?: { url: string } } | null =
        typeof getWhatsAppTemplates === 'function'
            ? getWhatsAppTemplates(currentModalAppointment as unknown as Record<string, unknown>)
            : null;

    const url: string =
        templates?.confirmar?.url ||
        `https://wa.me/55${currentModalAppointment.phone.replace(/\D/g, '')}`;
    window.open(url, '_blank');

    const confirmed = await showConfirmModal({
        title: 'Confirmar presença',
        message: 'O paciente confirmou?',
        confirmText: 'Sim, confirmou',
        cancelText: 'Cancelar',
        variant: 'info',
        icon: 'fa-circle-check',
    });
    if (!confirmed) return;

    try {
        const response = await fetch(`${APPOINTMENTS_API_URL}/${currentModalAppointment.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: 'confirmed' }),
        });

        if (!response.ok) {
            const errorData = (await response.json()) as { error?: string };
            throw new Error(errorData.error || 'Erro ao confirmar agendamento');
        }

        showToast({ message: 'Agendamento confirmado com sucesso!', type: 'success' });
        location.reload();
    } catch (error: unknown) {
        console.error('❌ Error confirming appointment:', error);
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        showToast({ message: `Erro ao confirmar: ${message}`, type: 'error' });
    }
}

function markAppointmentPaid(appointmentId: number): void {
    const card = document.querySelector(`[data-appointment-id="${appointmentId}"]`);
    if (!card) return;

    card.classList.add('border-emerald-400/60', 'bg-emerald-500/10');
}

/**
 * Save edited appointment
 */
async function saveEdit(event: Event): Promise<void> {
    event.preventDefault();

    const appointmentId = (document.getElementById('editId') as HTMLInputElement).value;
    const name = (document.getElementById('editName') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('editPhone') as HTMLInputElement).value.trim();
    const appointmentDate = (document.getElementById('editDate') as HTMLInputElement).value;
    const doctor = (document.getElementById('editDoctor') as HTMLSelectElement).value;
    const type = (document.getElementById('editType') as HTMLSelectElement).value;
    const status = (document.getElementById('editStatus') as HTMLSelectElement).value;
    const valueRaw = (document.getElementById('editValue') as HTMLInputElement).value.replace(
        /\D/g,
        ''
    ); // Remove non-digits
    const insurance = (document.getElementById('editInsurance') as HTMLSelectElement).value;
    const notes = (document.getElementById('editNotes') as HTMLTextAreaElement).value.trim();

    // Validate required fields
    if (!name || !phone || !appointmentDate) {
        showToast({ message: 'Preencha todos os campos obrigatórios', type: 'warning' });
        return;
    }

    // Build financial data object
    const financialData: FinancialData = {
        value: valueRaw ? (parseInt(valueRaw) / 100).toFixed(2) : null,
        paymentType: insurance || 'Particular',
        insuranceName: insurance || null,
    };

    // Encode financial data into notes
    const finalNotes = encodeFinancialData(notes, financialData);

    // Build update payload
    const updateData: UpdatePayload = {
        name,
        phone,
        appointment_date: new Date(appointmentDate).toISOString(),
        doctor: doctor || null,
        type: type || null,
        status,
        notes: finalNotes,
    };

    console.log('💾 Saving appointment:', updateData);

    try {
        const response = await fetch(`${APPOINTMENTS_API_URL}/${appointmentId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updateData),
        });

        if (!response.ok) {
            const errorData = (await response.json()) as { error?: string };
            throw new Error(errorData.error || 'Erro ao atualizar agendamento');
        }

        console.log('✅ Appointment updated successfully');

        // Close modal
        closeEditModal();

        // Show success notification and reload page
        showToast({ message: 'Agendamento atualizado com sucesso!', type: 'success' });
        location.reload();
    } catch (error: unknown) {
        console.error('❌ Error updating appointment:', error);
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        showToast({ message: `Erro ao atualizar: ${message}`, type: 'error' });
    }
}

/**
 * Populate doctors select in modal
 */
function populateDoctorsInModal(): void {
    const select = document.getElementById('editDoctor') as HTMLSelectElement | null;
    if (!select) return;

    // Check if already populated
    if (select.options.length > 1) return;

    // Get unique doctors from current appointments
    const doctors = [
        ...new Set(
            currentAppointments
                .map((a) => a.doctor)
                .filter((d): d is string => !!d && d.trim() !== '')
        ),
    ].sort();

    // Clear existing options (except first)
    select.innerHTML = '<option value="">Selecione um médico</option>';

    // Add doctor options
    doctors.forEach((doctor: string) => {
        const option = document.createElement('option');
        option.value = doctor;
        option.textContent = doctor;
        select.appendChild(option);
    });
}

/**
 * Populate insurance select in modal
 */
async function populateInsuranceInModal(): Promise<void> {
    const select = document.getElementById('editInsurance') as HTMLSelectElement | null;
    if (!select) return;

    // Check if already populated
    if (select.options.length > 1) return;

    // Try to load from clinic settings
    try {
        const settings = JSON.parse(
            localStorage.getItem('clinicSettings') || '{}'
        ) as ClinicSettings;
        const insurancePlans: string[] = settings.settings?.insurancePlans || [
            'Particular',
            'Unimed',
            'Bradesco Saúde',
            'Amil',
        ];

        // Clear existing options (except first)
        select.innerHTML = '<option value="">Selecione...</option>';

        // Add insurance options
        insurancePlans.forEach((plan: string) => {
            const option = document.createElement('option');
            option.value = plan;
            option.textContent = plan;
            select.appendChild(option);
        });
    } catch (error: unknown) {
        console.error('Error loading insurance plans:', error);
        // Fallback to defaults
        select.innerHTML = `
            <option value="">Selecione...</option>
            <option value="Particular">Particular</option>
            <option value="Unimed">Unimed</option>
            <option value="Bradesco Saúde">Bradesco Saúde</option>
            <option value="Amil">Amil</option>
        `;
    }
}

/**
 * Encode financial data into notes field
 */
function encodeFinancialData(cleanNotes: string, financialData: FinancialData): string {
    if (!financialData.value && !financialData.paymentType) {
        return cleanNotes;
    }

    const financialJson = JSON.stringify({
        financial: {
            paymentType: financialData.paymentType,
            insuranceName: financialData.insuranceName,
            value: financialData.value,
        },
    });

    return `${cleanNotes}\n${financialJson}`.trim();
}

// ============================================
// QUICK CHECKOUT (PAYMENT)
// ============================================

const checkoutFormEl = document.getElementById('checkoutForm') as HTMLFormElement | null;
if (checkoutFormEl) {
    checkoutFormEl.addEventListener('submit', async (event: Event): Promise<void> => {
        event.preventDefault();

        if (!currentModalAppointment) {
            showToast({ message: 'Nenhum agendamento selecionado', type: 'warning' });
            return;
        }

        const amountRaw = (
            document.getElementById('checkoutAmount') as HTMLInputElement
        ).value.replace(/\D/g, '');
        const amount: number = amountRaw ? parseInt(amountRaw, 10) / 100 : 0;
        const paymentMethod = (
            document.getElementById('checkoutPaymentMethod') as HTMLSelectElement
        ).value;

        if (!amount || amount <= 0) {
            showToast({ message: 'Informe um valor válido', type: 'warning' });
            return;
        }

        const payload: CheckoutPayload = {
            type: 'income',
            amount,
            category: currentModalAppointment.type || 'Consulta',
            payment_method: paymentMethod,
            status: 'paid',
            due_date: null,
            paid_at: new Date().toISOString(),
            patient_id: currentModalAppointment.patient_id || null,
            appointment_id: currentModalAppointment.appointment_id || null,
        };

        try {
            const response = await fetch('/api/financial/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = (await response.json()) as { error?: string };
                throw new Error(errorData.error || 'Erro ao registrar pagamento');
            }

            markAppointmentPaid(currentModalAppointment.id);
            showToast({ message: 'Pagamento recebido com sucesso!', type: 'success' });

            closeEditModal();
        } catch (error: unknown) {
            console.error('❌ Error registering payment:', error);
            const message = error instanceof Error ? error.message : 'Erro desconhecido';
            showToast({ message: `Erro ao registrar pagamento: ${message}`, type: 'error' });
        }
    });
}

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================

window.loadAgenda = loadAgenda;
(window as unknown as Record<string, unknown>).openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.saveEdit = saveEdit;
window.editAppointment = editAppointment;
window.archiveAppointment = archiveAppointment;
window.deleteAppointment = deleteAppointment;
window.markAttendance = markAttendance;
window.openWhatsAppAgenda = openWhatsAppAgenda;
window.openPaymentCheckout = openPaymentCheckout;
window.showEditForm = showEditForm;
window.openWhatsAppConfirmation = openWhatsAppConfirmation;

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

document.addEventListener('DOMContentLoaded', (): void => {
    // Set today's date in filter
    const today = new Date().toISOString().split('T')[0];
    const dateFilter = document.getElementById('dateFilter') as HTMLInputElement | null;
    if (dateFilter) dateFilter.value = today;

    // Load doctors and initial agenda
    loadDoctors();
    loadAgenda();

    // Add event listeners to filters
    const dateFilterEl = document.getElementById('dateFilter');
    const doctorFilterEl = document.getElementById('doctorFilter');
    if (dateFilterEl) dateFilterEl.addEventListener('change', loadAgenda);
    if (doctorFilterEl) doctorFilterEl.addEventListener('change', loadAgenda);
});
