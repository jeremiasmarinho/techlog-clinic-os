// ============================================
// Kanban Board - Lead Management System with JWT Auth
// ============================================

const token = sessionStorage.getItem('MEDICAL_CRM_TOKEN');
if (!token) {
    alert('Sessão inválida. Faça login novamente.');
    window.location.href = '/login.html';
}

// ============================================
// WhatsApp Integration (using shared helper)
// ============================================

function openWhatsAppMenuKanban(leadId, event) {
    event.stopPropagation();
    
    // Find lead data
    const card = document.querySelector(`[data-id="${leadId}"]`);
    if (!card) return;
    
    const leadData = {
        id: leadId,
        name: card.querySelector('.lead-name').textContent,
        phone: card.querySelector('.lead-phone').textContent.replace(/\D/g, ''),
        appointment_date: card.dataset.appointmentDate || null
    };
    
    // Use shared WhatsApp helper
    openWhatsAppMenu(event.currentTarget, leadData, card);
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
    card.className = 'lead-card rounded-lg shadow p-4 border border-gray-200 relative';
    card.draggable = true;
    card.dataset.id = lead.id;
    card.dataset.status = lead.status || 'novo';

    // SMART TAGS - Parse lead.type for detailed information
    let typeBadge = '';
    let consultaDetails = '';
    
    // Novo formato: "Consulta - Especialidade - Plano/Particular - Período - Dias"
    if (lead.type && lead.type.startsWith('Consulta - ')) {
        const parts = lead.type.split(' - ');
        const specialty = parts[1] || '';
        const paymentType = parts[2] || '';
        const period = parts[3] || '';
        const days = parts[4] || '';
        
        typeBadge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-teal-400 text-white border border-teal-500"><i class="fas fa-stethoscope mr-1"></i>Consulta</span>';
        
        consultaDetails = `
            <div class="bg-gray-800/50 rounded-lg p-2 mb-2 space-y-1 text-xs">
                ${specialty ? `<div class="flex items-center text-cyan-300"><i class="fas fa-user-md mr-1 w-4"></i><strong>Especialidade:</strong> <span class="ml-1 text-white">${specialty}</span></div>` : ''}
                ${paymentType ? `<div class="flex items-center text-green-300"><i class="fas fa-credit-card mr-1 w-4"></i><strong>Pagamento:</strong> <span class="ml-1 text-white">${paymentType}</span></div>` : ''}
                ${period ? `<div class="flex items-center text-yellow-300"><i class="fas fa-clock mr-1 w-4"></i><strong>Período:</strong> <span class="ml-1 text-white">${period}</span></div>` : ''}
                ${days ? `<div class="flex items-center text-purple-300"><i class="fas fa-calendar mr-1 w-4"></i><strong>Dias:</strong> <span class="ml-1 text-white">${days}</span></div>` : ''}
            </div>
        `;
    }
    // Formatos antigos e outros tipos
    else if (lead.type === 'primeira_consulta') {
        typeBadge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-yellow-400 text-gray-900 border border-yellow-500"><i class="fas fa-star mr-1"></i>Primeira Consulta</span>';
    } else if (lead.type === 'retorno') {
        typeBadge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-gray-300 text-gray-900 border border-gray-400"><i class="fas fa-undo mr-1"></i>Retorno</span>';
    } else if (lead.type === 'recorrente') {
        typeBadge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-indigo-400 text-white border border-indigo-500"><i class="fas fa-sync-alt mr-1"></i>Sessão/Recorrente</span>';
    } else if (lead.type === 'Atendimento Humano') {
        typeBadge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-pink-400 text-white border border-pink-500"><i class="fas fa-user-headset mr-1"></i>Atend. Humano</span>';
    } else if (lead.type === 'Consulta') {
        typeBadge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-teal-400 text-white border border-teal-500"><i class="fas fa-stethoscope mr-1"></i>Consulta</span>';
    } else {
        typeBadge = '<span class="px-2 py-0.5 rounded text-xs font-bold bg-gray-300 text-gray-900 border border-gray-400"><i class="fas fa-question mr-1"></i>' + (lead.type || 'Geral') + '</span>';
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

    let timeClasses = diffMinutes < 15 ? 'text-gray-200 font-medium' : 'text-red-400 font-bold animate-pulse';

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
    
    // Attendance status badge
    const attendanceLabels = {
        'compareceu': '<span class="px-2 py-0.5 rounded text-xs font-bold bg-green-400/20 text-green-300 border border-green-400/30"><i class="fas fa-check mr-1"></i>Compareceu</span>',
        'nao_compareceu': '<span class="px-2 py-0.5 rounded text-xs font-bold bg-red-400/20 text-red-300 border border-red-400/30"><i class="fas fa-times mr-1"></i>Não veio</span>',
        'cancelado': '<span class="px-2 py-0.5 rounded text-xs font-bold bg-gray-400/20 text-gray-300 border border-gray-400/30"><i class="fas fa-ban mr-1"></i>Cancelado</span>',
        'remarcado': '<span class="px-2 py-0.5 rounded text-xs font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30"><i class="fas fa-calendar-alt mr-1"></i>Remarcado</span>'
    };
    const attendanceBadge = lead.attendance_status ? attendanceLabels[lead.attendance_status] || '' : '';

    card.innerHTML = `
        ${notesIndicator}
        
        <!-- SMART TAGS & WAIT TIME TRACKER -->
        <div class="flex justify-between items-start mb-2">
            <div class="flex items-center flex-wrap gap-1">
                ${typeBadge}
            </div>
            <small class="${timeClasses}">🕒 ${timeString}</small>
        </div>
        
        <!-- Consulta Details (if new format) -->
        ${consultaDetails}
        
        <!-- Attendance Status Badge (if exists) -->
        ${attendanceBadge ? `<div class="mb-2">${attendanceBadge}</div>` : ''}
        
        <!-- Edit/Delete/Move buttons -->
        <div class="flex items-center justify-end space-x-2 mb-2">
            <button onclick="openMoveModal(${lead.id}, '${lead.status || 'novo'}', '${lead.name}')" class="md:hidden text-gray-300 hover:text-purple-400 transition" title="Mover">
                <i class="fas fa-arrows-alt text-xs"></i>
            </button>
            <button onclick="openEditModal(${lead.id}, '${lead.name}', '${lead.appointment_date || ''}', '${lead.doctor || ''}', \`${(lead.notes || '').replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`, '${lead.type || ''}')" class="text-gray-300 hover:text-blue-400 transition" title="Editar">
                <i class="fas fa-pen text-xs"></i>
            </button>
            <button onclick="deleteLead(${lead.id})" class="text-gray-300 hover:text-red-400 transition" title="Excluir">
                <i class="fas fa-trash text-xs"></i>
            </button>
        </div>
        
        <!-- Patient Name -->
        <h3 class="font-semibold text-white mb-2 lead-name">${lead.name}</h3>
        
        <!-- Appointment Badge -->
        ${appointmentBadge}
        
        <!-- Phone & Actions -->
        <div class="space-y-2">
            <div class="flex items-center justify-between">
                <span class="text-xs text-gray-100 font-medium lead-phone">
                    <i class="fas fa-phone mr-1 text-cyan-400"></i>${formatPhone(lead.phone)}
                </span>
                <button 
                    onclick="openWhatsAppMenuKanban(${lead.id}, event)"
                    class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition flex items-center relative">
                    <i class="fab fa-whatsapp mr-1"></i> WhatsApp
                    <i class="fas fa-chevron-down ml-1 text-xs"></i>
                </button>
            </div>
            
            <!-- Smart Reminder Button -->
            ${reminderButton}
        </div>
    `;
    
    // Store appointment_date in dataset for WhatsApp menu
    if (lead.appointment_date) {
        card.dataset.appointmentDate = lead.appointment_date;
    }

    // Event listeners for drag (desktop only)
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
    // Get status from the column itself or from parent if dropped on inner div
    const newStatus = dropZone.dataset.status || dropZone.parentElement.dataset.status;
    const leadId = currentDraggedCard.dataset.id;
    const oldStatus = currentDraggedCard.dataset.status;

    // If same column, do nothing
    if (newStatus === oldStatus) {
        return;
    }

    // Find the correct container to append the card (the div with id="column-*")
    const columnContainer = dropZone.querySelector('[id^="column-"]') || dropZone;
    
    // Move card visually
    columnContainer.appendChild(currentDraggedCard);
    currentDraggedCard.dataset.status = newStatus;

    // If moving to "Finalizado", ask for attendance status
    let attendanceStatus = null;
    if (newStatus === 'Finalizado' || newStatus === 'finalizado') {
        const result = await customPromptOptions(
            'Qual foi o resultado da consulta?',
            [
                { value: 'compareceu', label: 'Compareceu', icon: 'fas fa-check-circle' },
                { value: 'nao_compareceu', label: 'Não veio', icon: 'fas fa-times-circle' },
                { value: 'cancelado', label: 'Cancelado', icon: 'fas fa-ban' },
                { value: 'remarcado', label: 'Remarcado', icon: 'fas fa-calendar-alt' }
            ]
        );
        
        attendanceStatus = result || 'compareceu';
    }

    // Update backend
    try {
        const body = { status: newStatus };
        if (attendanceStatus) {
            body.attendance_status = attendanceStatus;
        }
        
        const response = await fetch(`${API_URL}/${leadId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
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

// ============================================
// MOBILE MOVE MODAL
// ============================================

let currentMoveLeadId = null;
let currentMoveLeadStatus = null;

function openMoveModal(leadId, currentStatus, leadName) {
    currentMoveLeadId = leadId;
    currentMoveLeadStatus = currentStatus;
    
    const modal = document.getElementById('moveModal');
    const leadNameElement = document.getElementById('moveLeadName');
    
    if (leadNameElement) {
        leadNameElement.textContent = leadName;
    }
    
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeMoveModal() {
    const modal = document.getElementById('moveModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentMoveLeadId = null;
    currentMoveLeadStatus = null;
}

async function moveToColumn(newStatus) {
    if (!currentMoveLeadId || newStatus === currentMoveLeadStatus) {
        closeMoveModal();
        return;
    }
    
    // If moving to "Finalizado", ask for attendance status
    let attendanceStatus = null;
    if (newStatus === 'Finalizado' || newStatus === 'finalizado') {
        const result = await customPromptOptions(
            'Qual foi o resultado da consulta?',
            [
                { value: 'compareceu', label: 'Compareceu', icon: 'fas fa-check-circle' },
                { value: 'nao_compareceu', label: 'Não veio', icon: 'fas fa-times-circle' },
                { value: 'cancelado', label: 'Cancelado', icon: 'fas fa-ban' },
                { value: 'remarcado', label: 'Remarcado', icon: 'fas fa-calendar-alt' }
            ]
        );
        
        attendanceStatus = result || 'compareceu';
    }
    
    showLoading(true);
    
    try {
        const body = { status: newStatus };
        if (attendanceStatus) {
            body.attendance_status = attendanceStatus;
        }
        
        const response = await fetch(`${API_URL}/${currentMoveLeadId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar status');
        }

        // Haptic feedback for success
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        showNotification('✅ Status atualizado com sucesso!', 'success');
        closeMoveModal();
        loadLeads();

    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showNotification('❌ Erro ao atualizar status', 'error');
    } finally {
        showLoading(false);
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
    
    // Store original type in a hidden field
    const originalTypeInput = document.getElementById('editOriginalType') || (() => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.id = 'editOriginalType';
        document.getElementById('editForm').appendChild(input);
        return input;
    })();
    originalTypeInput.value = type || '';
    
    // Only set the select value if it matches one of the predefined options
    const typeSelect = document.getElementById('editType');
    const validOptions = ['primeira_consulta', 'retorno', 'recorrente', 'exame'];
    if (validOptions.includes(type)) {
        typeSelect.value = type;
    } else {
        typeSelect.value = ''; // Don't select anything if it's a custom type from chat
    }
    
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
            const typeSelect = document.getElementById('editType').value;
            const originalType = document.getElementById('editOriginalType')?.value || '';

            // Convert appointmentDate to ISO format if provided
            let isoDate = null;
            if (appointmentDate) {
                try {
                    isoDate = new Date(appointmentDate).toISOString();
                } catch (err) {
                    console.error('Erro ao converter data:', err);
                    showNotification('❌ Data inválida', 'error');
                    return;
                }
            }

            // Only update type if user selected a new value from dropdown
            // If dropdown is empty, keep the original type (preserves detailed chat types)
            const finalType = typeSelect ? typeSelect : originalType;

            console.log('Salvando lead:', { leadId, isoDate, doctor, notes, finalType, originalType });

            // Build update object only with fields that should be updated
            const updateData = {
                appointment_date: isoDate,
                doctor: doctor || null,
                notes: notes || null
            };
            
            // Only include type if it was explicitly changed
            if (typeSelect) {
                updateData.type = typeSelect;
            }

            try {
                const response = await fetch(`${API_URL}/${leadId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updateData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Erro do servidor:', errorData);
                    throw new Error(errorData.error || 'Erro ao atualizar agendamento');
                }

                showNotification('✅ Agendamento atualizado com sucesso!', 'success');
                closeEditModal();
                loadLeads();

            } catch (error) {
                console.error('Erro ao atualizar agendamento:', error);
                showNotification('❌ Erro ao atualizar agendamento: ' + error.message, 'error');
            }
        });
    }

    // Load leads on page load
    loadLeads();

    // Auto-refresh every 10 seconds
    setInterval(loadLeads, 10000);
});
