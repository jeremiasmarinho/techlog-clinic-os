// ============================================
// Kanban Board - Lead Management System with JWT Auth
// ============================================

const token = sessionStorage.getItem('MEDICAL_CRM_TOKEN');
if (!token) {
    alert('Sessão inválida. Faça login novamente.');
    window.location.href = '/login.html';
}

// Global state variables
let currentDraggedCard = null;
let lastLeadCount = 0;
let isFirstLoad = true;
let privacyMode = false;

// Load leads from API
async function loadLeads() {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_URL}?view=kanban`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            sessionStorage.clear();
            window.location.href = '/login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const leads = Array.isArray(data) ? data : (data.leads || []);
        
        // Sound notification for new leads
        if (!isFirstLoad && leads.length > lastLeadCount) {
            notificationSound.play().catch(e => console.log('Sound notification blocked:', e));
            showNotification('🔔 Novo lead recebido!', 'success');
        }
        
        lastLeadCount = leads.length;
        isFirstLoad = false;
        
        renderLeads(leads);
        
    } catch (error) {
        console.error('Erro ao carregar leads:', error);
        alert('❌ Erro ao carregar leads. Verifique a conexão com o servidor.');
    } finally {
        showLoading(false);
    }
}

// Render leads in columns
function renderLeads(leads) {
    // Clear all columns
    ['novo', 'em_atendimento', 'agendado', 'finalizado'].forEach(status => {
        const column = document.getElementById(`column-${status}`);
        if (column) {
            column.innerHTML = '';
        }
    });

    // Distribute leads in columns
    leads.forEach(lead => {
        const card = createLeadCard(lead);
        const status = lead.status || 'novo';
        const column = document.getElementById(`column-${status}`);
        
        if (column) {
            column.appendChild(card);
        }
    });

    // Update counters
    updateCounters(leads);
}

// Create lead card
function createLeadCard(lead) {
    const card = document.createElement('div');
    card.className = 'lead-card bg-white rounded-lg shadow p-4 border border-gray-200 relative';
    card.draggable = true;
    card.dataset.id = lead.id;
    card.dataset.status = lead.status || 'novo';

    // SMART TAGS - Badge based on lead.type
    let typeBadge = '';
    
    if (lead.type === 'primeira_consulta') {
        typeBadge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200"><i class="fas fa-star mr-1"></i>Primeira Consulta</span>';
    } else if (lead.type === 'retorno') {
        typeBadge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-gray-200 text-gray-700 border border-gray-300"><i class="fas fa-undo mr-1"></i>Retorno</span>';
    } else if (lead.type === 'recorrente') {
        typeBadge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200"><i class="fas fa-sync-alt mr-1"></i>Sessão/Recorrente</span>';
    } else if (lead.type === 'exame') {
        typeBadge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200"><i class="fas fa-microscope mr-1"></i>Exame</span>';
    } 
    // Legacy support
    else if (lead.type === 'Consulta') {
        typeBadge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200"><i class="fas fa-stethoscope mr-1"></i>Consulta</span>';
    } else if (lead.type === 'Exame') {
        typeBadge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200"><i class="fas fa-microscope mr-1"></i>Exame</span>';
    } else {
        typeBadge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200"><i class="fas fa-question mr-1"></i>' + (lead.type || 'Geral') + '</span>';
    }

    // WAIT TIME TRACKER
    const createdDate = new Date(lead.created_at);
    const now = new Date();
    const diffMs = now - createdDate;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    let timeString = '';
    if (hours > 0) {
        timeString = `${hours}h ${minutes}m`;
    } else {
        timeString = `${minutes}m`;
    }

    let timeClasses = diffMinutes < 15 ? 'text-gray-500' : 'text-red-600 font-bold animate-pulse';

    // SMART REMINDER - Check for upcoming appointments
    let reminderButton = '';
    let appointmentBadge = '';
    
    if (lead.appointment_date) {
        const appointmentDate = new Date(lead.appointment_date);
        const formattedDate = appointmentDate.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        const timeOnly = appointmentDate.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
        const doctorBadge = lead.doctor ? ` 👨‍⚕️ ${lead.doctor}` : '';
        appointmentBadge = `
            <div class="text-center bg-blue-50 rounded-full px-3 py-1 mb-2">
                <span class="text-xs font-semibold text-blue-700">📅 ${formattedDate}${doctorBadge}</span>
            </div>
        `;

        // Calculate hours until appointment
        const diffMsToAppointment = appointmentDate - now;
        const hoursUntilAppointment = diffMsToAppointment / (1000 * 60 * 60);

        // Show reminder button if appointment is within next 4 hours
        if (hoursUntilAppointment > 0 && hoursUntilAppointment <= 4) {
            const reminderMessage = `Olá *${lead.name}*, passando para lembrar do seu agendamento hoje às *${timeOnly}* na Sua Clínica Aqui. Tudo confirmado?`;
            reminderButton = `
                <a href="https://wa.me/55${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(reminderMessage)}" 
                   target="_blank"
                   class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs transition flex items-center justify-center w-full animate-pulse">
                    <i class="fas fa-bell mr-1"></i> Lembrar
                </a>
            `;
        }
    }

    // Notes indicator
    const notesIndicator = lead.notes ? `
        <span class="absolute top-2 left-2 text-yellow-500 cursor-help" title="${lead.notes.replace(/"/g, '&quot;')}">
            📄
        </span>
    ` : '';

    card.innerHTML = `
        ${notesIndicator}
        
        <!-- SMART TAGS & WAIT TIME TRACKER -->
        <div class="flex justify-between items-start mb-2">
            <div class="flex items-center flex-wrap gap-1">
                ${typeBadge}
            </div>
            <small class="${timeClasses}">🕒 ${timeString}</small>
        </div>
        
        <!-- Edit/Delete buttons -->
        <div class="flex items-center justify-end space-x-2 mb-2">
            <button onclick="openEditModal(${lead.id}, '${lead.name}', '${lead.appointment_date || ''}', '${lead.doctor || ''}', \`${(lead.notes || '').replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`, '${lead.type || ''}')" class="text-gray-400 hover:text-blue-600 transition" title="Editar">
                <i class="fas fa-pen text-xs"></i>
            </button>
            <button onclick="deleteLead(${lead.id})" class="text-gray-400 hover:text-red-600 transition" title="Excluir">
                <i class="fas fa-trash text-xs"></i>
            </button>
        </div>
        
        <!-- Patient Name -->
        <h3 class="font-semibold text-gray-900 mb-2 lead-name">${lead.name}</h3>
        
        <!-- Appointment Badge -->
        ${appointmentBadge}
        
        <!-- Phone & Actions -->
        <div class="space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-xs text-gray-600 lead-phone">
                    <i class="fas fa-phone mr-1"></i>${formatPhone(lead.phone)}
                </span>
                <a href="https://wa.me/55${lead.phone.replace(/\D/g, '')}?text=Olá ${encodeURIComponent(lead.name)}" 
                   target="_blank"
                   class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition flex items-center">
                    <i class="fab fa-whatsapp mr-1"></i> Chat
                </a>
            </div>
            
            <!-- Smart Reminder Button -->
            ${reminderButton}
            
            <!-- Confirmar Button -->
            <a href="https://wa.me/55${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá *${lead.name}*, tudo bem? Gostaria de confirmar seu agendamento na Sua Clínica Aqui.`)}" 
               target="_blank"
               class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition flex items-center justify-center w-full">
                <i class="fas fa-check-double mr-1"></i> Confirmar
            </a>
        </div>
    `;

    // Event listeners for drag
    card.addEventListener('dragstart', dragStart);
    card.addEventListener('dragend', dragEnd);

    return card;
}

// Drag and Drop handlers
function dragStart(e) {
    currentDraggedCard = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
}

function dragEnd(e) {
    e.target.classList.remove('dragging');
}

function allowDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function dragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

async function drop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const dropZone = e.currentTarget;
    const newStatus = dropZone.parentElement.dataset.status;
    const leadId = currentDraggedCard.dataset.id;
    const oldStatus = currentDraggedCard.dataset.status;

    // If same column, do nothing
    if (newStatus === oldStatus) {
        return;
    }

    // Move card visually
    dropZone.appendChild(currentDraggedCard);
    currentDraggedCard.dataset.status = newStatus;

    // Update backend
    try {
        const response = await fetch(`${API_URL}/${leadId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar status');
        }

        loadLeads();
        showNotification('✅ Status atualizado com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showNotification('❌ Erro ao atualizar status', 'error');
        loadLeads();
    }
}

