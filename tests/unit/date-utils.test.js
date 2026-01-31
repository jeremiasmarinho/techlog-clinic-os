/**
 * ============================================
 * TESTES UNITÁRIOS - DATE UTILS
 * ============================================
 */

import {
    extractTimeFromDate,
    formatDate,
    formatDateTime,
    getTodayString,
    getTomorrowString,
    getYesterdayString,
    isToday,
    isTomorrow
} from '../public/js/utils/date-utils.js';

// Mock de console para testes silenciosos
const originalConsole = { ...console };
beforeAll(() => {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
});

afterAll(() => {
    Object.assign(console, originalConsole);
});

describe('Date Utils - extractTimeFromDate', () => {
    test('deve extrair horário de data ISO', () => {
        expect(extractTimeFromDate('2024-01-31T08:30:00')).toBe('08:30');
        expect(extractTimeFromDate('2024-01-31T14:15:00')).toBe('14:15');
        expect(extractTimeFromDate('2024-01-31T23:59:00')).toBe('23:59');
    });
    
    test('deve retornar 00:00 para data inválida', () => {
        expect(extractTimeFromDate(null)).toBe('00:00');
        expect(extractTimeFromDate(undefined)).toBe('00:00');
        expect(extractTimeFromDate('')).toBe('00:00');
        expect(extractTimeFromDate('invalid')).toBe('00:00');
    });
    
    test('deve formatar com zero à esquerda', () => {
        expect(extractTimeFromDate('2024-01-31T09:05:00')).toBe('09:05');
        expect(extractTimeFromDate('2024-01-31T00:00:00')).toBe('00:00');
    });
});

describe('Date Utils - formatDate', () => {
    test('deve formatar data para DD/MM/YYYY', () => {
        expect(formatDate('2024-01-31')).toBe('31/01/2024');
        expect(formatDate('2024-12-25')).toBe('25/12/2024');
    });
    
    test('deve retornar string vazia para data inválida', () => {
        expect(formatDate(null)).toBe('');
        expect(formatDate(undefined)).toBe('');
        expect(formatDate('')).toBe('');
    });
    
    test('deve aceitar objeto Date', () => {
        const date = new Date('2024-01-31');
        expect(formatDate(date)).toContain('31');
        expect(formatDate(date)).toContain('01');
        expect(formatDate(date)).toContain('2024');
    });
});

describe('Date Utils - formatDateTime', () => {
    test('deve formatar data e hora completa', () => {
        const result = formatDateTime('2024-01-31T08:30:00');
        expect(result).toContain('31/01/2024');
        expect(result).toContain('08:30');
    });
    
    test('deve retornar string vazia para datetime inválido', () => {
        expect(formatDateTime(null)).toBe('');
        expect(formatDateTime(undefined)).toBe('');
    });
});

describe('Date Utils - getTodayString', () => {
    test('deve retornar data de hoje no formato YYYY-MM-DD', () => {
        const today = getTodayString();
        expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        // Verificar se é realmente hoje
        const todayDate = new Date().toISOString().split('T')[0];
        expect(today).toBe(todayDate);
    });
});

describe('Date Utils - getTomorrowString', () => {
    test('deve retornar data de amanhã no formato YYYY-MM-DD', () => {
        const tomorrow = getTomorrowString();
        expect(tomorrow).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        // Verificar se é realmente amanhã
        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowStr = tomorrowDate.toISOString().split('T')[0];
        expect(tomorrow).toBe(tomorrowStr);
    });
});

describe('Date Utils - getYesterdayString', () => {
    test('deve retornar data de ontem no formato YYYY-MM-DD', () => {
        const yesterday = getYesterdayString();
        expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        // Verificar se é realmente ontem
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
        expect(yesterday).toBe(yesterdayStr);
    });
});

describe('Date Utils - isToday', () => {
    test('deve identificar data de hoje', () => {
        const today = new Date();
        expect(isToday(today)).toBe(true);
        expect(isToday(today.toISOString())).toBe(true);
    });
    
    test('deve rejeitar data de ontem', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        expect(isToday(yesterday)).toBe(false);
    });
    
    test('deve retornar false para data inválida', () => {
        expect(isToday(null)).toBe(false);
        expect(isToday(undefined)).toBe(false);
        expect(isToday('')).toBe(false);
    });
});

describe('Date Utils - isTomorrow', () => {
    test('deve identificar data de amanhã', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        expect(isTomorrow(tomorrow)).toBe(true);
        expect(isTomorrow(tomorrow.toISOString())).toBe(true);
    });
    
    test('deve rejeitar data de hoje', () => {
        const today = new Date();
        expect(isTomorrow(today)).toBe(false);
    });
    
    test('deve retornar false para data inválida', () => {
        expect(isTomorrow(null)).toBe(false);
        expect(isTomorrow(undefined)).toBe(false);
    });
});
