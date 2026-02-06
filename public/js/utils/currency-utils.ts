/**
 * ============================================
 * CURRENCY UTILITIES
 * Funções utilitárias para formatação de moeda
 * ============================================
 */

import type { GrowthResult } from '../types/models';

/**
 * Formata valor para moeda brasileira (R$)
 * @param value - Valor numérico
 * @returns Valor formatado (ex: R$ 1.234,56)
 */
export function formatCurrency(value: number | string | null | undefined): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (numValue == null || isNaN(numValue)) return 'R$ 0,00';

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(numValue);
}

/**
 * Remove formatação de moeda e retorna número
 * @param formatted - Valor formatado (ex: "R$ 1.234,56")
 * @returns Valor numérico
 */
export function parseCurrency(formatted: string | null | undefined): number {
    if (!formatted) return 0;

    const cleaned = formatted.replace(/[^\d,-]/g, '').replace(',', '.');

    return parseFloat(cleaned) || 0;
}

/**
 * Formata porcentagem
 * @param value - Valor decimal (ex: 0.25 para 25%)
 * @param decimals - Casas decimais (padrão: 0)
 * @returns Porcentagem formatada (ex: "25%")
 */
export function formatPercent(value: number, decimals: number = 0): string {
    if (isNaN(value)) return '0%';
    const percent = value * 100;
    return `${percent.toFixed(decimals)}%`;
}

/**
 * Calcula porcentagem de crescimento
 * @param current - Valor atual
 * @param previous - Valor anterior
 * @returns Objeto com valor, formatado e direção
 */
export function calculateGrowth(current: number, previous: number): GrowthResult {
    if (!previous || previous === 0) {
        return {
            value: current > 0 ? 100 : 0,
            formatted: current > 0 ? '+100%' : '0%',
            isPositive: current > 0,
        };
    }

    const growth = ((current - previous) / previous) * 100;
    const isPositive = growth >= 0;
    const formatted = `${isPositive ? '+' : ''}${growth.toFixed(0)}%`;

    return {
        value: growth,
        formatted,
        isPositive,
    };
}