// Delete lead
async function deleteLead(id) {
    if (!confirm('Tem certeza que deseja remover este lead?')) {
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao deletar lead');
        }

        showNotification('🗑️ Lead removido com sucesso!', 'success');
        loadLeads();

    } catch (error) {
        console.error('Erro ao deletar lead:', error);
        showNotification('❌ Erro ao remover lead', 'error');
    } finally {
        showLoading(false);
    }
}

// Update counters
function updateCounters(leads) {
    const counts = {
        'novo': 0,
        'em_atendimento': 0,
        'agendado': 0,
        'finalizado': 0
    };

    leads.forEach(lead => {
        const status = lead.status || 'novo';
        if (counts.hasOwnProperty(status)) {
            counts[status]++;
        }
    });

    Object.keys(counts).forEach(status => {
        const counter = document.getElementById(`count-${status}`);
        if (counter) {
            counter.textContent = counts[status];
        }
    });
}

// Privacy Mode Toggle (LGPD Compliance)
function togglePrivacyMode() {
    privacyMode = !privacyMode;
    const body = document.body;
    const icon = document.getElementById('privacyIcon');
    
    if (privacyMode) {
        body.classList.add('blur-sensitive');
        icon.className = 'fas fa-eye-slash';
    } else {
        body.classList.remove('blur-sensitive');
        icon.className = 'fas fa-eye';
    }
}

