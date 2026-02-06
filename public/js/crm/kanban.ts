// ============================================
// Kanban Board - Lead Management System with JWT Auth (TypeScript)
// ============================================

declare function showConfirmModal(options: {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    icon?: string;
    variant?: string;
}): Promise<boolean>;

declare function showToast(options: {
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}): void;

declare function buildAvatarHTML(name: string, size?: 'sm' | 'md' | 'lg' | 'xl'): string;

// Tipos e interfaces
interface KanbanLead {
    id: number;
    name: string;
    phone: string;
    type: string;
    status: string;
    notes: string;
    doctor: string;
    appointment_date: string;
    end_time?: string;
    insurance: string;
    source: string;
    raw_id: number;
    created_at?: string;
    status_updated_at?: string;
    attendance_status?: string;
}

interface TimerResult {
    text: string;
    classes: string;
    tooltip: string;
}

interface FinancialData {
    paymentType: string;
    insuranceName: string;
    paymentValue: string;
}

interface PromptOption {
    value: string;
    label: string;
    icon: string;
}

interface StatusMap {
    [key: string]: string;
}

interface DateFilterLabels {
    [key: string]: string;
}

// Declarações de funções externas não definidas neste arquivo
declare function openWhatsAppMenu(
    anchor: HTMLElement,
    leadData: { id: number; name: string; phone: string; appointment_date: string | null },
    card: HTMLElement
): void;

declare function customPromptOptions(
    message: string,
    options: PromptOption[]
): Promise<string | null>;
declare function showLoading(show: boolean): void;
declare function showNotification(message: string, type: string): void;

// Declaração flatpickr
declare function flatpickr(
    element: HTMLElement | string,
    options: Record<string, unknown>
): FlatpickrInstance;
interface FlatpickrInstance {
    selectedDates: Date[];
    setDate(date: string | Date, triggerChange?: boolean): void;
    clear(): void;
    destroy(): void;
}

// Declaração de som de notificação
declare const notificationSound: HTMLAudioElement;

declare global {
    interface Window {
        handleDateFilterChange: () => void;
        sendTomorrowReminders: () => Promise<void>;
        updateBusinessMetrics: (leads: KanbanLead[]) => void;
        sendConfirmationWhatsApp: (phone: string, name: string, time: string) => void;
        filterLeads: (searchTerm: string) => void;
        clearSearch: () => void;
        dragStart: (e: DragEvent) => void;
        dragEnd: (e: DragEvent) => void;
        allowDrop: (e: DragEvent) => void;
        dragLeave: (e: DragEvent) => void;
        drop: (e: DragEvent) => Promise<void>;
        toggleInsuranceField: () => void;
        initializeDateTimePickers: () => void;
        archiveLead: (leadId: number | string) => Promise<void>;
        scheduleReturn: (leadId: number | string) => Promise<void>;
        setupReturn: (leadId: number | string) => Promise<void>;
        openMoveModal: (leadId: string, currentStatus: string, leadName: string) => void;
        closeMoveModal: () => void;
        moveToColumn: (newStatus: string) => Promise<void>;
        openWhatsAppMenuKanban: (leadId: number, event: MouseEvent) => void;
    }
}

const token: string | null =
    sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('accessToken');
if (!token) {
    showToast({ message: 'Sessão inválida. Faça login novamente.', type: 'warning' });
    window.location.href = '/login.html';
}

// Import centralized time formatter
import { formatTime } from '../utils/formatters.js';

