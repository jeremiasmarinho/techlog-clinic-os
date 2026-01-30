/**
 * Agenda - Advanced Daily Appointments View
 * Features: JSON parsing, financial badges, CRUD actions, strict badge rules
 */

// Import centralized formatters
import { formatTime, formatDateTime } from '../utils/formatters.js';

// ============================================
// Authentication Check
// ============================================
const token = sessionStorage.getItem('MEDICAL_CRM_TOKEN') || sessionStorage.getItem('token');
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
                    value: financial.value || null
                }
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
            'particular': { icon: '💵', text: 'Particular', color: 'emerald' },
            'plano': { icon: '🏥', text: financial.insuranceName || 'Plano', color: 'blue' },
            'retorno': { icon: '🔄', text: 'Retorno', color: 'purple' }
        };
        
        const type = typeMap[financial.paymentType] || { icon: '💳', text: financial.paymentType, color: 'gray' };
        
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
            console.log(`⚠️  Blocked outcome badge "${attendanceStatus}" for status "${currentStatus}"`);
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
        'compareceu': '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30"><i class="fas fa-check mr-1"></i>Compareceu</span>',
        'nao_compareceu': '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30"><i class="fas fa-times mr-1"></i>Não veio</span>',
        'cancelado': '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-300 border border-gray-500/30"><i class="fas fa-ban mr-1"></i>Cancelado</span>',
        'remarcado': '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"><i class="fas fa-calendar-alt mr-1"></i>Remarcado</span>'
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
        return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,6)}-${cleaned.slice(6)}`;
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
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar médicos');
        
        const leads = await response.json();
        
        // Extract unique doctors
        const doctors = [...new Set(leads.map(l => l.doctor).filter(d => d))];
        
        const select = document.getElementById('doctorFilter');
        doctors.forEach(doctor => {
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
// LOAD AGENDA
// ============================================

async function loadAgenda() {
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('emptyState');
    const list = document.getElementById('appointmentsList');
    
    loading.classList.remove('hidden');
    emptyState.classList.add('hidden');
    list.innerHTML = '';
    
    try {
        const date = document.getElementById('dateFilter').value;
        const doctor = document.getElementById('doctorFilter').value;
        
        let url = `${API_URL}?view=agenda&date=${date}`;
        if (doctor) url += `&doctor=${encodeURIComponent(doctor)}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar agenda');
        
        const appointments = await response.json();
        currentAppointments = appointments;
        
        console.log(`✅ Loaded ${appointments.length} appointments with advanced features`);
        
        if (appointments.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            appointments.forEach(appointment => {
                list.appendChild(createAppointmentCard(appointment));
            });
        }
    } catch (error) {
        console.error('Erro ao carregar agenda:', error);
        alert('Erro ao carregar agenda. Tente novamente.');
    } finally {
        loading.classList.add('hidden');
    }
}

// ============================================
// CREATE APPOINTMENT CARD (ADVANCED LAYOUT)
// ============================================

