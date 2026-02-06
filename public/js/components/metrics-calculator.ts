/**
 * ============================================
 * DASHBOARD METRICS CALCULATOR
 * Cálculo de métricas de negócio do dashboard
 * ============================================
 */

import { getTodayString, getTomorrowString, getYesterdayString } from '../utils/date-utils.ts';
import { formatCurrency, calculateGrowth } from '../utils/currency-utils.ts';
import type { GrowthResult } from '../types/models.ts';

interface MetricsLead {
    id: number;
    name: string;
    phone: string;
    status: string;
    appointment_date?: string;
    attendance_status?: string;
    value?: number;
    notes?: string;
    doctor?: string;
    type?: string;
    created_at: string;
}

interface RevenueMetric {
    value: number;
    formatted: string;
}

interface RevenueGrowthMetric {
    value: number;
    formatted: string;
    isPositive: boolean;
}

interface ConfirmationsMetric {
    count: number;
    leads: MetricsLead[];
}

interface OccupancyMetric {
    count: number;
    total: number;
    percent: number;
}

interface TicketMetric {
    value: number;
    formatted: string;
}

interface DashboardMetrics {
    dailyRevenue: RevenueMetric;
    revenueGrowth: RevenueGrowthMetric;
    tomorrowConfirmations: ConfirmationsMetric;
    todayOccupancy: OccupancyMetric;
    averageTicket: TicketMetric;
}

interface FinancialData {
    paymentValue?: string;
    [key: string]: unknown;
}

/**
 * Calcula todas as métricas do dashboard
 */
export function calculateMetrics(leads: MetricsLead[]): DashboardMetrics {
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
            formatted: formatCurrency(dailyRevenue),
        },
        revenueGrowth: {
            value: revenueGrowth.value,
            formatted: revenueGrowth.formatted,
            isPositive: revenueGrowth.isPositive,
        },
        tomorrowConfirmations: {
            count: tomorrowCount,
            leads: tomorrowLeads,
        },
        todayOccupancy: {
            count: todayAppointments,
            total: 10,
            percent: occupancy,
        },
        averageTicket: {
            value: averageTicket,
            formatted: formatCurrency(averageTicket),
        },
    };
}

/**
 * Retorna métricas vazias (valores zero)
 */
function getEmptyMetrics(): DashboardMetrics {
    return {
        dailyRevenue: {
            value: 0,
            formatted: formatCurrency(0),
        },
        revenueGrowth: {
            value: 0,
            formatted: '+0%',
            isPositive: true,
        },
        tomorrowConfirmations: {
            count: 0,
            leads: [],
        },
        todayOccupancy: {
            count: 0,
            total: 10,
            percent: 0,
        },
        averageTicket: {
            value: 0,
            formatted: formatCurrency(0),
        },
    };
}

/**
 * Filtra leads por data específica
 */
function filterLeadsByDate(leads: MetricsLead[], dateStr: string): MetricsLead[] {
    return leads.filter((lead) => {
        if (!lead.appointment_date) return false;
        const apptDate = lead.appointment_date.split('T')[0];
        return apptDate === dateStr;
    });
}

/**
 * Filtra confirmações de amanhã (agendados)
 */
function filterTomorrowConfirmations(leads: MetricsLead[], tomorrowStr: string): MetricsLead[] {
    return leads.filter((lead) => {
        if (!lead.appointment_date) return false;
        const apptDate = lead.appointment_date.split('T')[0];
        return apptDate === tomorrowStr && lead.status === 'agendado';
    });
}

/**
 * Filtra leads finalizados que compareceram
 */
function filterFinalizedLeads(leads: MetricsLead[]): MetricsLead[] {
    return leads.filter(
        (lead) =>
            lead.status === 'finalizado' &&
            lead.attendance_status === 'compareceu' &&
            (lead.value ?? 0) > 0
    );
}

/**
 * Calcula receita diária somando valores dos leads
 */
function calculateDailyRevenue(leads: MetricsLead[]): number {
    return leads.reduce((sum, lead) => {
        // Tenta pegar valor do campo notes (financial.paymentValue)
        let value = lead.value || 0;

        if (!value && lead.notes) {
            try {
                const financial = parseFinancialData(lead.notes);
                value = parseFloat(financial.paymentValue ?? '0') || 0;
            } catch (_e) {
                // Ignora erros de parse
            }
        }

        return sum + value;
    }, 0);
}

/**
 * Calcula porcentagem de ocupação
 */
function calculateOccupancy(appointments: number, capacity: number = 10): number {
    if (capacity === 0) return 0;
    return Math.min((appointments / capacity) * 100, 100);
}

/**
 * Calcula ticket médio dos leads finalizados
 */
function calculateAverageTicket(finalizedLeads: MetricsLead[]): number {
    if (finalizedLeads.length === 0) return 0;

    const total = finalizedLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
    return total / finalizedLeads.length;
}

/**
 * Parse financial data from notes JSON
 */
function parseFinancialData(notes: string | Record<string, unknown>): FinancialData {
    if (!notes) return {};

    try {
        // Se já é objeto
        if (typeof notes === 'object') {
            return ((notes as Record<string, unknown>).financial as FinancialData) || {};
        }

        // Parse JSON string
        const parsed = JSON.parse(notes) as Record<string, unknown>;
        return (parsed.financial as FinancialData) || {};
    } catch (_e) {
        return {};
    }
}
