/**
 * ============================================
 * CONFIRMATION MODAL COMPONENT
 * Modal de confirmações de WhatsApp
 * ============================================
 */

import { extractTimeFromDate } from '../utils/date-utils.ts';
import { formatPhone } from '../utils/string-utils.ts';
import * as NotificationService from '../services/notification-service.ts';
import * as CacheService from '../services/cache-service.ts';
import type { ClinicSettings } from '../types/models.ts';

interface ConfirmationLead {
    id: number;
    name: string;
    phone: string;
    appointment_date: string;
    doctor?: string;
    type?: string;
    status: string;
    notes?: string;
    email?: string;
}

interface CachedClinicPayload {
    settings: {
        identity?: {
            name?: string;
        };
    };
}

const MODAL_ID = 'confirmationQueueModal';
const CONTAINER_ID = 'confirmationList';

/**
 * Abre modal de confirmações
 */
export async function open(leads: ConfirmationLead[] | null = null): Promise<void> {
    const modal = document.getElementById(MODAL_ID);
    if (!modal) {
        console.error('Modal element not found:', MODAL_ID);
        return;
    }

    // Se leads não foram passados, buscar da API
    if (!leads) {
        leads = await fetchTomorrowLeads();
    }

    if (!leads || leads.length === 0) {
        NotificationService.info('Nenhum agendamento para amanhã');
        return;
    }

    // Renderizar pacientes
    render(leads);

    // Mostrar modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Adicionar classe ao body para prevenir scroll
    document.body.style.overflow = 'hidden';
}

/**
 * Fecha modal de confirmações
 */
export function close(): void {
    const modal = document.getElementById(MODAL_ID);
    if (!modal) return;

    modal.classList.remove('flex');
    modal.classList.add('hidden');

    // Restaurar scroll do body
    document.body.style.overflow = '';
}

/**
 * Renderiza lista de pacientes no modal
 */
export function render(leads: ConfirmationLead[]): void {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) {
        console.error('Container element not found:', CONTAINER_ID);
        return;
    }

    // Obter nome da clínica do cache
    let clinicName = 'nossa clínica';
    try {
        const settings = CacheService.get<CachedClinicPayload>('clinicSettings');
        if (settings?.settings?.identity?.name) {
            clinicName = settings.settings.identity.name;
        }
    } catch (_e) {
        console.warn('Could not load clinic name');
    }

    // Ordenar por horário
    const sortedLeads = [...leads].sort((a, b) => {
        const timeA = extractTimeFromDate(a.appointment_date);
        const timeB = extractTimeFromDate(b.appointment_date);
        return timeA.localeCompare(timeB);
    });

    // Renderizar cards
    container.innerHTML = sortedLeads
        .map((lead, index) => renderPatientCard(lead, index, clinicName))
        .join('');
}

/**
 * Renderiza card individual de paciente
 */
function renderPatientCard(lead: ConfirmationLead, index: number, clinicName: string): string {
    const phone = lead.phone.replace(/\D/g, '');
    const apptTime = extractTimeFromDate(lead.appointment_date);
    const formattedPhone = formatPhone(lead.phone);
    const doctor = lead.doctor || 'nossa equipe';
    const type = lead.type || 'Consulta';

    const message = createWhatsAppMessage(lead.name, apptTime, doctor, clinicName);
    const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;

    return `
        <div class="bg-slate-700/30 border border-slate-600 rounded-lg p-4 hover:bg-slate-700/50 transition" 
             data-lead-id="${lead.id}"
             id="confirmation-card-${lead.id}">
            <div class="flex items-start justify-between gap-3">
                
                <!-- Badge de Posição -->
                <div class="flex-shrink-0">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm">
                        #${index + 1}
                    </span>
                </div>
                
                <!-- Patient Info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-emerald-400 font-bold text-sm">${apptTime}</span>
                        <span class="text-slate-500">•</span>
                        <h4 class="text-white font-semibold truncate">${lead.name}</h4>
                    </div>
                    
                    <div class="flex flex-col gap-1 text-sm text-slate-400">
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-phone w-4"></i>
                            <span>${formattedPhone}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-user-doctor w-4"></i>
                            <span>${doctor}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fa-solid fa-file-medical w-4"></i>
                            <span>${type}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Actions -->
                <div class="flex flex-col gap-2 flex-shrink-0">
                    <a href="${whatsappUrl}" 
                       target="_blank"
                       onclick="window.markConfirmationAsSent && window.markConfirmationAsSent(${lead.id})"
                       class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap">
                        <i class="fa-brands fa-whatsapp"></i>
                        Enviar
                    </a>
                    
                    <button onclick="window.copyConfirmationMessage && window.copyConfirmationMessage(${lead.id}, \`${message.replace(/`/g, '\\`')}\`)"
                            class="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap">
                        <i class="fa-solid fa-copy"></i>
                        Copiar
                    </button>
                </div>
            </div>
            
            <!-- Indicador de Enviado (oculto por padrão) -->
            <div class="hidden mt-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-emerald-400 text-sm flex items-center gap-2"
                 data-sent-indicator>
                <i class="fa-solid fa-check-circle"></i>
                <span>Mensagem enviada</span>
            </div>
        </div>
    `;
}