// Edit Modal Functions
function openEditModal(leadId, leadName, appointmentDate, doctor, notes, type) {
    document.getElementById('editLeadId').value = leadId;
    document.getElementById('editLeadName').value = leadName;
    document.getElementById('editAppointmentDate').value = appointmentDate || '';
    document.getElementById('editDoctor').value = doctor || '';
    document.getElementById('editNotes').value = notes || '';
    document.getElementById('editType').value = type || '';
    
    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    const form = document.getElementById('editForm');
    if (form) {
        form.reset();
    }
}

// Helper functions
function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.substr(0, 2)}) ${cleaned.substr(2, 5)}-${cleaned.substr(7)}`;
    }
    return phone;
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Agora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min atrás`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
    return `${Math.floor(seconds / 86400)} dias atrás`;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Edit Form Submit Handler
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const leadId = document.getElementById('editLeadId').value;
            const appointmentDate = document.getElementById('editAppointmentDate').value;
            const doctor = document.getElementById('editDoctor').value;
            const notes = document.getElementById('editNotes').value;
            const type = document.getElementById('editType').value;

            try {
                const response = await fetch(`${API_URL}/${leadId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        appointment_date: appointmentDate || null,
                        doctor: doctor || null,
                        notes: notes || null,
                        type: type || null
                    })
                });

                if (!response.ok) {
                    throw new Error('Erro ao atualizar agendamento');
                }

                showNotification('✅ Agendamento atualizado com sucesso!', 'success');
                closeEditModal();
                loadLeads();

            } catch (error) {
                console.error('Erro ao atualizar agendamento:', error);
                showNotification('❌ Erro ao atualizar agendamento', 'error');
            }
        });
    }

    // Load leads on page load
    loadLeads();

    // Auto-refresh every 60 seconds
    setInterval(loadLeads, 60000);
});
