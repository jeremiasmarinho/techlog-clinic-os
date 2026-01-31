/**
 * ============================================
 * CONFIRMATION MODAL COMPONENT
 * Modal de confirmações de WhatsApp
 * ============================================
 */

import { extractTimeFromDate } from '../utils/date-utils.js';
import { formatPhone } from '../utils/string-utils.js';
import * as NotificationService from '../services/notification-service.js';
import * as CacheService from '../services/cache-service.js';

const MODAL_ID = 'confirmationQueueModal';
const CONTAINER_ID = 'confirmationList';

/**
 * Abre modal de confirmações
 * @param {Array} leads - Leads para amanhã
 */
export async function open(leads = null) {
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
export function close() {
    const modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    
    // Restaurar scroll do body
    document.body.style.overflow = '';
}

/**
 * Renderiza lista de pacientes no modal
 * @param {Array} leads - Leads para renderizar
 */
export function render(leads) {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) {
        console.error('Container element not found:', CONTAINER_ID);
        return;
    }
    
    // Obter nome da clínica do cache
    let clinicName = 'nossa clínica';
    try {
        const settings = CacheService.get('clinicSettings');
        if (settings?.settings?.identity?.name) {
            clinicName = settings.settings.identity.name;
        }
    } catch (e) {
        console.warn('Could not load clinic name');
    }
    
    // Ordenar por horário
    const sortedLeads = [...leads].sort((a, b) => {
        const timeA = extractTimeFromDate(a.appointment_date);
        const timeB = extractTimeFromDate(b.appointment_date);
        return timeA.localeCompare(timeB);
    });
    
    // Renderizar cards
    container.innerHTML = sortedLeads.map((lead, index) => 
        renderPatientCard(lead, index, clinicName)
    ).join('');
}

/**
 * Renderiza card individual de paciente
 * @param {object} lead - Dados do lead
 * @param {number} index - Índice na lista
 * @param {string} clinicName - Nome da clínica
 * @returns {string} HTML do card
 */
function renderPatientCard(lead, index, clinicName) {
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
 * @param {string} name - Nome do paciente
 * @param {string} time - Horário da consulta
 * @param {string} doctor - Nome do médico
 * @param {string} clinicName - Nome da clínica
 * @returns {string} Mensagem formatada
 */
function createWhatsAppMessage(name, time, doctor, clinicName) {
    return `Olá *${name}*! 😊

Este é um lembrete da sua consulta *amanhã* às *${time}* com ${doctor}.

📍 ${clinicName}

Tudo confirmado? Se precisar reagendar, é só avisar!

Aguardamos você! 🙏`;
}

/**
 * Marca confirmação como enviada (feedback visual)
 * @param {number} leadId - ID do lead
 */
export function markAsSent(leadId) {
    const card = document.getElementById(`confirmation-card-${leadId}`);
    if (!card) return;
    
    const indicator = card.querySelector('[data-sent-indicator]');
    if (indicator) {
        indicator.classList.remove('hidden');
    }
    
    // Adicionar borda verde
    card.classList.add('border-emerald-500/50');
    
    NotificationService.success('WhatsApp aberto!');
}

/**
 * Copia mensagem para área de transferência
 * @param {number} leadId - ID do lead
 * @param {string} message - Mensagem a copiar
 */
export function copyMessage(leadId, message) {
    if (!navigator.clipboard) {
        // Fallback para navegadores antigos
        copyToClipboardFallback(message);
        return;
    }
    
    navigator.clipboard.writeText(message)
        .then(() => {
            NotificationService.success('Mensagem copiada!');
        })
        .catch(err => {
            console.error('Erro ao copiar:', err);
            NotificationService.error('Erro ao copiar mensagem');
        });
}

/**
 * Fallback para copiar sem clipboard API
 * @param {string} text - Texto a copiar
 */
function copyToClipboardFallback(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        NotificationService.success('Mensagem copiada!');
    } catch (err) {
        NotificationService.error('Erro ao copiar mensagem');
    }
    
    document.body.removeChild(textarea);
}

/**
 * Busca leads de amanhã da API
 * @returns {Promise<Array>} Leads de amanhã
 */
async function fetchTomorrowLeads() {
    try {
        const token = sessionStorage.getItem('MEDICAL_CRM_TOKEN');
        const response = await fetch('/api/leads', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao buscar leads');
        }
        
        const leads = await response.json();
        
        // Filtrar amanhã
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        return leads.filter(lead => {
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
if (typeof window !== 'undefined') {
    window.openConfirmationQueue = open;
    window.closeConfirmationQueue = close;
    window.markConfirmationAsSent = markAsSent;
    window.copyConfirmationMessage = copyMessage;
}
