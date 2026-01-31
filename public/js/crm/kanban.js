// ============================================
// Kanban Board - Lead Management System with JWT Auth
// ============================================

const token = sessionStorage.getItem('MEDICAL_CRM_TOKEN');
if (!token) {
    alert('Sessão inválida. Faça login novamente.');
    window.location.href = '/login.html';
}

// Import centralized time formatter
import { formatTime } from '../utils/formatters.js';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extrai o horário de uma data ISO
 * @param {string} datetime - Data no formato ISO (2024-01-31T08:00:00)
 * @returns {string} Horário no formato HH:MM
 */
function extractTimeFromDate(datetime) {
    if (!datetime) return '00:00';
    try {
        const date = new Date(datetime);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (e) {
        return '00:00';
    }
}

// ============================================
// POPULATE INSURANCE SELECTS FROM CLINIC SETTINGS
// ============================================
async function populateInsuranceSelectsFromClinic() {
    try {
        // Check cache first
        const cached = localStorage.getItem('clinicSettings');
        let settings;
        
        if (cached) {
            const { settings: cachedSettings, timestamp } = JSON.parse(cached);
            const now = Date.now();
            if (now - timestamp < 5 * 60 * 1000) { // 5 min cache
                settings = cachedSettings;
                console.log('✅ Using cached insurance plans');
            }
        }
        
        // Fetch if no cache
        if (!settings) {
            const response = await fetch('/api/clinic/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                settings = await response.json();
                localStorage.setItem('clinicSettings', JSON.stringify({
                    settings,
                    timestamp: Date.now()
                }));
                console.log('✅ Loaded insurance plans from API');
            }
        }
        
        // Populate select
        const selectIds = ['editInsuranceName'];
        const plans = settings?.insurancePlans || ['Particular', 'Unimed', 'Bradesco Saúde', 'Amil'];
        
        selectIds.forEach(selectId => {
            const selectElement = document.getElementById(selectId);
            if (selectElement) {
                // Clear existing options except first (Particular/None)
                selectElement.innerHTML = '<option value="">Selecione</option>';
                
                // Add clinic plans
                plans.forEach(plan => {
                    const option = document.createElement('option');
                    option.value = plan;
                    option.textContent = plan;
                    selectElement.appendChild(option);
                });
                
                console.log(`✅ Populated ${selectId} with ${plans.length} plans`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error populating insurance selects:', error);
        // Fallback to defaults
        const selectIds = ['editInsuranceName'];
        const fallbackPlans = ['Particular', 'Unimed', 'Bradesco Saúde', 'Amil'];
        
        selectIds.forEach(selectId => {
            const selectElement = document.getElementById(selectId);
            if (selectElement) {
                selectElement.innerHTML = '<option value="">Selecione</option>';
                fallbackPlans.forEach(plan => {
                    const option = document.createElement('option');
                    option.value = plan;
                    option.textContent = plan;
                    selectElement.appendChild(option);
                });
            }
        });
    }
}

// ============================================
// Date Filter State & Persistence
// ============================================

// Load saved date filter from localStorage (default: 7days)
let currentDateFilter = localStorage.getItem('kanbanDateFilter') || '7days';

// Handle date filter change
function handleDateFilterChange() {
    const dateFilterSelect = document.getElementById('dateFilter');
    if (!dateFilterSelect) return;
    
    currentDateFilter = dateFilterSelect.value;
    
    // Save preference to localStorage
    localStorage.setItem('kanbanDateFilter', currentDateFilter);
    
    // Visual feedback
    showLoading(true);
    
    // Reload leads with new filter
    loadLeads();
    
    // User feedback toast
    const filterLabels = {
        'today': 'Hoje',
        '7days': 'Últimos 7 Dias',
        '30days': 'Últimos 30 Dias',
        'thisMonth': 'Este Mês',
        'all': 'Todo o Histórico'
    };
    
    showNotification(`📅 Filtro atualizado: ${filterLabels[currentDateFilter]}`, 'info');
}

// Expose function globally for onclick handler
window.handleDateFilterChange = handleDateFilterChange;

// ============================================
// BUSINESS METRICS CALCULATIONS
// ============================================

/**
 * Calculate and update modern business metrics
 */
function updateBusinessMetrics(leads) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        // 1. DAILY REVENUE (Estimated)
        const todayLeads = leads.filter(lead => {
            if (!lead.appointment_date) return false;
            const apptDate = lead.appointment_date.split('T')[0];
            return apptDate === todayStr && lead.status !== 'archived';
        });
        
        let dailyRevenue = 0;
        todayLeads.forEach(lead => {
            const financial = parseFinancialData(lead.notes);
            if (financial.paymentValue && financial.paymentValue > 0) {
                dailyRevenue += parseFloat(financial.paymentValue);
            } else {
                // Default estimates based on type
                if (lead.type === 'Consulta') dailyRevenue += 300;
                else if (lead.type === 'Exame') dailyRevenue += 150;
                else if (lead.type === 'retorno') dailyRevenue += 100;
                else dailyRevenue += 200; // Default
            }
        });
        
        document.getElementById('dailyRevenue').textContent = formatCurrency(dailyRevenue);
        
        // Calculate growth (compare with yesterday)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const yesterdayLeads = leads.filter(lead => {
            if (!lead.appointment_date) return false;
            const apptDate = lead.appointment_date.split('T')[0];
            return apptDate === yesterdayStr && lead.status !== 'archived';
        });
        
        let yesterdayRevenue = 0;
        yesterdayLeads.forEach(lead => {
            const financial = parseFinancialData(lead.notes);
            if (financial.paymentValue && financial.paymentValue > 0) {
                yesterdayRevenue += parseFloat(financial.paymentValue);
            } else {
                if (lead.type === 'Consulta') yesterdayRevenue += 300;
                else if (lead.type === 'Exame') yesterdayRevenue += 150;
                else if (lead.type === 'retorno') yesterdayRevenue += 100;
                else yesterdayRevenue += 200;
            }
        });
        
        let growthPercent = 0;
        if (yesterdayRevenue > 0) {
            growthPercent = ((dailyRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(0);
        }
        
        const growthEl = document.getElementById('revenueGrowth');
        if (growthPercent > 0) {
            growthEl.innerHTML = `<i class="fa-solid fa-arrow-trend-up mr-1"></i> +${growthPercent}% vs Ontem`;
            growthEl.className = 'text-emerald-400';
        } else if (growthPercent < 0) {
            growthEl.innerHTML = `<i class="fa-solid fa-arrow-trend-down mr-1"></i> ${growthPercent}% vs Ontem`;
            growthEl.className = 'text-red-400';
        } else {
            growthEl.textContent = '0% vs Ontem';
            growthEl.className = 'text-slate-400';
        }
        
        // 2. TOMORROW'S CONFIRMATIONS
        const tomorrowLeads = leads.filter(lead => {
            if (!lead.appointment_date) return false;
            const apptDate = lead.appointment_date.split('T')[0];
            return apptDate === tomorrowStr && lead.status === 'agendado';
        });
        
        document.getElementById('tomorrowCount').textContent = tomorrowLeads.length;
        
        // 3. TODAY'S AGENDA OCCUPANCY
        const todayScheduled = todayLeads.length;
        const maxCapacity = 10; // Can be made dynamic from clinic settings
        const occupancyPercent = maxCapacity > 0 ? Math.round((todayScheduled / maxCapacity) * 100) : 0;
        
        document.getElementById('todayAppointments').textContent = todayScheduled;
        document.getElementById('occupancyBadge').textContent = `${occupancyPercent}% Cheia`;
        document.getElementById('occupancyBar').style.width = `${Math.min(occupancyPercent, 100)}%`;
        
        // Change bar color based on occupancy
        const occupancyBar = document.getElementById('occupancyBar');
        if (occupancyPercent >= 80) {
            occupancyBar.className = 'bg-emerald-500 h-1.5 rounded-full transition-all duration-500';
        } else if (occupancyPercent >= 50) {
            occupancyBar.className = 'bg-amber-500 h-1.5 rounded-full transition-all duration-500';
        } else {
            occupancyBar.className = 'bg-blue-500 h-1.5 rounded-full transition-all duration-500';
        }
        
        // 4. AVERAGE TICKET
        const completedLeads = leads.filter(l => 
            l.attendance_status === 'compareceu' && l.status === 'finalizado'
        );
        
        let totalRevenue = 0;
        completedLeads.forEach(lead => {
            const financial = parseFinancialData(lead.notes);
            if (financial.paymentValue && financial.paymentValue > 0) {
                totalRevenue += parseFloat(financial.paymentValue);
            } else {
                if (lead.type === 'Consulta') totalRevenue += 300;
                else if (lead.type === 'Exame') totalRevenue += 150;
                else if (lead.type === 'retorno') totalRevenue += 100;
                else totalRevenue += 200;
            }
        });
        
        const avgTicket = completedLeads.length > 0 ? totalRevenue / completedLeads.length : 0;
        document.getElementById('averageTicket').textContent = formatCurrency(avgTicket);
        
        console.log('✅ Business metrics updated:', {
            dailyRevenue: formatCurrency(dailyRevenue),
            tomorrowConfirmations: tomorrowLeads.length,
            todayOccupancy: `${occupancyPercent}%`,
            averageTicket: formatCurrency(avgTicket)
        });
        
    } catch (error) {
        console.error('❌ Error updating business metrics:', error);
    }
}

/**
 * Send WhatsApp reminders to tomorrow's appointments
 */
async function sendTomorrowReminders() {
    try {
        const token = sessionStorage.getItem('MEDICAL_CRM_TOKEN') || sessionStorage.getItem('token');
        
        const response = await fetch('/api/leads', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch leads');
        
        const leads = await response.json();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const tomorrowLeads = leads.filter(lead => {
            if (!lead.appointment_date) return false;
            const apptDate = lead.appointment_date.split('T')[0];
            return apptDate === tomorrowStr && lead.status === 'agendado';
        });
        
        if (tomorrowLeads.length === 0) {
            showNotification('ℹ️ Nenhum agendamento para amanhã', 'info');
            return;
        }
        
        // Open WhatsApp for first patient
        const lead = tomorrowLeads[0];
        const phone = lead.phone.replace(/\D/g, '');
        const apptTime = extractTimeFromDate(lead.appointment_date);
        
        const message = `Olá ${lead.name}! 😊\n\nEste é um lembrete da sua consulta *amanhã* às *${apptTime}*.\n\nAguardamos você!\n\nSe precisar reagendar, responda esta mensagem.`;
        
        const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        showNotification(`✅ WhatsApp aberto para ${lead.name}. Total de ${tomorrowLeads.length} pacientes amanhã.`, 'success');
        
        // Log other patients if more than 1
        if (tomorrowLeads.length > 1) {
            console.log('📋 Outros pacientes para amanhã:', tomorrowLeads.map(l => `${l.name} - ${l.phone}`));
        }
        
    } catch (error) {
        console.error('❌ Error sending reminders:', error);
        showNotification('❌ Erro ao enviar lembretes', 'error');
    }
}

/**
 * Format currency helper
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

// Expose functions globally
window.sendTomorrowReminders = sendTomorrowReminders;
window.updateBusinessMetrics = updateBusinessMetrics;

// ============================================
// Timer Calculation - Time in Status Feature
// ============================================

function calculateTimer(lead) {
    // CASE A: Status = 'agendado' → Countdown or Delay monitor
    if (lead.status === 'agendado' && lead.appointment_date) {
        const appointmentDate = new Date(lead.appointment_date);
        const now = new Date();
        const diff = appointmentDate - now;
        const diffMs = Math.abs(diff);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diff > 0) {
            // Upcoming appointment - countdown
            return {
                text: `Faltam ${hours}h ${minutes}m`,
                classes: 'text-blue-400 font-medium',
                tooltip: `Agendado para ${appointmentDate.toLocaleString('pt-BR')}`
            };
        } else {
            // Overdue appointment
            return {
                text: `Atraso: ${hours}h ${minutes}m`,
                classes: 'text-red-500 font-bold animate-pulse',
                tooltip: `Deveria ter ocorrido em ${appointmentDate.toLocaleString('pt-BR')}`
            };
        }
    }
    
    // CASE B: Other statuses → Time in current status (SLA Monitor)
    const statusDate = new Date(lead.status_updated_at || lead.created_at);
    const now = new Date();
    const diffMs = now - statusDate;
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(hours / 24);
    
    let timeText = '';
    if (days > 0) {
        timeText = `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
        timeText = `${hours}h ${minutes}m`;
    } else {
        timeText = `${minutes}m`;
    }
    
    // SLA Color Coding: Green < 2h | Yellow 2h-24h | Red > 24h
    let classes = '';
    if (hours < 2) {
        classes = 'text-green-400 font-medium';
    } else if (hours < 24) {
        classes = 'text-yellow-400 font-bold';
    } else {
        classes = 'text-red-500 font-bold animate-pulse';
    }
    
    return {
        text: timeText,
        classes: classes,
        tooltip: `Neste status há ${timeText} (desde ${statusDate.toLocaleString('pt-BR')})`
    };
}

// ============================================
// Financial Helper Functions
// ============================================

// Toggle insurance field visibility based on payment type
function toggleInsuranceField() {
    const paymentType = document.getElementById('editPaymentType').value;
    const insuranceContainer = document.getElementById('insuranceNameContainer');
    
    if (paymentType === 'plano') {
        insuranceContainer.classList.remove('hidden');
    } else {
        insuranceContainer.classList.add('hidden');
        document.getElementById('editInsuranceName').value = '';
    }
}

// Format currency to Brazilian Real (R$ X.XXX,XX)
function formatCurrency(value) {
    if (!value) return '';
    const number = parseCurrency(value);
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(number);
}

// Parse currency string to number
function parseCurrency(value) {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

// Parse financial data from notes JSON
function parseFinancialData(notes) {
    if (!notes) return { paymentType: '', insuranceName: '', paymentValue: '' };
    
    try {
        // Look for JSON embedded in notes like: {"financial":{"paymentType":"particular","value":"250.00"}}
        const match = notes.match(/\{"financial":\{[^}]+\}\}/);
        if (match) {
            const data = JSON.parse(match[0]);
            return {
                paymentType: data.financial.paymentType || '',
                insuranceName: data.financial.insuranceName || '',
                paymentValue: data.financial.value || ''
            };
        }
    } catch (e) {
        console.log('No financial data found in notes');
    }
    
    return { paymentType: '', insuranceName: '', paymentValue: '' };
}

// Encode financial data into notes as JSON
function encodeFinancialData(notes, financialData) {
    // Remove any existing financial JSON
    const cleanNotes = notes.replace(/\{"financial":\{[^}]+\}\}/g, '').trim();
    
    // Add new financial JSON if data exists
    if (financialData.paymentType || financialData.paymentValue) {
        const financialJson = JSON.stringify({
            financial: {
                paymentType: financialData.paymentType,
                insuranceName: financialData.insuranceName || '',
                value: financialData.paymentValue || ''
            }
        });
        return `${cleanNotes}\n${financialJson}`.trim();
    }
    
    return cleanNotes;
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
        // Build URL with date filter
        let url = `${API_URL}?view=kanban`;
        
        // Add date filter parameter
        if (currentDateFilter && currentDateFilter !== 'all') {
            url += `&period=${currentDateFilter}`;
        }
        
        console.log('Loading leads with filter:', currentDateFilter);
        
        const response = await fetch(url, {
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
        
        // Update business metrics after rendering leads
        updateBusinessMetrics(leads);
        
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

    // INTELLIGENT TIMER - Time in Status Feature
    const timer = calculateTimer(lead);
    const timeString = timer.text;
    const timeClasses = timer.classes;
    const timeTooltip = timer.tooltip;

    // SMART REMINDER - Check for upcoming appointments
    let reminderButton = '';
    let appointmentBadge = '';
    
    if (lead.appointment_date) {
        const appointmentDate = new Date(lead.appointment_date);
        const now = new Date(); // FIX: Declare now variable
        const formattedDate = appointmentDate.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        const timeOnly = formatTime(appointmentDate);
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
    
    // Financial badges from notes
    const financialData = parseFinancialData(lead.notes);
    let financialBadges = '';
    
    if (financialData.paymentType) {
        const paymentIcons = {
            'particular': '💵 Particular',
            'plano': `🏥 ${financialData.insuranceName || 'Plano'}`,
            'retorno': '🔄 Retorno'
        };
        const paymentLabel = paymentIcons[financialData.paymentType] || financialData.paymentType;
        
        financialBadges += `
            <div class="flex items-center gap-2 mb-2 flex-wrap">
                <span class="px-2 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ${paymentLabel}
                </span>
        `;
        
        if (financialData.paymentValue && parseFloat(financialData.paymentValue) > 0) {
            financialBadges += `
                <span class="px-2 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                    💰 ${formatCurrency(financialData.paymentValue)}
                </span>
            `;
        }
        
        financialBadges += `</div>`;
    }
    
    // Attendance status badge - STRICT RULES
    const currentStatus = (lead.status || '').toLowerCase().trim();
    let attendanceBadge = '';
    
    if (lead.attendance_status) {
        const attendanceStatus = lead.attendance_status.toLowerCase().trim();
        const attendanceLabels = {
            'compareceu': '<span class="px-2 py-0.5 rounded text-xs font-bold bg-green-400/20 text-green-300 border border-green-400/30"><i class="fas fa-check mr-1"></i>Compareceu</span>',
            'nao_compareceu': '<span class="px-2 py-0.5 rounded text-xs font-bold bg-red-400/20 text-red-300 border border-red-400/30"><i class="fas fa-times mr-1"></i>Não veio</span>',
            'cancelado': '<span class="px-2 py-0.5 rounded text-xs font-bold bg-gray-400/20 text-gray-300 border border-gray-400/30"><i class="fas fa-ban mr-1"></i>Cancelado</span>',
            'remarcado': '<span class="px-2 py-0.5 rounded text-xs font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30"><i class="fas fa-calendar-alt mr-1"></i>Remarcado</span>'
        };
        
        // STRICT RULE 1: Outcome badges ONLY in Finalizados
        const outcomeStatuses = ['compareceu', 'nao_compareceu', 'cancelado'];
        if (outcomeStatuses.includes(attendanceStatus)) {
            if (currentStatus === 'finalizado') {
                attendanceBadge = attendanceLabels[attendanceStatus] || '';
            }
        }
        // STRICT RULE 2: Remarcado badge ONLY in Agendado/Em Atendimento
        else if (attendanceStatus === 'remarcado') {
            if (currentStatus === 'agendado' || currentStatus === 'em_atendimento') {
                attendanceBadge = attendanceLabels['remarcado'];
            }
        }
    }

    card.innerHTML = `
        ${notesIndicator}
        
        <!-- SMART TAGS & WAIT TIME TRACKER -->
        <div class="flex justify-between items-start mb-2">
            <div class="flex items-center flex-wrap gap-1">
                ${typeBadge}
            </div>
            <small class="${timeClasses}" title="${timeTooltip}">🕒 ${timeString}</small>
        </div>
        
        <!-- Consulta Details (if new format) -->
        ${consultaDetails}
        
        <!-- Financial Badges (payment info) -->
        ${financialBadges}
        
        <!-- Attendance Status Badge (if exists) -->
        ${attendanceBadge ? `<div class="mb-2">${attendanceBadge}</div>` : ''}
        
        <!-- Edit/Delete/Move buttons -->
        <div class="flex items-center justify-end space-x-2 mb-2">
            <button 
                class="md:hidden text-gray-300 hover:text-purple-400 transition lead-move-btn" 
                title="Mover"
                data-lead-id="${lead.id}"
                data-lead-status="${lead.status || 'novo'}"
                data-lead-name="${lead.name || ''}">
                <i class="fas fa-arrows-alt text-xs"></i>
            </button>
            <button 
                class="text-gray-300 hover:text-blue-400 transition lead-edit-btn" 
                title="Editar"
                data-lead-id="${lead.id}"
                data-lead-name="${lead.name || ''}"
                data-lead-date="${lead.appointment_date || ''}"
                data-lead-doctor="${lead.doctor || ''}"
                data-lead-notes="${(lead.notes || '').replace(/"/g, '&quot;')}"
                data-lead-type="${lead.type || ''}">
                <i class="fas fa-pen text-xs"></i>
            </button>
            <button 
                class="text-gray-300 hover:text-red-400 transition lead-delete-btn" 
                title="Excluir"
                data-lead-id="${lead.id}">
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
                    class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition flex items-center relative"
                    title="Abrir WhatsApp">
                    <i class="fab fa-whatsapp text-lg"></i>
                </button>
            </div>
            
            <!-- Smart Reminder Button -->
            ${reminderButton}
            
            <!-- Post-Attendance Actions (ONLY for Finalizados) -->
            ${currentStatus === 'finalizado' ? `
            <div class="flex space-x-2 mt-2">
                <button 
                    onclick="setupReturn(${lead.id})"
                    class="flex-1 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-white px-3 py-2 rounded text-xs transition border border-cyan-500/30 hover:border-cyan-500"
                    title="Agendar Retorno">
                    <i class="fas fa-calendar-plus mr-1"></i>Retorno
                </button>
                <button 
                    onclick="archiveLead(${lead.id})"
                    class="flex-1 bg-slate-500/20 hover:bg-slate-600 text-slate-300 hover:text-white px-3 py-2 rounded text-xs transition border border-slate-500/30 hover:border-slate-600"
                    title="Arquivar Lead">
                    <i class="fas fa-archive mr-1"></i>Arquivar
                </button>
            </div>
            ` : ''}
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

// Setup Return - Pre-fill modal for return appointment
async function setupReturn(leadId) {
    // Find lead data from the card
    const card = document.querySelector(`[data-id="${leadId}"]`);
    if (!card) {
        showNotification('❌ Lead não encontrado', 'error');
        return;
    }
    
    // Get lead data from card
    const leadName = card.querySelector('.lead-name').textContent;
    const leadPhone = card.querySelector('.lead-phone').textContent.replace(/\D/g, '');
    const currentType = card.dataset.type || '';
    const currentNotes = card.dataset.notes || '';
    
    // Pre-fill the edit modal with return type
    openEditModal(
        leadId,
        leadName,
        '', // No appointment date initially
        '', // No doctor initially
        currentNotes,
        'retorno' // Set type as return
    );
    
    // Change lead status to "Novo" (will restart the flow)
    try {
        showLoading(true);
        const response = await fetch(`${API_URL}/${leadId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: 'novo',
                type: 'retorno'
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao configurar retorno');
        }
        
        showNotification('🔄 Lead configurado para retorno! Complete os dados no modal.', 'success');
        loadLeads();
        
    } catch (error) {
        console.error('Erro ao configurar retorno:', error);
        showNotification('❌ Erro ao configurar retorno', 'error');
    } finally {
        showLoading(false);
    }
}

// Archive Lead - Move to archived status
async function archiveLead(leadId) {
    if (!confirm('Deseja arquivar este lead? Ele será movido para a área de arquivados.')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_URL}/${leadId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: 'archived'
            })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao arquivar lead');
        }
        
        showNotification('📦 Lead arquivado com sucesso!', 'success');
        loadLeads();
        
    } catch (error) {
        console.error('Erro ao arquivar lead:', error);
        showNotification('❌ Erro ao arquivar lead', 'error');
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

// ============================================
// DATE FORMATTING HELPERS
// ============================================

/**
 * Format date for datetime-local input
 * Handles multiple input formats (ISO 8601, SQL, Unix timestamp)
 * @param {string|Date|number} dateValue - Date in any format
 * @returns {string} Formatted date for datetime-local input (YYYY-MM-DDTHH:mm)
 */
function formatDateForInput(dateValue) {
    if (!dateValue) return '';
    
    try {
        // Handle different input types
        let dateObj;
        
        if (typeof dateValue === 'number') {
            // Unix timestamp (milliseconds)
            dateObj = new Date(dateValue);
        } else if (typeof dateValue === 'string') {
            // Handle SQL format: "YYYY-MM-DD HH:mm:ss"
            if (dateValue.includes(' ') && !dateValue.includes('T')) {
                dateValue = dateValue.replace(' ', 'T');
            }
            
            // Parse string to Date
            dateObj = new Date(dateValue);
        } else if (dateValue instanceof Date) {
            dateObj = dateValue;
        } else {
            console.warn('⚠️ Unknown date format:', dateValue);
            return '';
        }
        
        // Validate date
        if (isNaN(dateObj.getTime())) {
            console.warn('⚠️ Invalid date:', dateValue);
            return '';
        }
        
        // Format to YYYY-MM-DDTHH:mm (required by datetime-local)
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
        
    } catch (error) {
        console.error('❌ Error formatting date:', error, dateValue);
        return '';
    }
}

/**
 * Parse datetime-local input to ISO 8601 string
 * @param {string} inputValue - Value from datetime-local input
 * @returns {string|null} ISO 8601 formatted date string
 */
function parseDateFromInput(inputValue) {
    if (!inputValue) return null;
    
    try {
        // datetime-local format: YYYY-MM-DDTHH:mm
        const dateObj = new Date(inputValue);
        
        if (isNaN(dateObj.getTime())) {
            console.warn('⚠️ Invalid input date:', inputValue);
            return null;
        }
        
        return dateObj.toISOString();
        
    } catch (error) {
        console.error('❌ Error parsing input date:', error, inputValue);
        return null;
    }
}

// ============================================
// EDIT MODAL FUNCTIONS
// ============================================

// Edit Modal Functions
function openEditModal(leadId, leadName, appointmentDate, doctor, notes, type) {
    document.getElementById('editLeadId').value = leadId;
    document.getElementById('editLeadName').value = leadName;
    
    // ============================================
    // FIX: DATE FORMATTING FOR datetime-local INPUT
    // ============================================
    
    // The datetime-local input requires format: "YYYY-MM-DDTHH:mm"
    // Use helper function to format date correctly
    const formattedDate = formatDateForInput(appointmentDate);
    document.getElementById('editAppointmentDate').value = formattedDate;
    
    if (appointmentDate && formattedDate) {
        console.log('✅ Date formatted for input:', {
            original: appointmentDate,
            formatted: formattedDate
        });
    }
    
    document.getElementById('editDoctor').value = doctor || '';
    
    // Parse financial data from notes
    const financialData = parseFinancialData(notes);
    
    // Remove financial JSON from notes display
    const cleanNotes = notes ? notes.replace(/\{"financial":\{[^}]+\}\}/g, '').trim() : '';
    document.getElementById('editNotes').value = cleanNotes;
    
    // Set financial fields
    document.getElementById('editPaymentType').value = financialData.paymentType || '';
    document.getElementById('editInsuranceName').value = financialData.insuranceName || '';
    document.getElementById('editPaymentValue').value = financialData.paymentValue ? formatCurrency(financialData.paymentValue) : '';
    
    // Toggle insurance field visibility
    toggleInsuranceField();
    
    // Store original values to detect changes
    const originalDoctorInput = document.getElementById('editOriginalDoctor') || (() => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.id = 'editOriginalDoctor';
        document.getElementById('editForm').appendChild(input);
        return input;
    })();
    originalDoctorInput.value = doctor || '';
    
    const originalNotesInput = document.getElementById('editOriginalNotes') || (() => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.id = 'editOriginalNotes';
        document.getElementById('editForm').appendChild(input);
        return input;
    })();
    originalNotesInput.value = notes || '';
    
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
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize date filter from localStorage
    const dateFilterSelect = document.getElementById('dateFilter');
    if (dateFilterSelect) {
        dateFilterSelect.value = currentDateFilter;
    }
    
    // ============================================
    // POPULATE INSURANCE SELECTS WITH CLINIC DATA
    // ============================================
    await populateInsuranceSelectsFromClinic();
    
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
            const originalDoctor = document.getElementById('editOriginalDoctor')?.value || '';
            const originalNotes = document.getElementById('editOriginalNotes')?.value || '';
            
            // Get financial data
            const paymentType = document.getElementById('editPaymentType').value;
            const insuranceName = document.getElementById('editInsuranceName').value;
            const paymentValue = document.getElementById('editPaymentValue').value;

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

            // Encode financial data into notes
            const financialData = {
                paymentType: paymentType,
                insuranceName: insuranceName,
                paymentValue: parseCurrency(paymentValue).toFixed(2)
            };
            const finalNotes = encodeFinancialData(notes, financialData);

            // Build update object only with fields that were actually changed
            // This preserves existing data that wasn't modified
            const updateData = {};
            
            // Always update appointment_date if changed (including clearing it)
            if (isoDate !== null) {
                updateData.appointment_date = isoDate;
            }
            
            // Only update doctor if it was changed from original
            if (doctor !== originalDoctor) {
                updateData.doctor = doctor.trim() || null;
            }
            
            // Only update notes if it was changed from original
            // Compare final notes (with financial data) to original notes
            if (finalNotes !== originalNotes) {
                updateData.notes = finalNotes.trim() || null;
            }
            
            // Only include type if it was explicitly changed
            if (typeSelect) {
                updateData.type = typeSelect;
            }
            
            // If nothing changed, just close modal
            if (Object.keys(updateData).length === 0) {
                showNotification('ℹ️ Nenhuma alteração foi feita', 'info');
                closeEditModal();
                return;
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

    // Event delegation for lead card buttons
    document.addEventListener('click', (e) => {
        // Edit button
        const editBtn = e.target.closest('.lead-edit-btn');
        if (editBtn) {
            e.preventDefault();
            e.stopPropagation();
            const leadId = parseInt(editBtn.dataset.leadId);
            const leadName = editBtn.dataset.leadName || '';
            const leadDate = editBtn.dataset.leadDate || '';
            const leadDoctor = editBtn.dataset.leadDoctor || '';
            const leadNotes = (editBtn.dataset.leadNotes || '').replace(/&quot;/g, '"');
            const leadType = editBtn.dataset.leadType || '';
            console.log('Edit button clicked:', { leadId, leadName, leadDate, leadDoctor, leadType });
            openEditModal(leadId, leadName, leadDate, leadDoctor, leadNotes, leadType);
            return;
        }

        // Delete button
        const deleteBtn = e.target.closest('.lead-delete-btn');
        if (deleteBtn) {
            e.preventDefault();
            e.stopPropagation();
            const leadId = parseInt(deleteBtn.dataset.leadId);
            console.log('Delete button clicked:', leadId);
            deleteLead(leadId);
            return;
        }

        // Move button
        const moveBtn = e.target.closest('.lead-move-btn');
        if (moveBtn) {
            e.preventDefault();
            e.stopPropagation();
            const leadId = parseInt(moveBtn.dataset.leadId);
            const leadStatus = moveBtn.dataset.leadStatus || 'novo';
            const leadName = moveBtn.dataset.leadName || '';
            console.log('Move button clicked:', { leadId, leadStatus, leadName });
            openMoveModal(leadId, leadStatus, leadName);
            return;
        }
    });

    // Load leads on page load
    loadLeads();

    // Auto-refresh every 10 seconds
    setInterval(loadLeads, 10000);
});
