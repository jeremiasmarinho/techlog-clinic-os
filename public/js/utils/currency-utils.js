/**
 * ============================================
 * CURRENCY UTILITIES
 * Funções utilitárias para formatação de moeda
 * ============================================
 */

/**
 * Formata valor para moeda brasileira (R$)
 * @param {number|string} value - Valor numérico
 * @returns {string} Valor formatado (ex: R$ 1.234,56)
 */
export function formatCurrency(value) {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numValue);
}

/**
 * Remove formatação de moeda e retorna número
 * @param {string} formatted - Valor formatado (ex: "R$ 1.234,56")
 * @returns {number} Valor numérico
 */
export function parseCurrency(formatted) {
    if (!formatted) return 0;
    
    const cleaned = formatted
        .replace(/[^\d,-]/g, '') // Remove tudo exceto dígitos, vírgula e hífen
        .replace(',', '.'); // Troca vírgula por ponto
    
    return parseFloat(cleaned) || 0;
}

/**
 * Formata porcentagem
 * @param {number} value - Valor decimal (ex: 0.25 para 25%)
 * @param {number} decimals - Casas decimais (padrão: 0)
 * @returns {string} Porcentagem formatada (ex: "25%")
 */
export function formatPercent(value, decimals = 0) {
    if (isNaN(value)) return '0%';
    const percent = value * 100;
    return `${percent.toFixed(decimals)}%`;
}

/**
 * Calcula porcentagem de crescimento
 * @param {number} current - Valor atual
 * @param {number} previous - Valor anterior
 * @returns {object} { value: number, formatted: string, isPositive: boolean }
 */
export function calculateGrowth(current, previous) {
    if (!previous || previous === 0) {
        return {
            value: current > 0 ? 100 : 0,
            formatted: current > 0 ? '+100%' : '0%',
            isPositive: current > 0
        };
    }
    
    const growth = ((current - previous) / previous) * 100;
    const isPositive = growth >= 0;
    const formatted = `${isPositive ? '+' : ''}${growth.toFixed(0)}%`;
    
    return {
        value: growth,
        formatted,
        isPositive
    };
}