// Ensure API_URL is available in module scope
const API_URL: string = window.API_URL || '/api/appointments';

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractTimeFromDate(datetime: string): string {
    if (!datetime) return '00:00';
    try {
        const date = new Date(datetime);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch {
        return '00:00';
    }
}

// ============================================
// POPULATE INSURANCE SELECTS FROM CLINIC SETTINGS
// ============================================
async function populateInsuranceSelectsFromClinic(): Promise<void> {
    try {
        const cached = localStorage.getItem('clinicSettings');
        let settings: { insurancePlans?: string[]; identity?: { name?: string } } | undefined;

        if (cached) {
            const { settings: cachedSettings, timestamp } = JSON.parse(cached);
            const now = Date.now();
            if (now - timestamp < 5 * 60 * 1000) {
                settings = cachedSettings;
                console.log('✅ Using cached insurance plans');
            }
        }

        if (!settings) {
            const response = await fetch('/api/clinic/info', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                settings = {
                    insurancePlans: data.clinic?.insurance_plans ||
                        data.insurance_plans || [
                            'Particular',
                            'Unimed',
                            'Bradesco Saúde',
                            'SulAmérica',
                            'Amil',
                        ],
                    identity: {
                        name: data.clinic?.name || data.name,
                    },
                };
                localStorage.setItem(
                    'clinicSettings',
                    JSON.stringify({
                        settings,
                        timestamp: Date.now(),
                    })
                );
                console.log('✅ Loaded insurance plans from API');
            }
        }

        const selectIds = ['editInsuranceName'];
        const plans = settings?.insurancePlans || [
            'Particular',
            'Unimed',
            'Bradesco Saúde',
            'Amil',
        ];

        selectIds.forEach((selectId) => {
            const selectElement = document.getElementById(selectId) as HTMLSelectElement | null;
            if (selectElement) {
                selectElement.innerHTML = '<option value="">Selecione</option>';

                plans.forEach((plan) => {
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
        const selectIds = ['editInsuranceName'];
        const fallbackPlans = ['Particular', 'Unimed', 'Bradesco Saúde', 'Amil'];

        selectIds.forEach((selectId) => {
            const selectElement = document.getElementById(selectId) as HTMLSelectElement | null;
            if (selectElement) {
                selectElement.innerHTML = '<option value="">Selecione</option>';
                fallbackPlans.forEach((plan) => {
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

let currentDateFilter: string = localStorage.getItem('kanbanDateFilter') || '7days';

function handleDateFilterChange(): void {
    const dateFilterSelect = document.getElementById('dateFilter') as HTMLSelectElement | null;
    if (!dateFilterSelect) return;

    currentDateFilter = dateFilterSelect.value;
    localStorage.setItem('kanbanDateFilter', currentDateFilter);
    showLoading(true);
    loadLeads();

    const filterLabels: DateFilterLabels = {
        today: 'Hoje',
        '7days': 'Últimos 7 Dias',
        '30days': 'Últimos 30 Dias',
        thisMonth: 'Este Mês',
        all: 'Todo o Histórico',
    };

    showNotification(`📅 Filtro atualizado: ${filterLabels[currentDateFilter]}`, 'info');
}

window.handleDateFilterChange = handleDateFilterChange;

// ============================================
// BUSINESS METRICS CALCULATIONS
// ============================================

function updateBusinessMetrics(leads: KanbanLead[]): void {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        // 1. DAILY REVENUE (Estimated)
        const todayLeads = leads.filter((lead) => {
            if (!lead.appointment_date) return false;
            const apptDate = lead.appointment_date.split('T')[0];
            return apptDate === todayStr && lead.status !== 'archived';
        });

        let dailyRevenue = 0;
        todayLeads.forEach((lead) => {
            const financial = parseFinancialData(lead.notes);
            if (financial.paymentValue && parseFloat(financial.paymentValue) > 0) {
                dailyRevenue += parseFloat(financial.paymentValue);
            } else {
                if (lead.type === 'Consulta') dailyRevenue += 300;
                else if (lead.type === 'Exame') dailyRevenue += 150;
                else if (lead.type === 'retorno') dailyRevenue += 100;
                else dailyRevenue += 200;
            }
        });

        const dailyRevenueEl = document.getElementById('dailyRevenue');
        if (dailyRevenueEl) dailyRevenueEl.textContent = formatCurrency(dailyRevenue);

        // Calculate growth
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const yesterdayLeads = leads.filter((lead) => {
            if (!lead.appointment_date) return false;
            const apptDate = lead.appointment_date.split('T')[0];
            return apptDate === yesterdayStr && lead.status !== 'archived';
        });

        let yesterdayRevenue = 0;
        yesterdayLeads.forEach((lead) => {
            const financial = parseFinancialData(lead.notes);
            if (financial.paymentValue && parseFloat(financial.paymentValue) > 0) {
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
            growthPercent = Number(
                (((dailyRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(0)
            );
        }

        const growthEl = document.getElementById('revenueGrowth');
        if (growthEl) {
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
        }

        // 2. TOMORROW'S CONFIRMATIONS
        const tomorrowLeads = leads.filter((lead) => {
            if (!lead.appointment_date) return false;
            const apptDate = lead.appointment_date.split('T')[0];
            return apptDate === tomorrowStr && lead.status === 'agendado';
        });

        const tomorrowCountEl = document.getElementById('tomorrowCount');
        if (tomorrowCountEl) tomorrowCountEl.textContent = String(tomorrowLeads.length);

        // 3. TODAY'S AGENDA OCCUPANCY
        const todayScheduled = todayLeads.length;
        const maxCapacity = 10;
        const occupancyPercent =
            maxCapacity > 0 ? Math.round((todayScheduled / maxCapacity) * 100) : 0;

        const todayAppointmentsEl = document.getElementById('todayAppointments');
        if (todayAppointmentsEl) todayAppointmentsEl.textContent = String(todayScheduled);

        const occupancyBadgeEl = document.getElementById('occupancyBadge');
        if (occupancyBadgeEl) occupancyBadgeEl.textContent = `${occupancyPercent}% Cheia`;

        const occupancyBarEl = document.getElementById('occupancyBar') as HTMLElement | null;
        if (occupancyBarEl) {
            occupancyBarEl.style.width = `${Math.min(occupancyPercent, 100)}%`;

            if (occupancyPercent >= 80) {
                occupancyBarEl.className =
                    'bg-emerald-500 h-1.5 rounded-full transition-all duration-500';
            } else if (occupancyPercent >= 50) {
                occupancyBarEl.className =
                    'bg-amber-500 h-1.5 rounded-full transition-all duration-500';
            } else {
                occupancyBarEl.className =
                    'bg-blue-500 h-1.5 rounded-full transition-all duration-500';
            }
        }

        // 4. AVERAGE TICKET
        const completedLeads = leads.filter(
            (l) => l.attendance_status === 'compareceu' && l.status === 'finalizado'
        );

        let totalRevenue = 0;
        completedLeads.forEach((lead) => {
            const financial = parseFinancialData(lead.notes);
            if (financial.paymentValue && parseFloat(financial.paymentValue) > 0) {
                totalRevenue += parseFloat(financial.paymentValue);
            } else {
                if (lead.type === 'Consulta') totalRevenue += 300;
                else if (lead.type === 'Exame') totalRevenue += 150;
                else if (lead.type === 'retorno') totalRevenue += 100;
                else totalRevenue += 200;
            }
        });

        const avgTicket = completedLeads.length > 0 ? totalRevenue / completedLeads.length : 0;
        const averageTicketEl = document.getElementById('averageTicket');
        if (averageTicketEl) averageTicketEl.textContent = formatCurrency(avgTicket);

        console.log('✅ Business metrics updated:', {
            dailyRevenue: formatCurrency(dailyRevenue),
            tomorrowConfirmations: tomorrowLeads.length,
            todayOccupancy: `${occupancyPercent}%`,
            averageTicket: formatCurrency(avgTicket),
        });
    } catch (error) {
        console.error('❌ Error updating business metrics:', error);
    }
}

async function sendTomorrowReminders(): Promise<void> {
    try {
        const authToken =
            sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('accessToken');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const response = await fetch(
            `/api/appointments?startDate=${tomorrowStr}&endDate=${tomorrowStr}T23:59:59`,
            {
                headers: { Authorization: `Bearer ${authToken}` },
            }
        );

        if (!response.ok) throw new Error('Failed to fetch appointments');

        const appointments = await response.json();

        const tomorrowLeads = (appointments as unknown[])
            .map((apt: unknown) => transformAppointmentToLead(apt as Record<string, unknown>))
            .filter((lead: KanbanLead) => lead.status === 'agendado');

        if (tomorrowLeads.length === 0) {
            showNotification('ℹ️ Nenhum agendamento para amanhã', 'info');
            return;
        }

        const lead = tomorrowLeads[0];
        const phone = (lead.phone || '').replace(/\D/g, '');
        const apptTime = extractTimeFromDate(lead.appointment_date);

        const message = `Olá ${lead.name}! 😊\n\nEste é um lembrete da sua consulta *amanhã* às *${apptTime}*.\n\nAguardamos você!\n\nSe precisar reagendar, responda esta mensagem.`;

        const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        showNotification(
            `✅ WhatsApp aberto para ${lead.name}. Total de ${tomorrowLeads.length} pacientes amanhã.`,
            'success'
        );

        if (tomorrowLeads.length > 1) {
            console.log(
                '📋 Outros pacientes para amanhã:',
                tomorrowLeads.map((l: KanbanLead) => `${l.name} - ${l.phone}`)
            );
        }
    } catch (error) {
        console.error('❌ Error sending reminders:', error);
        showNotification('❌ Erro ao enviar lembretes', 'error');
    }
}

async function openConfirmationQueue(): Promise<void> {
    const modal = document.getElementById('confirmationQueueModal');
    const listContainer = document.getElementById('confirmationList');

    if (!modal || !listContainer) {
        showNotification('❌ Modal de confirmação não encontrado', 'error');
        return;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    listContainer.innerHTML = `
        <div class="text-center py-8 text-slate-400">
            <i class="fa-solid fa-spinner fa-spin text-3xl mb-3"></i>
            <p>Carregando...</p>
        </div>
    `;

    try {
        const authToken =
            sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('accessToken');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const response = await fetch(
            `/api/appointments?startDate=${tomorrowStr}&endDate=${tomorrowStr}T23:59:59`,
            {
                headers: { Authorization: `Bearer ${authToken}` },
            }
        );

        if (!response.ok) throw new Error('Erro ao carregar agendamentos');

        const appointments = await response.json();

        const needsConfirmation = (appointments as unknown[])
            .map((apt: unknown) => transformAppointmentToLead(apt as Record<string, unknown>))
            .filter((lead: KanbanLead) => lead.status === 'agendado');

        if (needsConfirmation.length === 0) {
            listContainer.innerHTML = `
                <div class="text-center py-12">
                    <i class="fa-solid fa-check-circle text-emerald-400 text-5xl mb-4"></i>
                    <p class="text-white text-lg font-medium">Tudo certo!</p>
                    <p class="text-slate-400 mt-2">Nenhum paciente para confirmar amanhã.</p>
                </div>
            `;
            return;
        }

        let listHTML = '';
        needsConfirmation.forEach((lead: KanbanLead) => {
            const time = extractTimeFromDate(lead.appointment_date);
            const phone = (lead.phone || '').replace(/\D/g, '');

            listHTML += `
                <div class="flex items-center justify-between bg-slate-700/50 p-4 rounded-xl border border-slate-600/50 hover:border-emerald-500/30 transition">
                    <div class="flex items-center gap-3">
                        ${buildAvatarHTML(lead.name || 'P', 'md')}
                        <div>
                            <p class="text-white font-medium">${lead.name || 'Paciente'}</p>
                            <p class="text-slate-400 text-sm">
                                <i class="fa-solid fa-clock mr-1"></i>${time}
                                ${lead.phone ? ` • <i class="fa-solid fa-phone mr-1"></i>${lead.phone}` : ' • <span class="text-red-400">Sem telefone</span>'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onclick="sendConfirmationWhatsApp('${phone}', '${lead.name || 'Paciente'}', '${time}')"
                        class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 font-medium ${!phone ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${!phone ? 'disabled' : ''}
                    >
                        <i class="fa-brands fa-whatsapp"></i>
                        Enviar
                    </button>
                </div>
            `;
        });

        listContainer.innerHTML = listHTML;
    } catch (error) {
        console.error('❌ Error opening confirmation queue:', error);
        listContainer.innerHTML = `
            <div class="text-center py-8 text-red-400">
                <i class="fa-solid fa-exclamation-circle text-3xl mb-3"></i>
                <p>Erro ao carregar agendamentos</p>
                <p class="text-sm text-slate-500 mt-2">${(error as Error).message}</p>
            </div>
        `;
    }
}

function closeConfirmationQueue(): void {
    const modal = document.getElementById('confirmationQueueModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function sendConfirmationWhatsApp(phone: string, name: string, time: string): void {
    if (!phone) {
        showNotification('❌ Telefone não informado', 'error');
        return;
    }

    const message = `Olá ${name}! 😊

Este é um lembrete da sua consulta *amanhã* às *${time}*.

Por favor, confirme sua presença respondendo esta mensagem.

Aguardamos você! 🏥`;

    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    showNotification(`✅ WhatsApp aberto para ${name}`, 'success');
}

function formatCurrency(value: number | string): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(value) || 0);
}

// Expose functions globally
window.sendTomorrowReminders = sendTomorrowReminders;
window.updateBusinessMetrics = updateBusinessMetrics;
window.openConfirmationQueue = openConfirmationQueue;
window.closeConfirmationQueue = closeConfirmationQueue;
window.sendConfirmationWhatsApp = sendConfirmationWhatsApp;

// ============================================
// Timer Calculation - Time in Status Feature
// ============================================

function calculateTimer(lead: KanbanLead): TimerResult {
    // Status "agendado" — mostra countdown até a consulta
    if (lead.status === 'agendado' && lead.appointment_date) {
        const appointmentDate = new Date(lead.appointment_date);

        if (isNaN(appointmentDate.getTime())) {
            return { text: '', classes: '', tooltip: '' };
        }

        const now = new Date();
        const diff = appointmentDate.getTime() - now.getTime();
        const diffMs = Math.abs(diff);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diff > 0) {
            const timeStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
            return {
                text: `Faltam ${timeStr}`,
                classes: 'text-blue-400 font-medium',
                tooltip: `Agendado para ${appointmentDate.toLocaleString('pt-BR')}`,
            };
        } else {
            const timeStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
            return {
                text: `Atraso de ${timeStr}`,
                classes: 'text-red-500 font-bold animate-pulse',
                tooltip: `Deveria ter ocorrido em ${appointmentDate.toLocaleString('pt-BR')}`,
            };
        }
    }

    // Outros status — mostra tempo desde a última mudança de status
    const dateStr = lead.status_updated_at || lead.created_at;

    if (!dateStr) {
        return { text: '', classes: '', tooltip: '' };
    }

    const statusDate = new Date(dateStr);

    if (isNaN(statusDate.getTime())) {
        return { text: '', classes: '', tooltip: '' };
    }

    const now = new Date();
    const diffMs = Math.abs(now.getTime() - statusDate.getTime());
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(hours / 24);

    let timeText = '';
    if (days > 0) {
        timeText = `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
        timeText = `${hours}h ${minutes}min`;
    } else {
        timeText = `${minutes}min`;
    }

    // Rótulo descritivo conforme o status
    const statusLabels: Record<string, string> = {
        novo: 'Aguardando há',
        em_atendimento: 'Em atendimento há',
        finalizado: 'Finalizado há',
    };
    const label = statusLabels[lead.status] || 'Há';

    let classes = '';
    if (hours < 2) {
        classes = 'text-green-400 font-medium';
    } else if (hours < 24) {
        classes = 'text-yellow-400 font-bold';
    } else {
        classes = 'text-red-500 font-bold animate-pulse';
    }

    return {
        text: `${label} ${timeText}`,
        classes: classes,
        tooltip: `Neste status há ${timeText} (desde ${statusDate.toLocaleString('pt-BR')})`,
    };
}

// ============================================
// Financial Helper Functions
// ============================================

function toggleInsuranceField(): void {
    const paymentType = (document.getElementById('editPaymentType') as HTMLSelectElement).value;
    const insuranceContainer = document.getElementById('insuranceNameContainer');
    const insuranceSelect = document.getElementById(
        'editInsuranceName'
    ) as HTMLSelectElement | null;

    if (paymentType === 'plano') {
        insuranceContainer?.classList.remove('hidden');

        if (insuranceSelect) {
            const particularOption = insuranceSelect.querySelector('option[value="Particular"]');
            if (particularOption) {
                particularOption.remove();
            }
            if (insuranceSelect.value === 'Particular' || insuranceSelect.value === '') {
                insuranceSelect.selectedIndex = 0;
            }
        }
    } else {
        insuranceContainer?.classList.add('hidden');
        if (insuranceSelect) insuranceSelect.value = '';
        populateInsuranceSelectsFromClinic();
    }
}

function parseCurrency(value: string | number): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

function parseFinancialData(notes: string): FinancialData {
    if (!notes) return { paymentType: '', insuranceName: '', paymentValue: '' };

    try {
        const match = notes.match(/\{"financial":\{[^}]+\}\}/);
        if (match) {
            const data = JSON.parse(match[0]);
            return {
                paymentType: data.financial.paymentType || '',
                insuranceName: data.financial.insuranceName || '',
                paymentValue: data.financial.value || '',
            };
        }
    } catch {
        console.log('No financial data found in notes');
    }

    return { paymentType: '', insuranceName: '', paymentValue: '' };
}

function encodeFinancialData(notes: string, financialData: FinancialData): string {
    const cleanNotes = notes.replace(/\{"financial":\{[^}]+\}\}/g, '').trim();

    if (financialData.paymentType || financialData.paymentValue) {
        const financialJson = JSON.stringify({
            financial: {
                paymentType: financialData.paymentType,
                insuranceName: financialData.insuranceName || '',
                value: financialData.paymentValue || '',
            },
        });
        return `${cleanNotes}\n${financialJson}`.trim();
    }

    return cleanNotes;
}

// ============================================
// WhatsApp Integration
// ============================================

function openWhatsAppMenuKanban(leadId: number, event: MouseEvent): void {
    event.stopPropagation();

    const card = document.querySelector(`[data-id="${leadId}"]`) as HTMLElement | null;
    if (!card) return;

    const leadData = {
        id: leadId,
        name: card.querySelector('.lead-name')?.textContent || '',
        phone: (card.querySelector('.lead-phone')?.textContent || '').replace(/\D/g, ''),
        appointment_date: card.dataset.appointmentDate || null,
    };

    openWhatsAppMenu(event.currentTarget as HTMLElement, leadData, card);
}

// Global state variables
let currentDraggedCard: HTMLElement | null = null;
let lastLeadCount = 0;
let isFirstLoad = true;
let privacyMode = false;
(window as unknown as Record<string, unknown>).privacyMode = privacyMode;

// Load leads from API
async function loadLeads(): Promise<void> {
    console.log('🔄 loadLeads starting... Token:', token ? 'exists' : 'MISSING');
    showLoading(true);

    try {
        let url = API_URL;

        if (currentDateFilter && currentDateFilter !== 'all') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let startDate: string | undefined;
            let endDate: string | undefined;

            switch (currentDateFilter) {
                case 'today':
                    startDate = today.toISOString().split('T')[0];
                    endDate = today.toISOString().split('T')[0] + 'T23:59:59';
                    break;
                case '7days': {
                    const sevenDaysAgo = new Date(today);
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    startDate = sevenDaysAgo.toISOString().split('T')[0];
                    const sevenDaysAhead = new Date(today);
                    sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 30);
                    endDate = sevenDaysAhead.toISOString().split('T')[0];
                    break;
                }
                case '30days': {
                    const thirtyDaysAgo = new Date(today);
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    startDate = thirtyDaysAgo.toISOString().split('T')[0];
                    const thirtyDaysAhead = new Date(today);
                    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);
                    endDate = thirtyDaysAhead.toISOString().split('T')[0];
                    break;
                }
                case 'thisMonth':
                    startDate = new Date(today.getFullYear(), today.getMonth(), 1)
                        .toISOString()
                        .split('T')[0];
                    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
                        .toISOString()
                        .split('T')[0];
                    break;
            }

            if (startDate) {
                url += `?startDate=${encodeURIComponent(startDate)}`;
                if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
            }
        }

        console.log('📡 Fetching:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        console.log('📥 Response status:', response.status);

        if (response.status === 401) {
            sessionStorage.clear();
            window.location.href = '/login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const rawAppointments: unknown[] = Array.isArray(data) ? data : data.appointments || [];

        const leads = rawAppointments.map((apt) =>
            transformAppointmentToLead(apt as Record<string, unknown>)
        );

        allLeadsCache = leads;

        console.log(`✅ Loaded ${leads.length} leads`);

        if (!isFirstLoad && leads.length > lastLeadCount) {
            notificationSound
                .play()
                .catch((e: unknown) => console.log('Sound notification blocked:', e));
            showNotification('🔔 Novo lead recebido!', 'success');
        }

        lastLeadCount = leads.length;
        isFirstLoad = false;

        renderLeads(leads);
        updateBusinessMetrics(leads);
    } catch (error) {
        console.error('Erro ao carregar leads:', error);
        showToast({
            message: 'Erro ao carregar leads. Verifique a conexão com o servidor.',
            type: 'error',
        });
    } finally {
        showLoading(false);
    }
}

function transformAppointmentToLead(apt: Record<string, unknown>): KanbanLead {
    const statusMap: StatusMap = {
        scheduled: 'novo',
        confirmed: 'agendado',
        in_progress: 'em_atendimento',
        completed: 'finalizado',
        cancelled: 'archived',
        no_show: 'archived',
        agendado: 'agendado',
        novo: 'novo',
        em_atendimento: 'em_atendimento',
        finalizado: 'finalizado',
        archived: 'archived',
    };

    return {
        id: apt.id as number,
        name: (apt.patient_name as string) || (apt.name as string) || 'Paciente',
        phone: (apt.patient_phone as string) || (apt.phone as string) || '',
        type: (apt.type as string) || 'geral',
        status: statusMap[apt.status as string] || (apt.status as string) || 'agendado',
        notes: (apt.notes as string) || '',
        doctor: (apt.doctor as string) || '',
        appointment_date: (apt.start_time as string) || (apt.appointment_date as string) || '',
        end_time: apt.end_time as string | undefined,
        insurance: (apt.insurance as string) || 'Particular',
        source: (apt.source as string) || 'appointment',
        raw_id: (apt.raw_id as number) || (apt.id as number),
        created_at: apt.created_at as string | undefined,
        status_updated_at: apt.status_updated_at as string | undefined,
        attendance_status: apt.attendance_status as string | undefined,
    };
}

function transformKanbanStatusToApi(kanbanStatus: string): string {
    const statusMap: StatusMap = {
        novo: 'scheduled',
        em_atendimento: 'in_progress',
        agendado: 'confirmed',
        finalizado: 'completed',
        archived: 'cancelled',
    };
    return statusMap[kanbanStatus] || kanbanStatus;
}

// Render leads in columns
function renderLeads(leads: KanbanLead[]): void {
    console.log('📊 renderLeads called with', leads.length, 'leads');

    const activeLeads = leads.filter((lead) => lead.status !== 'archived');
    console.log('📊 Active leads (non-archived):', activeLeads.length);

    (['novo', 'em_atendimento', 'agendado', 'finalizado'] as string[]).forEach((status) => {
        const column = document.getElementById(`column-${status}`);
        if (column) {
            column.innerHTML = '';
        } else {
            console.error(`❌ Column not found: column-${status}`);
        }
    });

    activeLeads.forEach((lead) => {
        const card = createLeadCard(lead);
        const status = lead.status || 'novo';
        const column = document.getElementById(`column-${status}`);

        if (column && card) {
            column.appendChild(card);
        }
    });

    updateCounters(activeLeads);
}

// Create lead card
function createLeadCard(lead: KanbanLead): HTMLElement | null {
    if (!lead.id || String(lead.id) === 'undefined' || String(lead.id) === 'null') {
        console.error('❌ Lead without valid ID:', lead);
        return null;
    }

    if (!lead.name || lead.name === 'Paciente') {
        console.warn('⚠️ Lead without patient name, skipping:', lead.id);
        return null;
    }

    const card = document.createElement('div');
    card.className = 'lead-card rounded-lg shadow p-4 border border-gray-200 relative';
    card.draggable = true;
    card.dataset.id = String(lead.id);
    card.dataset.status = lead.status || 'novo';
    card.dataset.name = (lead.name || '').toLowerCase();
    card.dataset.phone = (lead.phone || '').replace(/\D/g, '');

    // SMART TAGS
    let typeBadge = '';
    let consultaDetails = '';

    const normalizedType = (lead.type || '').toLowerCase().trim();

    if (lead.type && lead.type.startsWith('Consulta - ')) {
        const parts = lead.type.split(' - ');
        const specialty = parts[1] || '';
        const paymentType = parts[2] || '';
        const period = parts[3] || '';
        const days = parts[4] || '';

        typeBadge =
            '<span class="px-2 py-0.5 rounded text-xs font-bold bg-teal-600 text-white border border-teal-700 shadow-sm"><i class="fas fa-stethoscope mr-1"></i>Consulta</span>';

        consultaDetails = `
            <div class="bg-gray-800/50 rounded-lg p-2 mb-2 space-y-1 text-xs">
                ${specialty ? `<div class="flex items-center text-cyan-300"><i class="fas fa-user-md mr-1 w-4"></i><strong>Especialidade:</strong> <span class="ml-1 text-white">${specialty}</span></div>` : ''}
                ${paymentType ? `<div class="flex items-center text-green-300"><i class="fas fa-credit-card mr-1 w-4"></i><strong>Pagamento:</strong> <span class="ml-1 text-white">${paymentType}</span></div>` : ''}
                ${period ? `<div class="flex items-center text-yellow-300"><i class="fas fa-clock mr-1 w-4"></i><strong>Período:</strong> <span class="ml-1 text-white">${period}</span></div>` : ''}
                ${days ? `<div class="flex items-center text-purple-300"><i class="fas fa-calendar mr-1 w-4"></i><strong>Dias:</strong> <span class="ml-1 text-white">${days}</span></div>` : ''}
            </div>
        `;
    } else if (normalizedType === 'primeira_consulta' || normalizedType === 'primeira consulta') {
        typeBadge =
            '<span class="px-2 py-0.5 rounded text-xs font-bold bg-yellow-400 text-gray-900 border border-yellow-500 whitespace-nowrap shadow-sm"><i class="fas fa-star mr-1"></i>1ª Consulta</span>';
    } else if (normalizedType === 'retorno') {
        typeBadge =
            '<span class="px-2 py-0.5 rounded text-xs font-bold bg-gray-300 text-gray-900 border border-gray-400 shadow-sm"><i class="fas fa-undo mr-1"></i>Retorno</span>';
    } else if (
        normalizedType === 'recorrente' ||
        normalizedType === 'sessão' ||
        normalizedType === 'sessao'
    ) {
        typeBadge =
            '<span class="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500 text-white border border-indigo-600 shadow-sm whitespace-nowrap"><i class="fas fa-sync-alt mr-1"></i>Recorrente</span>';
    } else if (normalizedType === 'atendimento humano') {
        typeBadge =
            '<span class="px-2 py-0.5 rounded text-xs font-bold bg-pink-500 text-white border border-pink-600 shadow-sm"><i class="fas fa-user-headset mr-1"></i>Atend. Humano</span>';
    } else if (normalizedType === 'consulta') {
        typeBadge =
            '<span class="px-2 py-0.5 rounded text-xs font-bold bg-teal-600 text-white border border-teal-700 shadow-sm"><i class="fas fa-stethoscope mr-1"></i>Consulta</span>';
    } else if (normalizedType === 'avaliação' || normalizedType === 'avaliacao') {
        typeBadge =
            '<span class="px-2 py-0.5 rounded text-xs font-bold bg-blue-500 text-white border border-blue-600 shadow-sm"><i class="fas fa-clipboard-check mr-1"></i>Avaliação</span>';
    } else if (normalizedType === 'procedimento') {
        typeBadge =
            '<span class="px-2 py-0.5 rounded text-xs font-bold bg-purple-500 text-white border border-purple-600 shadow-sm"><i class="fas fa-syringe mr-1"></i>Procedimento</span>';
    } else if (normalizedType === 'exame') {
        typeBadge =
            '<span class="px-2 py-0.5 rounded text-xs font-bold bg-cyan-600 text-white border border-cyan-700 shadow-sm"><i class="fas fa-vial mr-1"></i>Exame</span>';
    } else if (normalizedType === 'urgência' || normalizedType === 'urgencia') {
        typeBadge =
            '<span class="px-2 py-0.5 rounded text-xs font-bold bg-red-600 text-white border border-red-700 shadow-sm"><i class="fas fa-ambulance mr-1"></i>Urgência</span>';
    } else if (!lead.type || normalizedType === '' || normalizedType === 'geral') {
        typeBadge = '';
    } else {
        const formattedType = lead.type
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, (c: string) => c.toUpperCase());
        typeBadge =
            '<span class="px-2 py-0.5 rounded text-xs font-bold bg-slate-500 text-white border border-slate-600 shadow-sm"><i class="fas fa-tag mr-1"></i>' +
            formattedType +
            '</span>';
    }

    // INTELLIGENT TIMER
    const timer = calculateTimer(lead);
    const timeString = timer.text;
    const timeClasses = timer.classes;
    const timeTooltip = timer.tooltip;

    // SMART REMINDER
    let reminderButton = '';
    let appointmentBadge = '';

    if (lead.appointment_date) {
        const appointmentDate = new Date(lead.appointment_date);
        const now = new Date();
        const formattedDate = appointmentDate.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
        const timeOnly = formatTime(appointmentDate);
        const doctorLine = lead.doctor
            ? `<div class="text-xs font-semibold text-blue-600 mt-1">👨‍⚕️ ${lead.doctor}</div>`
            : '';
        appointmentBadge = `
            <div class="text-center bg-blue-50 rounded-lg px-3 py-2 mb-2">
                <span class="text-xs font-semibold text-blue-700">📅 ${formattedDate}</span>
                ${doctorLine}
            </div>
        `;

        const diffMsToAppointment = appointmentDate.getTime() - now.getTime();
        const hoursUntilAppointment = diffMsToAppointment / (1000 * 60 * 60);

        const leadStatus = (lead.status || '').toLowerCase().trim();
        const isInScheduledColumn =
            leadStatus === 'agendado' || leadStatus === 'scheduled' || leadStatus === 'confirmed';

        if (isInScheduledColumn && hoursUntilAppointment > 0 && hoursUntilAppointment <= 4) {
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
    const notesIndicator = lead.notes
        ? `
        <span class="absolute top-2 left-2 text-yellow-500 cursor-help" title="${lead.notes.replace(/"/g, '&quot;')}">
            📄
        </span>
    `
        : '';

    // Financial badges from notes
    const financialData = parseFinancialData(lead.notes);
    let financialBadges = '';

    if (financialData.paymentType) {
        const paymentIcons: Record<string, string> = {
            particular: '💵 Particular',
            plano: `🏥 ${financialData.insuranceName || 'Plano'}`,
            retorno: '🔄 Retorno',
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

    // Attendance status badge
    const currentStatus = (lead.status || '').toLowerCase().trim();
    let attendanceBadge = '';

    if (lead.attendance_status) {
        const attendanceStatus = lead.attendance_status.toLowerCase().trim();
        const attendanceLabels: Record<string, string> = {
            compareceu:
                '<span class="px-2 py-0.5 rounded text-xs font-bold bg-green-400/20 text-green-300 border border-green-400/30"><i class="fas fa-check mr-1"></i>Compareceu</span>',
            nao_compareceu:
                '<span class="px-2 py-0.5 rounded text-xs font-bold bg-red-400/20 text-red-300 border border-red-400/30"><i class="fas fa-times mr-1"></i>Não veio</span>',
            cancelado:
                '<span class="px-2 py-0.5 rounded text-xs font-bold bg-gray-400/20 text-gray-300 border border-gray-400/30"><i class="fas fa-ban mr-1"></i>Cancelado</span>',
            remarcado:
                '<span class="px-2 py-0.5 rounded text-xs font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30"><i class="fas fa-calendar-alt mr-1"></i>Remarcado</span>',
        };

        const outcomeStatuses = ['compareceu', 'nao_compareceu', 'cancelado'];
        if (outcomeStatuses.includes(attendanceStatus)) {
            if (currentStatus === 'finalizado') {
                attendanceBadge = attendanceLabels[attendanceStatus] || '';
            }
        } else if (attendanceStatus === 'remarcado') {
            if (currentStatus === 'agendado' || currentStatus === 'em_atendimento') {
                attendanceBadge = attendanceLabels['remarcado'];
            }
        }
    }

    card.innerHTML = `
        ${notesIndicator}
        
        <div class="flex items-start justify-between mb-2">
            <div class="flex items-center flex-wrap gap-1">
                ${typeBadge}
            </div>
            <div class="flex items-center space-x-1">
                <button 
                    class="md:hidden text-gray-400 hover:text-purple-400 transition p-1 lead-move-btn" 
                    title="Mover"
                    data-lead-id="${lead.id}"
                    data-lead-status="${lead.status || 'novo'}"
                    data-lead-name="${lead.name || ''}">
                    <i class="fas fa-arrows-alt text-xs"></i>
                </button>
                <button 
                    class="text-gray-400 hover:text-blue-400 transition p-1 lead-edit-btn" 
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
                    class="text-gray-400 hover:text-red-400 transition p-1 lead-delete-btn" 
                    title="Excluir"
                    data-lead-id="${lead.id}">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>
        </div>
        
        ${consultaDetails}
        ${financialBadges}
        
        ${attendanceBadge ? `<div class="mb-2">${attendanceBadge}</div>` : ''}
        
        <h3 class="font-semibold text-white mb-1 lead-name">${lead.name}</h3>
        
        ${timeString ? `<div class="mb-2"><small class="${timeClasses}" title="${timeTooltip}"><i class="fas fa-clock mr-1"></i>${timeString}</small></div>` : ''}
        
        ${appointmentBadge}
        
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
            
            ${reminderButton}
            
            ${
                currentStatus === 'finalizado'
                    ? `
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
            `
                    : ''
            }
        </div>
    `;

    if (lead.appointment_date) {
        card.dataset.appointmentDate = lead.appointment_date;
    }

    card.addEventListener('dragstart', dragStart);
    card.addEventListener('dragend', dragEnd);

    return card;
}

// Drag and Drop handlers
function dragStart(e: DragEvent): void {
    currentDraggedCard = e.target as HTMLElement;
    (e.target as HTMLElement).classList.add('dragging');
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', (e.target as HTMLElement).innerHTML);
    }
}

function dragEnd(e: DragEvent): void {
    (e.target as HTMLElement).classList.remove('dragging');
}

function allowDrop(e: DragEvent): void {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.add('drag-over');
}

function dragLeave(e: DragEvent): void {
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
}

async function drop(e: DragEvent): Promise<void> {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('drag-over');

    const dropZone = e.currentTarget as HTMLElement;
    const newStatus = dropZone.dataset.status || dropZone.parentElement?.dataset.status;
    const leadId = currentDraggedCard?.dataset.id;
    const oldStatus = currentDraggedCard?.dataset.status;

    console.log('🎯 Drop: leadId=', leadId, 'oldStatus=', oldStatus, 'newStatus=', newStatus);

    if (newStatus === oldStatus) {
        console.log('⚠️ Same column, skipping');
        return;
    }

    if (!newStatus) {
        console.error('❌ No newStatus detected from dropZone');
        return;
    }

    const columnContainer = dropZone.querySelector('[id^="column-"]') || dropZone;

    if (currentDraggedCard) {
        columnContainer.appendChild(currentDraggedCard);
        currentDraggedCard.dataset.status = newStatus;
    }

    let attendanceStatus: string | null = null;
    let apiStatus = transformKanbanStatusToApi(newStatus);

    console.log('📤 API Status mapped:', apiStatus);

    if (newStatus === 'Finalizado' || newStatus === 'finalizado') {
        const result = await customPromptOptions('Qual foi o resultado da consulta?', [
            { value: 'compareceu', label: 'Compareceu', icon: 'fas fa-check-circle' },
            { value: 'nao_compareceu', label: 'Não veio', icon: 'fas fa-times-circle' },
            { value: 'cancelado', label: 'Cancelado', icon: 'fas fa-ban' },
            { value: 'remarcado', label: 'Remarcado', icon: 'fas fa-calendar-alt' },
        ]);

        attendanceStatus = result || 'compareceu';

        const attendanceToApiStatus: StatusMap = {
            compareceu: 'completed',
            nao_compareceu: 'no_show',
            cancelado: 'cancelled',
            remarcado: 'scheduled',
        };
        apiStatus = attendanceToApiStatus[attendanceStatus] || 'completed';
    }

    try {
        const body: Record<string, string> = { status: apiStatus };
        if (attendanceStatus) {
            body.attendance_status = attendanceStatus;
        }

        console.log('📡 Sending PATCH to:', `${API_URL}/${leadId}`, 'body:', body);

        const response = await fetch(`${API_URL}/${leadId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        const responseData = await response.json();
        console.log('📥 Response:', response.status, responseData);

        if (!response.ok) {
            throw new Error(responseData.error || 'Erro ao atualizar status');
        }

        loadLeads();
        showNotification('✅ Status atualizado com sucesso!', 'success');
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        showNotification('❌ Erro ao atualizar status: ' + (error as Error).message, 'error');
        loadLeads();
    }
}

// ============================================
// MOBILE MOVE MODAL
// ============================================

let currentMoveLeadId: string | null = null;
let currentMoveLeadStatus: string | null = null;

function openMoveModal(leadId: string, currentStatus: string, leadName: string): void {
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

function closeMoveModal(): void {
    const modal = document.getElementById('moveModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    currentMoveLeadId = null;
    currentMoveLeadStatus = null;
}

async function moveToColumn(newStatus: string): Promise<void> {
    if (!currentMoveLeadId || newStatus === currentMoveLeadStatus) {
        closeMoveModal();
        return;
    }

    let attendanceStatus: string | null = null;
    let apiStatus = transformKanbanStatusToApi(newStatus);

    if (newStatus === 'Finalizado' || newStatus === 'finalizado') {
        const result = await customPromptOptions('Qual foi o resultado da consulta?', [
            { value: 'compareceu', label: 'Compareceu', icon: 'fas fa-check-circle' },
            { value: 'nao_compareceu', label: 'Não veio', icon: 'fas fa-times-circle' },
            { value: 'cancelado', label: 'Cancelado', icon: 'fas fa-ban' },
            { value: 'remarcado', label: 'Remarcado', icon: 'fas fa-calendar-alt' },
        ]);

        attendanceStatus = result || 'compareceu';

        const attendanceToApiStatus: StatusMap = {
            compareceu: 'completed',
            nao_compareceu: 'no_show',
            cancelado: 'cancelled',
            remarcado: 'scheduled',
        };
        apiStatus = attendanceToApiStatus[attendanceStatus] || 'completed';
    }

    showLoading(true);

    try {
        const body: Record<string, string> = { status: apiStatus };
        if (attendanceStatus) {
            body.attendance_status = attendanceStatus;
        }

        const response = await fetch(`${API_URL}/${currentMoveLeadId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error('Erro ao atualizar status');
        }

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
async function deleteLead(id: number | string): Promise<void> {
    const confirmed = await showConfirmModal({
        title: 'Excluir Lead',
        message: 'Tem certeza que deseja remover este lead? Esta ação não pode ser desfeita.',
        confirmText: 'Excluir',
        cancelText: 'Cancelar',
        icon: 'fa-trash-alt',
        variant: 'danger',
    });
    if (!confirmed) {
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
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

// Setup Return
async function setupReturn(leadId: number | string): Promise<void> {
    return scheduleReturn(leadId);
}

// Schedule Return
async function scheduleReturn(leadId: number | string): Promise<void> {
    showLoading(true);

    try {
        console.log('🔄 Scheduling return for lead:', leadId);

        let originalLead: KanbanLead | undefined = allLeadsCache
            ? allLeadsCache.find((l) => l.id === Number(leadId))
            : undefined;

        if (!originalLead) {
            console.log('⚠️ Lead not in cache, fetching from API...');
            const response = await fetch(`${API_URL}/${leadId}?view=all`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Paciente não encontrado. Ele pode ter sido deletado.');
            }

            originalLead = (await response.json()) as KanbanLead;
        }

        console.log('📋 Original lead data:', originalLead);

        const payload = {
            status: 'novo',
            type: 'retorno',
        };

        const updateResponse = await fetch(`${API_URL}/${leadId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        if (!updateResponse.ok) {
            const errorData = await updateResponse.json().catch(() => ({}));
            console.error('❌ PATCH failed:', {
                status: updateResponse.status,
                statusText: updateResponse.statusText,
                error: errorData,
            });

            if (updateResponse.status === 401) {
                throw new Error('Sessão expirada. Faça login novamente.');
            }

            throw new Error((errorData as { error?: string }).error || 'Erro ao atualizar status');
        }

        console.log('✅ Lead reset to "novo" status with type "retorno"');

        openEditModal(
            originalLead.id,
            originalLead.name,
            '',
            originalLead.doctor || '',
            originalLead.notes || 'Retorno agendado',
            'retorno'
        );

        showNotification('🔄 Paciente preparado para retorno! Configure a nova data.', 'info');

        await loadLeads();

        setTimeout(() => {
            const dateInput = document.getElementById(
                'editAppointmentDate'
            ) as HTMLInputElement | null;
            if (dateInput) {
                dateInput.focus();
            }
        }, 500);
    } catch (error) {
        console.error('❌ Error scheduling return:', error);
        showNotification(`❌ Erro ao preparar retorno: ${(error as Error).message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Archive Lead
async function archiveLead(leadId: number | string): Promise<void> {
    const archiveReason = await customPromptOptions(
        '📦 Arquivar Lead\n\nQual o motivo do arquivamento?',
        [
            { value: 'completed', label: 'Atendimento concluído', icon: 'fas fa-check-circle' },
            { value: 'no_show', label: 'Não compareceu', icon: 'fas fa-user-slash' },
            { value: 'cancelled', label: 'Cancelado pelo paciente', icon: 'fas fa-times-circle' },
        ]
    );

    if (!archiveReason) {
        return;
    }

    showLoading(true);

    try {
        console.log('🗄️ Archiving lead:', leadId, 'with status:', archiveReason);

        const attendanceStatusMap: StatusMap = {
            completed: 'compareceu',
            no_show: 'nao_compareceu',
            cancelled: 'cancelado',
        };

        const response = await fetch(`${API_URL}/${leadId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                status: archiveReason,
                attendance_status: attendanceStatusMap[archiveReason],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error((errorData as { error?: string }).error || 'Erro ao arquivar lead');
        }

        console.log('✅ Lead archived successfully');

        const card = document.querySelector(`[data-id="${leadId}"]`) as HTMLElement | null;
        if (card) {
            card.style.transition = 'all 0.3s ease-out';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';

            setTimeout(() => {
                card.remove();
                if (allLeadsCache && allLeadsCache.length > 0) {
                    updateCounters(allLeadsCache.filter((l) => l.id !== Number(leadId)));
                }
            }, 300);
        }

        if (allLeadsCache) {
            allLeadsCache = allLeadsCache.filter((l) => l.id !== Number(leadId));
        }

        const successMessages: Record<string, string> = {
            completed: '✅ Atendimento finalizado e arquivado!',
            no_show: '⚠️ Marcado como não compareceu',
            cancelled: '📦 Lead cancelado e arquivado',
        };
        showNotification(
            successMessages[archiveReason] || '📦 Lead arquivado com sucesso!',
            'success'
        );

        setTimeout(() => {
            loadLeads();
        }, 400);
    } catch (error) {
        console.error('❌ Error archiving lead:', error);
        showNotification(`❌ Erro ao arquivar: ${(error as Error).message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Update counters
function updateCounters(leads: KanbanLead[]): void {
    const counts: Record<string, number> = {
        novo: 0,
        em_atendimento: 0,
        agendado: 0,
        finalizado: 0,
    };

    leads.forEach((lead) => {
        const status = lead.status || 'novo';
        if (Object.prototype.hasOwnProperty.call(counts, status)) {
            counts[status]++;
        }
    });

    Object.keys(counts).forEach((status) => {
        const counter = document.getElementById(`count-${status}`);
        if (counter) {
            counter.textContent = String(counts[status]);
        }
    });
}

// Privacy Mode Toggle (LGPD Compliance)
function togglePrivacyMode(): void {
    privacyMode = !privacyMode;
    (window as unknown as Record<string, unknown>).privacyMode = privacyMode;
    const body = document.body;
    const icon = document.getElementById('privacyIcon');

    if (privacyMode) {
        body.classList.add('blur-sensitive');
        if (icon) icon.className = 'fas fa-eye-slash';
    } else {
        body.classList.remove('blur-sensitive');
        if (icon) icon.className = 'fas fa-eye';
    }
}

// ============================================
// DATE FORMATTING HELPERS
// ============================================

function formatDateForInput(dateValue: string | Date | number): string {
    if (!dateValue) return '';

    try {
        let dateObj: Date;

        if (typeof dateValue === 'number') {
            dateObj = new Date(dateValue);
        } else if (typeof dateValue === 'string') {
            let processed = dateValue;
            if (processed.includes(' ') && !processed.includes('T')) {
                processed = processed.replace(' ', 'T');
            }
            dateObj = new Date(processed);
        } else if (dateValue instanceof Date) {
            dateObj = dateValue;
        } else {
            console.warn('⚠️ Unknown date format:', dateValue);
            return '';
        }

        if (isNaN(dateObj.getTime())) {
            console.warn('⚠️ Invalid date:', dateValue);
            return '';
        }

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

function parseDateFromInput(inputValue: string): string | null {
    if (!inputValue) return null;

    try {
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

let datePicker: FlatpickrInstance | null = null;
let timePicker: FlatpickrInstance | null = null;

function initializeDateTimePickers(): void {
    const dateInput = document.getElementById(
        'editAppointmentDatePicker'
    ) as HTMLInputElement | null;
    const timeInput = document.getElementById(
        'editAppointmentTimePicker'
    ) as HTMLInputElement | null;
    const hiddenInput = document.getElementById('editAppointmentDate') as HTMLInputElement | null;

    if (!dateInput || !timeInput || !hiddenInput) {
        console.log('⚠️ Date/Time picker inputs not found, skipping Flatpickr init');
        return;
    }

    function updateHiddenDateTime(): void {
        const dateVal = datePicker?.selectedDates[0];
        const timeVal = timePicker?.selectedDates[0];

        if (dateVal && timeVal && hiddenInput) {
            const year = dateVal.getFullYear();
            const month = String(dateVal.getMonth() + 1).padStart(2, '0');
            const day = String(dateVal.getDate()).padStart(2, '0');
            const hours = String(timeVal.getHours()).padStart(2, '0');
            const minutes = String(timeVal.getMinutes()).padStart(2, '0');

            hiddenInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
            console.log('📅 DateTime updated:', hiddenInput.value);
        }
    }

    datePicker = flatpickr(dateInput, {
        locale: 'pt',
        dateFormat: 'd/m/Y',
        altInput: true,
        altFormat: 'j \\de F',
        disableMobile: true,
        animate: true,
        minDate: 'today',
        defaultDate: new Date(),
        onChange: function () {
            updateHiddenDateTime();
            dateInput.classList.add('ring-2', 'ring-cyan-400');
            setTimeout(() => dateInput.classList.remove('ring-2', 'ring-cyan-400'), 300);
        },
    });

    timePicker = flatpickr(timeInput, {
        locale: 'pt',
        enableTime: true,
        noCalendar: true,
        dateFormat: 'H:i',
        time_24hr: true,
        minuteIncrement: 15,
        defaultHour: 8,
        defaultMinute: 0,
        onChange: function () {
            updateHiddenDateTime();
            timeInput.classList.add('ring-2', 'ring-cyan-400');
            setTimeout(() => timeInput.classList.remove('ring-2', 'ring-cyan-400'), 300);
        },
    });

    document.querySelectorAll<HTMLButtonElement>('.quick-time-btn').forEach((btn) => {
        btn.addEventListener('click', function () {
            const time = this.dataset.time;
            if (!time) return;
            const [hours, minutes] = time.split(':');

            timePicker?.setDate(`${hours}:${minutes}`, true);

            document.querySelectorAll<HTMLButtonElement>('.quick-time-btn').forEach((b) => {
                b.classList.remove('bg-cyan-600', 'border-cyan-400', 'text-white');
                b.classList.add('bg-slate-800', 'border-slate-600', 'text-slate-300');
            });
            this.classList.remove('bg-slate-800', 'border-slate-600', 'text-slate-300');
            this.classList.add('bg-cyan-600', 'border-cyan-400', 'text-white');

            updateHiddenDateTime();
        });
    });

    console.log('✅ Flatpickr Date/Time pickers initialized');
}

function openEditModal(
    leadId: number | string,
    leadName: string,
    appointmentDate: string,
    doctor: string,
    notes: string,
    type: string
): void {
    if (!leadId || String(leadId) === 'undefined' || String(leadId) === 'null') {
        console.error('❌ Invalid leadId:', leadId);
        showNotification('❌ Erro: ID do lead inválido', 'error');
        return;
    }

    (document.getElementById('editLeadId') as HTMLInputElement).value = String(leadId);
    (document.getElementById('editLeadName') as HTMLInputElement).value = leadName;

    if (appointmentDate) {
        try {
            const date = new Date(appointmentDate);
            if (!isNaN(date.getTime())) {
                if (datePicker) {
                    datePicker.setDate(date, true);
                }
                if (timePicker) {
                    timePicker.setDate(date, true);
                }
                const formattedDate = formatDateForInput(appointmentDate);
                (document.getElementById('editAppointmentDate') as HTMLInputElement).value =
                    formattedDate;

                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const timeStr = `${hours}:${minutes}`;

                document.querySelectorAll<HTMLButtonElement>('.quick-time-btn').forEach((btn) => {
                    btn.classList.remove('bg-cyan-600', 'border-cyan-400', 'text-white');
                    btn.classList.add('bg-slate-800', 'border-slate-600', 'text-slate-300');
                    if (btn.dataset.time === timeStr) {
                        btn.classList.remove('bg-slate-800', 'border-slate-600', 'text-slate-300');
                        btn.classList.add('bg-cyan-600', 'border-cyan-400', 'text-white');
                    }
                });

                console.log('✅ Date formatted for Flatpickr:', {
                    original: appointmentDate,
                    formatted: formattedDate,
                });
            }
        } catch (e) {
            console.error('❌ Error setting date:', e);
        }
    } else {
        if (datePicker) datePicker.clear();
        if (timePicker) timePicker.setDate('08:00', true);
        (document.getElementById('editAppointmentDate') as HTMLInputElement).value = '';
    }

    (document.getElementById('editDoctor') as HTMLInputElement).value = doctor || '';

    const financialData = parseFinancialData(notes);
    const cleanNotes = notes ? notes.replace(/\{"financial":\{[^}]+\}\}/g, '').trim() : '';
    (document.getElementById('editNotes') as HTMLTextAreaElement).value = cleanNotes;

    (document.getElementById('editPaymentType') as HTMLSelectElement).value =
        financialData.paymentType || '';
    (document.getElementById('editInsuranceName') as HTMLSelectElement).value =
        financialData.insuranceName || '';
    (document.getElementById('editPaymentValue') as HTMLInputElement).value =
        financialData.paymentValue ? formatCurrency(Number(financialData.paymentValue)) : '';

    toggleInsuranceField();

    // Store original values
    const editForm = document.getElementById('editForm') as HTMLFormElement;

    let originalDoctorInput = document.getElementById(
        'editOriginalDoctor'
    ) as HTMLInputElement | null;
    if (!originalDoctorInput) {
        originalDoctorInput = document.createElement('input');
        originalDoctorInput.type = 'hidden';
        originalDoctorInput.id = 'editOriginalDoctor';
        editForm.appendChild(originalDoctorInput);
    }
    originalDoctorInput.value = doctor || '';

    let originalNotesInput = document.getElementById(
        'editOriginalNotes'
    ) as HTMLInputElement | null;
    if (!originalNotesInput) {
        originalNotesInput = document.createElement('input');
        originalNotesInput.type = 'hidden';
        originalNotesInput.id = 'editOriginalNotes';
        editForm.appendChild(originalNotesInput);
    }
    originalNotesInput.value = notes || '';

    let originalTypeInput = document.getElementById('editOriginalType') as HTMLInputElement | null;
    if (!originalTypeInput) {
        originalTypeInput = document.createElement('input');
        originalTypeInput.type = 'hidden';
        originalTypeInput.id = 'editOriginalType';
        editForm.appendChild(originalTypeInput);
    }
    originalTypeInput.value = type || '';

    const typeSelect = document.getElementById('editType') as HTMLSelectElement;
    const validOptions = ['primeira_consulta', 'retorno', 'recorrente', 'exame'];
    if (validOptions.includes(type)) {
        typeSelect.value = type;
    } else {
        typeSelect.value = '';
    }

    document.getElementById('editModal')?.classList.remove('hidden');
}

function closeEditModal(): void {
    document.getElementById('editModal')?.classList.add('hidden');
    const form = document.getElementById('editForm') as HTMLFormElement | null;
    if (form) {
        form.reset();
    }
}

// Helper functions
function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `(${cleaned.substr(0, 2)}) ${cleaned.substr(2, 5)}-${cleaned.substr(7)}`;
    }
    return phone;
}

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Agora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min atrás`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
    return `${Math.floor(seconds / 86400)} dias atrás`;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const dateFilterSelect = document.getElementById('dateFilter') as HTMLSelectElement | null;
    if (dateFilterSelect) {
        dateFilterSelect.value = currentDateFilter;
    }

    initializeDateTimePickers();
    await populateInsuranceSelectsFromClinic();

    // Edit Form Submit Handler
    const editForm = document.getElementById('editForm') as HTMLFormElement | null;
    if (editForm) {
        editForm.addEventListener('submit', async function (e: Event) {
            e.preventDefault();

            const leadId = (document.getElementById('editLeadId') as HTMLInputElement).value;
            const appointmentDate = (
                document.getElementById('editAppointmentDate') as HTMLInputElement
            ).value;
            const doctor = (document.getElementById('editDoctor') as HTMLInputElement).value;
            const notes = (document.getElementById('editNotes') as HTMLTextAreaElement).value;
            const typeSelect = (document.getElementById('editType') as HTMLSelectElement).value;
            const originalType =
                (document.getElementById('editOriginalType') as HTMLInputElement)?.value || '';
            const originalDoctor =
                (document.getElementById('editOriginalDoctor') as HTMLInputElement)?.value || '';
            const originalNotes =
                (document.getElementById('editOriginalNotes') as HTMLInputElement)?.value || '';

            const paymentType = (document.getElementById('editPaymentType') as HTMLSelectElement)
                .value;
            const insuranceName = (
                document.getElementById('editInsuranceName') as HTMLSelectElement
            ).value;
            const paymentValue = (document.getElementById('editPaymentValue') as HTMLInputElement)
                .value;

            let isoDate: string | null = null;
            if (appointmentDate) {
                try {
                    isoDate = new Date(appointmentDate).toISOString();
                } catch (err) {
                    console.error('Erro ao converter data:', err);
                    showNotification('❌ Data inválida', 'error');
                    return;
                }
            }

            const finalType = typeSelect ? typeSelect : originalType;

            console.log('Salvando lead:', {
                leadId,
                isoDate,
                doctor,
                notes,
                finalType,
                originalType,
            });

            const financialData: FinancialData = {
                paymentType: paymentType,
                insuranceName: insuranceName,
                paymentValue: parseCurrency(paymentValue).toFixed(2),
            };
            const finalNotes = encodeFinancialData(notes, financialData);

            const updateData: Record<string, string | null> = {};

            if (isoDate !== null) {
                updateData.appointment_date = isoDate;
            }

            if (doctor !== originalDoctor) {
                updateData.doctor = doctor.trim() || null;
            }

            if (finalNotes !== originalNotes) {
                updateData.notes = finalNotes.trim() || null;
            }

            if (typeSelect) {
                updateData.type = typeSelect;
            }

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
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(updateData),
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
                showNotification(
                    '❌ Erro ao atualizar agendamento: ' + (error as Error).message,
                    'error'
                );
            }
        });
    }

    // Event delegation for lead card buttons
    document.addEventListener('click', (e: MouseEvent) => {
        const editBtn = (e.target as HTMLElement).closest('.lead-edit-btn') as HTMLElement | null;
        if (editBtn) {
            e.preventDefault();
            e.stopPropagation();
            const leadId = editBtn.dataset.leadId;

            if (!leadId || leadId === 'undefined' || leadId === 'null') {
                console.error('❌ Invalid lead ID from button:', leadId);
                showNotification('❌ Erro: ID do lead não encontrado', 'error');
                return;
            }

            const leadName = editBtn.dataset.leadName || '';
            const leadDate = editBtn.dataset.leadDate || '';
            const leadDoctor = editBtn.dataset.leadDoctor || '';
            const leadNotes = (editBtn.dataset.leadNotes || '').replace(/&quot;/g, '"');
            const leadType = editBtn.dataset.leadType || '';
            console.log('Edit button clicked:', {
                leadId,
                leadName,
                leadDate,
                leadDoctor,
                leadType,
            });
            openEditModal(leadId, leadName, leadDate, leadDoctor, leadNotes, leadType);
            return;
        }

        const deleteBtn = (e.target as HTMLElement).closest(
            '.lead-delete-btn'
        ) as HTMLElement | null;
        if (deleteBtn) {
            e.preventDefault();
            e.stopPropagation();
            const leadId = deleteBtn.dataset.leadId;
            if (!leadId || leadId === 'undefined') {
                console.error('❌ Invalid lead ID for delete:', leadId);
                return;
            }
            console.log('Delete button clicked:', leadId);
            deleteLead(leadId);
            return;
        }

        const moveBtn = (e.target as HTMLElement).closest('.lead-move-btn') as HTMLElement | null;
        if (moveBtn) {
            e.preventDefault();
            e.stopPropagation();
            const leadId = moveBtn.dataset.leadId || '';
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

// ============================================
// QUICK SEARCH FUNCTIONALITY
// ============================================

let allLeadsCache: KanbanLead[] = [];

function filterLeads(searchTerm: string): void {
    const clearBtn = document.getElementById('clearSearch');
    const resultsText = document.getElementById('searchResults');

    if (clearBtn) {
        clearBtn.classList.toggle('hidden', !searchTerm);
    }

    if (!searchTerm || searchTerm.trim().length < 2) {
        resultsText?.classList.add('hidden');
        showAllLeadCards();
        return;
    }

    const term = searchTerm.toLowerCase().trim();

    const allCards = document.querySelectorAll<HTMLElement>('.lead-card');
    let matchCount = 0;

    allCards.forEach((card) => {
        const name = (card.dataset.name || '').toLowerCase();
        const phone = (card.dataset.phone || '').replace(/\D/g, '');
        const searchPhone = term.replace(/\D/g, '');

        const matches = name.includes(term) || (searchPhone && phone.includes(searchPhone));

        if (matches) {
            card.style.display = '';
            card.classList.add('ring-2', 'ring-cyan-500/50');
            matchCount++;
        } else {
            card.style.display = 'none';
            card.classList.remove('ring-2', 'ring-cyan-500/50');
        }
    });

    if (resultsText) {
        resultsText.classList.remove('hidden');
        const searchCountEl = document.getElementById('searchCount');
        if (searchCountEl) searchCountEl.textContent = String(matchCount);
    }
}

function showAllLeadCards(): void {
    const allCards = document.querySelectorAll<HTMLElement>('.lead-card');
    allCards.forEach((card) => {
        card.style.display = '';
        card.classList.remove('ring-2', 'ring-cyan-500/50');
    });
}

function clearSearch(): void {
    const searchInput = document.getElementById('quickSearch') as HTMLInputElement | null;
    if (searchInput) {
        searchInput.value = '';
        filterLeads('');
        searchInput.focus();
    }
}

// Expose functions globally for HTML onclick handlers
window.filterLeads = filterLeads;
window.clearSearch = clearSearch;

window.dragStart = dragStart;
window.dragEnd = dragEnd;
window.allowDrop = allowDrop;
window.dragLeave = dragLeave;
window.drop = drop;

(window as unknown as Record<string, unknown>).openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.toggleInsuranceField = toggleInsuranceField;
window.initializeDateTimePickers = initializeDateTimePickers;

(window as unknown as Record<string, unknown>).deleteLead = deleteLead;
window.archiveLead = archiveLead;
window.scheduleReturn = scheduleReturn;
window.setupReturn = setupReturn;

window.openMoveModal = openMoveModal;
window.closeMoveModal = closeMoveModal;
window.moveToColumn = moveToColumn;

(window as unknown as Record<string, unknown>).togglePrivacyMode = togglePrivacyMode;
window.openWhatsAppMenuKanban = openWhatsAppMenuKanban;
window.handleDateFilterChange = handleDateFilterChange;
(window as unknown as Record<string, unknown>).loadLeads = loadLeads;

console.log('✅ Kanban functions exposed globally:', {
    archiveLead: typeof window.archiveLead,
    scheduleReturn: typeof window.scheduleReturn,
    dragStart: typeof window.dragStart,
    openEditModal: typeof window.openEditModal,
});
