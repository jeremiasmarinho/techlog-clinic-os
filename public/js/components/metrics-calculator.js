/**
 * ============================================
 * DASHBOARD METRICS CALCULATOR
 * Cálculo de métricas de negócio do dashboard
 * ============================================
 */

import { getTodayString, getTomorrowString, getYesterdayString } from '../utils/date-utils.js';
import { formatCurrency, calculateGrowth } from '../utils/currency-utils.js';

/**
 * Calcula todas as métricas do dashboard
 * @param {Array} leads - Lista de leads
 * @returns {object} Objeto com todas as métricas
 */
export function calculateMetrics(leads) {
    if (!leads || !Array.isArray(leads)) {
        return getEmptyMetrics();
    }
    
    const today = getTodayString();
    const tomorrow = getTomorrowString();
    const yesterday = getYesterdayString();
    
    // Filtrar leads por data
    const todayLeads = filterLeadsByDate(leads, today);
    const tomorrowLeads = filterTomorrowConfirmations(leads, tomorrow);
    const yesterdayLeads = filterLeadsByDate(leads, yesterday);
    const finalizedLeads = filterFinalizedLeads(leads);
    
    // Calcular métricas
    const dailyRevenue = calculateDailyRevenue(todayLeads);
    const yesterdayRevenue = calculateDailyRevenue(yesterdayLeads);
    const revenueGrowth = calculateGrowth(dailyRevenue, yesterdayRevenue);
    
    const tomorrowCount = tomorrowLeads.length;
    const todayAppointments = todayLeads.length;
    const occupancy = calculateOccupancy(todayAppointments);
    const averageTicket = calculateAverageTicket(finalizedLeads);
    
    return {
        dailyRevenue: {
            value: dailyRevenue,
            formatted: formatCurrency(dailyRevenue)
        },
        revenueGrowth: {
            value: revenueGrowth.value,
            formatted: revenueGrowth.formatted,
            isPositive: revenueGrowth.isPositive
        },
        tomorrowConfirmations: {
            count: tomorrowCount,
            leads: tomorrowLeads
        },
        todayOccupancy: {
            count: todayAppointments,
            total: 10,
            percent: occupancy
        },
        averageTicket: {
            value: averageTicket,
            formatted: formatCurrency(averageTicket)
        }
    };
}

/**
 * Retorna métricas vazias (valores zero)
 * @returns {object} Métricas vazias
 */
function getEmptyMetrics() {
    return {
        dailyRevenue: {
            value: 0,
            formatted: formatCurrency(0)
        },
        revenueGrowth: {
            value: 0,
            formatted: '+0%',
            isPositive: true
        },
        tomorrowConfirmations: {
            count: 0,
            leads: []
        },
        todayOccupancy: {
            count: 0,
            total: 10,
            percent: 0
        },
        averageTicket: {
            value: 0,
            formatted: formatCurrency(0)
        }
    };
}

/**
 * Filtra leads por data específica
 * @param {Array} leads - Lista de leads
 * @param {string} dateStr - Data no formato YYYY-MM-DD
 * @returns {Array} Leads filtrados
 */
function filterLeadsByDate(leads, dateStr) {
    return leads.filter(lead => {
        if (!lead.appointment_date) return false;
        const apptDate = lead.appointment_date.split('T')[0];
        return apptDate === dateStr;
    });
}

/**
 * Filtra confirmações de amanhã (agendados)
 * @param {Array} leads - Lista de leads
 * @param {string} tomorrowStr - Data de amanhã (YYYY-MM-DD)
 * @returns {Array} Leads confirmados para amanhã
 */
function filterTomorrowConfirmations(leads, tomorrowStr) {
    return leads.filter(lead => {
        if (!lead.appointment_date) return false;
        const apptDate = lead.appointment_date.split('T')[0];
        return apptDate === tomorrowStr && lead.status === 'agendado';
    });
}

/**
 * Filtra leads finalizados que compareceram
 * @param {Array} leads - Lista de leads
 * @returns {Array} Leads finalizados
 */
function filterFinalizedLeads(leads) {
    return leads.filter(lead => 
        lead.status === 'finalizado' && 
        lead.attendance_status === 'compareceu' &&
        lead.value > 0
    );
}

/**
 * Calcula receita diária somando valores dos leads
 * @param {Array} leads - Leads do dia
 * @returns {number} Receita total
 */
function calculateDailyRevenue(leads) {
    return leads.reduce((sum, lead) => {
        // Tenta pegar valor do campo notes (financial.paymentValue)
        let value = lead.value || 0;
        
        if (!value && lead.notes) {
            try {
                const financial = parseFinancialData(lead.notes);
                value = parseFloat(financial.paymentValue) || 0;
            } catch (e) {
                // Ignora erros de parse
            }
        }
        
        return sum + value;
    }, 0);
}

/**
 * Calcula porcentagem de ocupação
 * @param {number} appointments - Número de agendamentos
 * @param {number} capacity - Capacidade (padrão: 10)
 * @returns {number} Porcentagem (0-100)
 */
function calculateOccupancy(appointments, capacity = 10) {
    if (capacity === 0) return 0;
    return Math.min((appointments / capacity) * 100, 100);
}

/**
 * Calcula ticket médio dos leads finalizados
 * @param {Array} finalizedLeads - Leads finalizados
 * @returns {number} Ticket médio
 */
function calculateAverageTicket(finalizedLeads) {
    if (finalizedLeads.length === 0) return 0;
    
    const total = finalizedLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
    return total / finalizedLeads.length;
}

/**
 * Parse financial data from notes JSON
 * @param {string} notes - Notes field (JSON string)
 * @returns {object} Financial data
 */
function parseFinancialData(notes) {
    if (!notes) return {};
    
    try {
        // Se já é objeto
        if (typeof notes === 'object') {
            return notes.financial || {};
        }
        
        // Parse JSON string
        const parsed = JSON.parse(notes);
        return parsed.financial || {};
    } catch (e) {
        return {};
    }
}