function createAppointmentCard(appointment) {
    const card = document.createElement('div');
    card.className = 'glass-card rounded-xl p-5 hover:bg-white/10 transition-all border border-white/10';
    card.dataset.appointmentId = appointment.id;
    
    // Parse description to extract financial data and clean text
    const parsed = parseDescription(appointment.notes);
    const financialBadges = getFinancialBadges(parsed.financial);
    const cleanNotes = parsed.cleanText;
    
    // Format time (HH:mm without seconds)
    const time = appointment.appointment_date 
        ? formatTime(appointment.appointment_date)
        : '--:--';
    
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
                'primeira_consulta': '⭐ Primeira Consulta',
                'Primeira Consulta': '⭐ Primeira Consulta',
                'retorno': '🔄 Retorno',
                'Retorno': '🔄 Retorno',
                'exame': '🔬 Exame',
                'Exame': '🔬 Exame',
                'Consulta': '🩺 Consulta'
            };
            const typeText = typeMap[appointment.type] || appointment.type;
            typeBadge = `<span class="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">${typeText}</span>`;
        }
    }
    
    // Show quick action buttons only if not finalized yet
    const showQuickActions = !appointment.attendance_status && 
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
                <h3 class="text-xl font-semibold text-white mb-2">${appointment.name}</h3>
                
                <!-- Contact & Doctor Row -->
                <div class="flex flex-wrap items-center gap-3 mb-2">
                    <span class="text-sm text-gray-300 flex items-center">
                        <i class="fas fa-phone mr-2 text-cyan-400"></i>
                        ${formatPhone(appointment.phone)}
                    </span>
                    ${appointment.doctor ? `
                        <span class="text-sm text-gray-300 flex items-center">
                            <i class="fas fa-user-md mr-2 text-purple-400"></i>
                            ${appointment.doctor}
                        </span>
                    ` : ''}
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
                    onclick="editAppointment(${appointment.id})"
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
        ${cleanNotes ? `
            <div class="bg-gray-800/50 rounded-lg p-3 mb-3">
                <p class="text-sm text-gray-300 flex items-start">
                    <i class="fas fa-sticky-note mr-2 text-yellow-400 mt-0.5"></i>
                    <span>${cleanNotes}</span>
                </p>
            </div>
        ` : ''}
        
        <!-- QUICK ATTENDANCE ACTIONS (Only if not finalized) -->
        ${showQuickActions ? `
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
        ` : ''}
    `;
    
    return card;
}

// ============================================
// CRUD ACTIONS
// ============================================

/**
 * Edit Appointment
 */
async function editAppointment(appointmentId) {
    const appointment = currentAppointments.find(a => a.id === appointmentId);
    if (!appointment) {
        alert('❌ Agendamento não encontrado');
        return;
    }
    
    const newDate = prompt('Nova data/hora (YYYY-MM-DD HH:MM):', appointment.appointment_date || '');
    if (newDate === null) return; // Cancelled
    
    const newDoctor = prompt('Médico:', appointment.doctor || '');
    const newNotes = prompt('Observações:', appointment.notes || '');
    
    try {
        const response = await fetch(`${API_URL}/${appointmentId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                appointment_date: newDate ? new Date(newDate).toISOString() : null,
                doctor: newDoctor,
                notes: newNotes
            })
        });
        
        if (!response.ok) throw new Error('Erro ao atualizar');
        
        alert('✅ Agendamento atualizado!');
        loadAgenda();
    } catch (error) {
        console.error('Erro ao editar:', error);
        alert('❌ Erro ao editar agendamento');
    }
}

/**
 * Archive Appointment
 */
async function archiveAppointment(appointmentId) {
    if (!confirm('⚠️ Arquivar este agendamento?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${appointmentId}/archive`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ archive_reason: 'manual_archive' })
        });
        
        if (!response.ok) throw new Error('Erro ao arquivar');
        
        alert('✅ Agendamento arquivado com sucesso!');
        loadAgenda();
        
    } catch (error) {
        console.error('Erro ao arquivar:', error);
        alert('❌ Erro ao arquivar agendamento');
    }
}

/**
 * Delete Appointment
 */
async function deleteAppointment(appointmentId) {
    if (!confirm('🗑️ Tem certeza que deseja EXCLUIR este agendamento? Esta ação não pode ser desfeita!')) return;
    
    try {
        const response = await fetch(`${API_URL}/${appointmentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao excluir');
        
        alert('✅ Agendamento excluído com sucesso!');
        loadAgenda();
        
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
        const response = await fetch(`${API_URL}/${appointmentId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                attendance_status: attendanceStatus,
                status: 'finalizado'
            })
        });
        
        if (!response.ok) throw new Error('Erro ao atualizar status');
        
        const labels = {
            'compareceu': 'Presença confirmada!',
            'nao_compareceu': 'Falta registrada.',
            'cancelado': 'Cancelamento registrado.'
        };
        
        alert(`✅ ${labels[attendanceStatus] || 'Status atualizado!'}`);
        loadAgenda();
        
    } catch (error) {
        console.error('Erro ao marcar presença:', error);
        alert('❌ Erro ao atualizar status');
    }
}

// ============================================
// WHATSAPP INTEGRATION
// ============================================

function openWhatsAppAgenda(appointmentId) {
    const appointment = currentAppointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    
    const phone = appointment.phone.replace(/\D/g, '');
    const message = `Olá *${appointment.name}*! 👋\n\nPassando para confirmar sua consulta${appointment.appointment_date ? ` agendada para *${new Date(appointment.appointment_date).toLocaleString('pt-BR')}*` : ''}.\n\nTudo confirmado?`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================

window.loadAgenda = loadAgenda;
window.editAppointment = editAppointment;
window.archiveAppointment = archiveAppointment;
window.deleteAppointment = deleteAppointment;
window.markAttendance = markAttendance;
window.openWhatsAppAgenda = openWhatsAppAgenda;

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
