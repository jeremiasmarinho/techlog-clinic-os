// ============================================
// Agenda - Daily Appointments View
// ============================================

const token = sessionStorage.getItem('MEDICAL_CRM_TOKEN');
if (!token) {
    alert('Sessão inválida. Faça login novamente.');
    window.location.href = '/login.html';
}

// Store appointments globally for WhatsApp menu
let currentAppointments = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set today as default date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateFilter').value = today;
    
    loadDoctors();
    loadAgenda();
});

// Load doctors for filter
async function loadDoctors() {
    try {
        const response = await fetch(`${API_URL}?view=kanban`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar dados');
        
        const leads = await response.json();
        const doctors = [...new Set(leads.map(l => l.doctor).filter(Boolean))];
        
        const select = document.getElementById('doctorFilter');
        doctors.forEach(doctor => {
            const option = document.createElement('option');
            option.value = doctor;
            option.textContent = doctor;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar profissionais:', error);
    }
}

// Load agenda
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
        currentAppointments = appointments; // Store for WhatsApp menu
        
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

// Create appointment card
function createAppointmentCard(appointment) {
    const card = document.createElement('div');
    card.className = 'glass-card rounded-xl p-4 hover:bg-white/10 transition';
    card.dataset.appointmentId = appointment.id;
    
    const time = appointment.appointment_date 
        ? new Date(appointment.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '--:--';
    
    // Attendance status colors
    const attendanceColors = {
        'compareceu': 'bg-green-500/20 text-green-300 border-green-500/30',
        'nao_compareceu': 'bg-red-500/20 text-red-300 border-red-500/30',
        'cancelado': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
        'remarcado': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
    };
    
    const attendanceLabels = {
        'compareceu': 'Compareceu',
        'nao_compareceu': 'Não veio',
        'cancelado': 'Cancelado',
        'remarcado': 'Remarcado'
    };
    
    // Status colors (fallback)
    const statusColors = {
        'agendado': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        'confirmado': 'bg-green-500/20 text-green-300 border-green-500/30',
        'em_atendimento': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
        'finalizado': 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    };
    
    // Use attendance_status if available, otherwise use status
    let statusBadge = '';
    if (appointment.attendance_status) {
        const color = attendanceColors[appointment.attendance_status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        const label = attendanceLabels[appointment.attendance_status] || appointment.attendance_status;
        statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-semibold border ${color}">${label}</span>`;
    } else {
        const color = statusColors[appointment.status] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
        statusBadge = `<span class="px-3 py-1 rounded-full text-xs font-semibold border ${color}">${appointment.status}</span>`;
    }
    
    // Show quick action buttons only if not finalized yet
    const showQuickActions = !appointment.attendance_status && 
                             (appointment.status === 'agendado' || appointment.status === 'em_atendimento');
    
    const templates = getWhatsAppTemplates(appointment);
    
    card.innerHTML = `
        <div class="flex flex-col gap-3">
            <div class="flex flex-col md:flex-row md:items-center gap-4">
                <div class="flex items-center space-x-4 flex-1">
                    <div class="text-3xl font-bold text-cyan-400">${time}</div>
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-white">${appointment.name}</h3>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-sm text-gray-300">
                                <i class="fas fa-phone mr-1 text-cyan-400"></i>${formatPhone(appointment.phone)}
                            </span>
                            ${appointment.doctor ? `
                                <span class="text-sm text-gray-300">
                                    <i class="fas fa-user-md mr-1 text-purple-400"></i>${appointment.doctor}
                                </span>
                            ` : ''}
                        </div>
                        ${appointment.notes ? `
                            <p class="text-sm text-gray-400 mt-2">
                                <i class="fas fa-sticky-note mr-1"></i>${appointment.notes}
                            </p>
                        ` : ''}
                    </div>
                </div>
                
                <div class="flex items-center gap-2">
                    ${statusBadge}
                    <div class="relative">
                        <button 
                            onclick="openWhatsAppMenuAgenda(${appointment.id}, event)"
                            class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition flex items-center">
                            <i class="fab fa-whatsapp mr-2"></i>WhatsApp
                            <i class="fas fa-chevron-down ml-2 text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            ${showQuickActions ? `
                <div class="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                    <span class="text-xs text-gray-400 self-center mr-2">Resultado:</span>
                    <button 
                        onclick="markAttendance(${appointment.id}, 'compareceu')"
                        class="px-3 py-1 text-xs font-medium rounded-lg bg-green-600/80 hover:bg-green-600 text-white transition flex items-center">
                        <i class="fas fa-check mr-1"></i> Compareceu
                    </button>
                    <button 
                        onclick="markAttendance(${appointment.id}, 'nao_compareceu')"
                        class="px-3 py-1 text-xs font-medium rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition flex items-center">
                        <i class="fas fa-times mr-1"></i> Não veio
                    </button>
                    <button 
                        onclick="markAttendance(${appointment.id}, 'cancelado')"
                        class="px-3 py-1 text-xs font-medium rounded-lg bg-gray-600/80 hover:bg-gray-600 text-white transition flex items-center">
                        <i class="fas fa-ban mr-1"></i> Cancelou
                    </button>
                </div>
            ` : ''}
        </div>
    `;
    
    return card;
}

// WhatsApp Integration (using shared helper)
function openWhatsAppMenuAgenda(appointmentId, event) {
    event.stopPropagation();
    
    const appointment = currentAppointments.find(a => a.id === appointmentId);
    if (!appointment) return;
    
    const leadData = {
        name: appointment.name,
        phone: appointment.phone.replace(/\D/g, ''),
        appointment_date: appointment.appointment_date,
        doctor: appointment.doctor
    };
    
    // Use shared WhatsApp helper
    const card = event.currentTarget.closest('.glass-card');
    openWhatsAppMenu(event.currentTarget, leadData, card);
}

// Helper functions
function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.substr(0, 2)}) ${cleaned.substr(2, 5)}-${cleaned.substr(7)}`;
    }
    return phone;
}

// Mark attendance result
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
                status: 'Finalizado'
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao atualizar status');
        }
        
        // Reload agenda to show updated status
        await loadAgenda();
        
        // Show success notification
        const labels = {
            'compareceu': 'Presença confirmada!',
            'nao_compareceu': 'Falta registrada.',
            'cancelado': 'Cancelamento registrado.'
        };
        
        alert(`✅ ${labels[attendanceStatus] || 'Status atualizado!'}`);
        
    } catch (error) {
        console.error('Erro ao marcar presença:', error);
        alert('❌ Erro ao atualizar. Tente novamente.');
    }
}
