/**
 * Agenda - Advanced Daily Appointments View
 * Features: JSON parsing, financial badges, CRUD actions, strict badge rules
 * NOTE: View modal and CRUD functions are now in appointments-service.js
 */

// Import centralized formatters
import { formatTime, formatDateTime } from '../utils/formatters.js';

// Ensure API_URL is available in module scope
const API_URL = window.API_URL || '/api/leads';
const APPOINTMENTS_API_URL = '/api/appointments'; // For CRUD operations on appointments

// ============================================
// Authentication Check
// ============================================
const token =
    sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('accessToken');
if (!token) {
    alert('Sessão inválida. Faça login novamente.');
    window.location.href = '/login.html';
}

// API_URL is already declared in api.js (loaded before this script)

// Store appointments globally for WhatsApp menu
let currentAppointments = [];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Parse description/notes field to extract JSON financial data and clean text
 * @param {string} text - Raw notes field from database
 * @returns {Object} - { cleanText, financial: { paymentType, insuranceName, value } }
 */
function parseDescription(text) {
    if (!text) return { cleanText: '', financial: null };

    try {
        // Try to extract JSON from notes
        const jsonMatch = text.match(/\{"financial":\{[^}]+\}\}/);

        if (jsonMatch) {
            const jsonData = JSON.parse(jsonMatch[0]);
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

        // No JSON found, return original text
        return { cleanText: text, financial: null };
    } catch (error) {
        console.warn('⚠️ Failed to parse description JSON:', error);
        return { cleanText: text, financial: null };
    }
}

/**
 * Format currency to Brazilian Real (R$ X.XXX,XX)
 */
function formatCurrency(value) {
    if (!value) return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue === 0) return '';
    return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get financial badges HTML from parsed financial data
 */
