/**
 * ============================================
 * TESTES UNITÁRIOS - CURRENCY UTILS
 * ============================================
 */

import {
    formatCurrency,
    parseCurrency,
    formatPercent,
    calculateGrowth
} from '../public/js/utils/currency-utils.js';

describe('Currency Utils - formatCurrency', () => {
    test('deve formatar valor para R$', () => {
        expect(formatCurrency(1000)).toBe('R$ 1.000,00');
        expect(formatCurrency(1234.56)).toBe('R$ 1.234,56');
        expect(formatCurrency(0)).toBe('R$ 0,00');
    });
    
    test('deve aceitar string numérica', () => {
        expect(formatCurrency('1000')).toBe('R$ 1.000,00');
        expect(formatCurrency('1234.56')).toBe('R$ 1.234,56');
    });
    
    test('deve retornar R$ 0,00 para valores inválidos', () => {
        expect(formatCurrency(null)).toBe('R$ 0,00');
        expect(formatCurrency(undefined)).toBe('R$ 0,00');
        expect(formatCurrency('invalid')).toBe('R$ 0,00');
        expect(formatCurrency(NaN)).toBe('R$ 0,00');
    });
    
    test('deve formatar valores negativos', () => {
        expect(formatCurrency(-1000)).toBe('-R$ 1.000,00');
    });
});

describe('Currency Utils - parseCurrency', () => {
    test('deve converter moeda formatada para número', () => {
        expect(parseCurrency('R$ 1.000,00')).toBe(1000);
        expect(parseCurrency('R$ 1.234,56')).toBe(1234.56);
    });
    
    test('deve retornar 0 para valores inválidos', () => {
        expect(parseCurrency(null)).toBe(0);
        expect(parseCurrency(undefined)).toBe(0);
        expect(parseCurrency('')).toBe(0);
        expect(parseCurrency('invalid')).toBe(0);
    });
    
    test('deve processar valores negativos', () => {
        expect(parseCurrency('-R$ 1.000,00')).toBe(-1000);
    });
});

describe('Currency Utils - formatPercent', () => {
    test('deve formatar porcentagem', () => {
        expect(formatPercent(0.25)).toBe('25%');
        expect(formatPercent(0.5)).toBe('50%');
        expect(formatPercent(1)).toBe('100%');
        expect(formatPercent(0)).toBe('0%');
    });
    
    test('deve respeitar casas decimais', () => {
        expect(formatPercent(0.255, 1)).toBe('25.5%');
        expect(formatPercent(0.2556, 2)).toBe('25.56%');
    });
    
    test('deve retornar 0% para valores inválidos', () => {
        expect(formatPercent(NaN)).toBe('0%');
        expect(formatPercent(null)).toBe('0%');
    });
});

describe('Currency Utils - calculateGrowth', () => {
    test('deve calcular crescimento positivo', () => {
        const growth = calculateGrowth(1500, 1000);
        expect(growth.value).toBe(50);
        expect(growth.formatted).toBe('+50%');
        expect(growth.isPositive).toBe(true);
    });
    
    test('deve calcular crescimento negativo', () => {
        const growth = calculateGrowth(800, 1000);
        expect(growth.value).toBe(-20);
        expect(growth.formatted).toBe('-20%');
        expect(growth.isPositive).toBe(false);
    });
    
    test('deve calcular crescimento zero', () => {
        const growth = calculateGrowth(1000, 1000);
        expect(growth.value).toBe(0);
        expect(growth.formatted).toBe('+0%');
        expect(growth.isPositive).toBe(true);
    });
    
    test('deve retornar 100% quando valor anterior é zero', () => {
        const growth = calculateGrowth(1000, 0);
        expect(growth.value).toBe(100);
        expect(growth.formatted).toBe('+100%');
        expect(growth.isPositive).toBe(true);
    });
    
    test('deve retornar 0% quando ambos são zero', () => {
        const growth = calculateGrowth(0, 0);
        expect(growth.value).toBe(0);
        expect(growth.formatted).toBe('0%');
        expect(growth.isPositive).toBe(false);
    });
    
    test('deve retornar 100% quando atual > 0 e anterior é null', () => {
        const growth = calculateGrowth(1000, null);
        expect(growth.value).toBe(100);
        expect(growth.formatted).toBe('+100%');
        expect(growth.isPositive).toBe(true);
    });
});