/**
 * Cria mensagem de WhatsApp personalizada
 */
function createWhatsAppMessage(
    name: string,
    time: string,
    doctor: string,
    clinicName: string
): string {
    return `Olá *${name}*! 😊

Este é um lembrete da sua consulta *amanhã* às *${time}* com ${doctor}.

📍 ${clinicName}

Tudo confirmado? Se precisar reagendar, é só avisar!

Aguardamos você! 🙏`;
}

/**
 * Marca confirmação como enviada (feedback visual)
 */
export function markAsSent(leadId: number): void {
    const card = document.getElementById(`confirmation-card-${leadId}`);
    if (!card) return;

    const indicator = card.querySelector('[data-sent-indicator]') as HTMLElement | null;
    if (indicator) {
        indicator.classList.remove('hidden');
    }

    // Adicionar borda verde
    card.classList.add('border-emerald-500/50');

    NotificationService.success('WhatsApp aberto!');
}

/**
 * Copia mensagem para área de transferência
 */
export function copyMessage(leadId: number, message: string): void {
    if (!navigator.clipboard) {
        // Fallback para navegadores antigos
        copyToClipboardFallback(message);
        return;
    }

    navigator.clipboard
        .writeText(message)
        .then(() => {
            NotificationService.success('Mensagem copiada!');
        })
        .catch((err: unknown) => {
            console.error('Erro ao copiar:', err);
            NotificationService.error('Erro ao copiar mensagem');
        });
}

/**
 * Fallback para copiar sem clipboard API
 */
function copyToClipboardFallback(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
        NotificationService.success('Mensagem copiada!');
    } catch (_err) {
        NotificationService.error('Erro ao copiar mensagem');
    }

    document.body.removeChild(textarea);
}

/**
 * Busca leads de amanhã da API
 */
async function fetchTomorrowLeads(): Promise<ConfirmationLead[]> {
    try {
        const token = sessionStorage.getItem('MEDICAL_CRM_TOKEN');
        const response = await fetch('/api/leads', {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar leads');
        }

        const leads = (await response.json()) as ConfirmationLead[];

        // Filtrar amanhã
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        return leads.filter((lead: ConfirmationLead) => {
            if (!lead.appointment_date) return false;
            const apptDate = lead.appointment_date.split('T')[0];
            return apptDate === tomorrowStr && lead.status === 'agendado';
        });
    } catch (error) {
        console.error('Error fetching tomorrow leads:', error);
        NotificationService.error('Erro ao buscar agendamentos');
        return [];
    }
}

// Expor funções globalmente para onclick handlers
declare global {
    interface Window {
        markConfirmationAsSent: typeof markAsSent;
        copyConfirmationMessage: typeof copyMessage;
    }
}

if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).openConfirmationQueue = open;
    (window as unknown as Record<string, unknown>).closeConfirmationQueue = close;
    window.markConfirmationAsSent = markAsSent;
    window.copyConfirmationMessage = copyMessage;
}