function getFinancialBadges(financial) {
    if (!financial) return '';

    let badges = '';

    // Payment type badge
    if (financial.paymentType) {
        const typeMap = {
            particular: { icon: '💵', text: 'Particular', color: 'emerald' },
            plano: { icon: '🏥', text: financial.insuranceName || 'Plano', color: 'blue' },
            retorno: { icon: '🔄', text: 'Retorno', color: 'purple' },
        };

        const type = typeMap[financial.paymentType] || {
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
function getAttendanceBadge(appointment) {
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
    const attendanceLabels = {
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
function formatPhone(phone) {
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

document.addEventListener('DOMContentLoaded', () => {
    // Set today as default date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateFilter').value = today;

    loadDoctors();
    loadAgenda();
});

// ============================================
// LOAD DOCTORS FOR FILTER
// ============================================

async function loadDoctors() {
    try {
        const response = await fetch(`${API_URL}?view=all`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error('Erro ao carregar médicos');

        const leads = await response.json();

        // Extract unique doctors
        const doctors = [...new Set(leads.map((l) => l.doctor).filter((d) => d))];

        const select = document.getElementById('doctorFilter');
        doctors.forEach((doctor) => {
            const option = document.createElement('option');
            option.value = doctor;
            option.textContent = doctor;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar médicos:', error);
    }
}

// ============================================
// LOAD AGENDA (Simplified - Calendar handles display)
// ============================================

async function loadAgenda() {
    const loading = document.getElementById('loading');

    loading?.classList.remove('hidden');

    try {
        const date = document.getElementById('dateFilter')?.value;
        const doctor = document.getElementById('doctorFilter')?.value;

        let url = `${API_URL}?view=agenda&date=${date}`;
        if (doctor) url += `&doctor=${encodeURIComponent(doctor)}`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error('Erro ao carregar agenda');

        const appointments = await response.json();
        currentAppointments = appointments;

        console.log(`✅ Loaded ${appointments.length} appointments`);

        // Refresh calendar if exists
        if (window.calendar && typeof window.calendar.refetchEvents === 'function') {
            window.calendar.refetchEvents();
        }
    } catch (error) {
        console.error('Erro ao carregar agenda:', error);
    } finally {
        loading?.classList.add('hidden');
    }
}

// ============================================
// CREATE APPOINTMENT CARD (ADVANCED LAYOUT)
// ============================================

function createAppointmentCard(appointment) {
    const card = document.createElement('div');
    card.className =
        'glass-card rounded-xl p-5 bg-slate-800/50 hover:bg-slate-700 transition-colors duration-200 border border-white/10 cursor-pointer';
    card.dataset.appointmentId = appointment.id;

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
            const typeMap = {
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
    const showQuickActions =
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
async function editAppointment(appointmentId) {
    // Simply redirect to new modal-based edit
    openEditModal(appointmentId);
}

/**
 * Archive Appointment
 */
async function archiveAppointment(appointmentId) {
    const confirmed = await confirm('⚠️ Arquivar este agendamento?');
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

        alert('✅ Agendamento arquivado com sucesso!');
        location.reload();
    } catch (error) {
        console.error('Erro ao arquivar:', error);
        alert('❌ Erro ao arquivar agendamento');
    }
}

/**
 * Delete Appointment
 */
async function deleteAppointment(appointmentId) {
    const confirmed = await confirm(
        '🗑️ Tem certeza que deseja EXCLUIR este agendamento? Esta ação não pode ser desfeita!'
    );
    if (!confirmed) return;

    try {
        const response = await fetch(`${APPOINTMENTS_API_URL}/${appointmentId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error('Erro ao excluir');

        alert('✅ Agendamento excluído com sucesso!');
        location.reload();
    } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('❌ Erro ao excluir agendamento');
    }
}

/**
 * Mark attendance result
 */
async function markAttendance(appointmentId, attendanceStatus) {
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

        const labels = {
            compareceu: 'Presença confirmada!',
            nao_compareceu: 'Falta registrada.',
            cancelado: 'Cancelamento registrado.',
        };

        await alert(`✅ ${labels[attendanceStatus] || 'Status atualizado!'}`);
        loadAgenda();
    } catch (error) {
        console.error('Erro ao marcar presença:', error);
        await alert('❌ Erro ao atualizar status');
    }
}

// ============================================
// WHATSAPP INTEGRATION
// ============================================

function openWhatsAppAgenda(appointmentId) {
    const appointment = currentAppointments.find((a) => a.id === appointmentId);
    if (!appointment) return;

    const phone = appointment.phone.replace(/\D/g, '');
    const message = `Olá *${appointment.name}*! 👋\n\nPassando para confirmar sua consulta${appointment.appointment_date ? ` agendada para *${new Date(appointment.appointment_date).toLocaleString('pt-BR')}*` : ''}.\n\nTudo confirmado?`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

// ============================================
// EDIT MODAL FUNCTIONS (NEW - SIMPLIFIED SINGLE MODAL)
// ============================================

let currentModalAppointment = null;

function showEditForm() {
    const editForm = document.getElementById('editForm');
    const checkoutForm = document.getElementById('checkoutForm');

    if (editForm) editForm.classList.remove('hidden');
    if (checkoutForm) checkoutForm.classList.add('hidden');
}

function showCheckoutForm() {
    const editForm = document.getElementById('editForm');
    const checkoutForm = document.getElementById('checkoutForm');

    if (editForm) editForm.classList.add('hidden');
    if (checkoutForm) checkoutForm.classList.remove('hidden');
}

/**
 * Open Edit Modal with appointment data
 * Now fetches from API if not found locally
 */
async function openEditModal(appointmentId) {
    console.log('🔧 openEditModal called with ID:', appointmentId);

    let appointment = currentAppointments.find(
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
                alert('❌ Agendamento não encontrado');
                return;
            }

            appointment = await response.json();
            // Map API response to expected format
            appointment.name = appointment.patient_name || '';
            appointment.phone = appointment.patient_phone || '';
        } catch (error) {
            console.error('Erro ao buscar agendamento:', error);
            alert('❌ Erro ao carregar dados do agendamento');
            return;
        }
    }

    currentModalAppointment = appointment;
    showEditForm();

    console.log('📝 Opening edit modal for appointment:', appointment);

    // Populate form fields - with null checks
    const editIdEl = document.getElementById('editId');
    const editNameEl = document.getElementById('editName');
    const editPhoneEl = document.getElementById('editPhone');
    const editDateEl = document.getElementById('editDate');

    if (editIdEl) editIdEl.value = appointment.id;
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
    const editDoctorEl = document.getElementById('editDoctor');
    if (editDoctorEl) editDoctorEl.value = appointment.doctor || '';

    // Set type
    const editTypeEl = document.getElementById('editType');
    if (editTypeEl) editTypeEl.value = appointment.type || '';

    // Set status
    const editStatusEl = document.getElementById('editStatus');
    if (editStatusEl) editStatusEl.value = appointment.status || 'agendado';

    // Parse financial data from notes
    const { cleanText, financial } = parseDescription(appointment.notes);

    // Set financial fields
    if (financial) {
        if (financial.value) {
            // Format value as R$ 250,00
            const valueNumber = parseFloat(financial.value);
            const editValueEl = document.getElementById('editValue');
            if (!isNaN(valueNumber) && editValueEl) {
                editValueEl.value = `R$ ${valueNumber.toFixed(2).replace('.', ',')}`;
            }
        }
        if (financial.paymentType || financial.insuranceName) {
            // Populate insurance select
            populateInsuranceInModal();
            const editInsuranceEl = document.getElementById('editInsurance');
            if (editInsuranceEl) {
                editInsuranceEl.value = financial.insuranceName || financial.paymentType || '';
            }
        }
    }

    // Set clean notes (without JSON)
    const editNotesEl = document.getElementById('editNotes');
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
function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    currentModalAppointment = null;

    // Reset form
    const editForm = document.getElementById('editForm');
    if (editForm) editForm.reset();
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) checkoutForm.reset();
    showEditForm();
}

function openPaymentCheckout() {
    if (!currentModalAppointment) {
        alert('⚠️ Nenhum agendamento selecionado');
        return;
    }

    const { financial } = parseDescription(currentModalAppointment.notes);
    const checkoutAmount = document.getElementById('checkoutAmount');
    const checkoutPaymentMethod = document.getElementById('checkoutPaymentMethod');

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

async function openWhatsAppConfirmation() {
    if (!currentModalAppointment) {
        alert('⚠️ Nenhum agendamento selecionado');
        return;
    }

    if (!currentModalAppointment.phone) {
        alert('⚠️ Telefone do paciente não encontrado');
        return;
    }

    const templates =
        typeof getWhatsAppTemplates === 'function'
            ? getWhatsAppTemplates(currentModalAppointment)
            : null;

    const url =
        templates?.confirmar?.url ||
        `https://wa.me/55${currentModalAppointment.phone.replace(/\D/g, '')}`;
    window.open(url, '_blank');

    const confirmed = confirm('O paciente confirmou?');
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
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao confirmar agendamento');
        }

        alert('✅ Agendamento confirmado com sucesso!');
        location.reload();
    } catch (error) {
        console.error('❌ Error confirming appointment:', error);
        alert(`❌ Erro ao confirmar: ${error.message}`);
    }
}

function markAppointmentPaid(appointmentId) {
    const card = document.querySelector(`[data-appointment-id="${appointmentId}"]`);
    if (!card) return;

    card.classList.add('border-emerald-400/60', 'bg-emerald-500/10');
}

/**
 * Save edited appointment
 */
async function saveEdit(event) {
    event.preventDefault();

    const appointmentId = document.getElementById('editId').value;
    const name = document.getElementById('editName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const appointmentDate = document.getElementById('editDate').value;
    const doctor = document.getElementById('editDoctor').value;
    const type = document.getElementById('editType').value;
    const status = document.getElementById('editStatus').value;
    const valueRaw = document.getElementById('editValue').value.replace(/\D/g, ''); // Remove non-digits
    const insurance = document.getElementById('editInsurance').value;
    const notes = document.getElementById('editNotes').value.trim();

    // Validate required fields
    if (!name || !phone || !appointmentDate) {
        alert('⚠️ Preencha todos os campos obrigatórios');
        return;
    }

    // Build financial data object
    const financialData = {
        value: valueRaw ? (parseInt(valueRaw) / 100).toFixed(2) : null,
        paymentType: insurance || 'Particular',
        insuranceName: insurance || null,
    };

    // Encode financial data into notes
    const finalNotes = encodeFinancialData(notes, financialData);

    // Build update payload
    const updateData = {
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
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao atualizar agendamento');
        }

        console.log('✅ Appointment updated successfully');

        // Close modal
        closeEditModal();

        // Show success notification and reload page
        alert('✅ Agendamento atualizado com sucesso!');
        location.reload();
    } catch (error) {
        console.error('❌ Error updating appointment:', error);
        alert(`❌ Erro ao atualizar: ${error.message}`);
    }
}

/**
 * Populate doctors select in modal
 */
function populateDoctorsInModal() {
    const select = document.getElementById('editDoctor');

    // Check if already populated
    if (select.options.length > 1) return;

    // Get unique doctors from current appointments
    const doctors = [
        ...new Set(currentAppointments.map((a) => a.doctor).filter((d) => d && d.trim() !== '')),
    ].sort();

    // Clear existing options (except first)
    select.innerHTML = '<option value="">Selecione um médico</option>';

    // Add doctor options
    doctors.forEach((doctor) => {
        const option = document.createElement('option');
        option.value = doctor;
        option.textContent = doctor;
        select.appendChild(option);
    });
}

/**
 * Populate insurance select in modal
 */
async function populateInsuranceInModal() {
    const select = document.getElementById('editInsurance');

    // Check if already populated
    if (select.options.length > 1) return;

    // Try to load from clinic settings
    try {
        const settings = JSON.parse(localStorage.getItem('clinicSettings') || '{}');
        const insurancePlans = settings.settings?.insurancePlans || [
            'Particular',
            'Unimed',
            'Bradesco Saúde',
            'Amil',
        ];

        // Clear existing options (except first)
        select.innerHTML = '<option value="">Selecione...</option>';

        // Add insurance options
        insurancePlans.forEach((plan) => {
            const option = document.createElement('option');
            option.value = plan;
            option.textContent = plan;
            select.appendChild(option);
        });
    } catch (error) {
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
function encodeFinancialData(cleanNotes, financialData) {
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

const checkoutForm = document.getElementById('checkoutForm');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!currentModalAppointment) {
            alert('⚠️ Nenhum agendamento selecionado');
            return;
        }

        const amountRaw = document.getElementById('checkoutAmount').value.replace(/\D/g, '');
        const amount = amountRaw ? parseInt(amountRaw, 10) / 100 : 0;
        const paymentMethod = document.getElementById('checkoutPaymentMethod').value;

        if (!amount || amount <= 0) {
            alert('⚠️ Informe um valor válido');
            return;
        }

        const payload = {
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
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao registrar pagamento');
            }

            markAppointmentPaid(currentModalAppointment.id);
            if (typeof showNotification === 'function') {
                showNotification('✅ Pagamento recebido com sucesso!', 'success');
            } else {
                alert('✅ Pagamento recebido com sucesso!');
            }

            closeEditModal();
        } catch (error) {
            console.error('❌ Error registering payment:', error);
            alert(`❌ Erro ao registrar pagamento: ${error.message}`);
        }
    });
}

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================

window.loadAgenda = loadAgenda;
window.openEditModal = openEditModal;
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

document.addEventListener('DOMContentLoaded', () => {
    // Set today's date in filter
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateFilter').value = today;

    // Load doctors and initial agenda
    loadDoctors();
    loadAgenda();

    // Add event listeners to filters
    document.getElementById('dateFilter').addEventListener('change', loadAgenda);
    document.getElementById('doctorFilter').addEventListener('change', loadAgenda);
});
