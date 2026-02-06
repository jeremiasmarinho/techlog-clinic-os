/**
 * ============================================
 * TESTES UNITÁRIOS - FORMATTERS (TypeScript)
 * Testes para formatadores centralizados
 * ============================================
 */
import {
    formatTime,
    formatDateTime,
    formatDate,
    formatDateNumeric,
    formatDateFull,
    formatDateShort,
    formatDateTimeShort,
    formatCurrency,
    formatPhone,
    formatText,
    getTimeAgo,
} from '../../public/js/utils/formatters';

// ============================================
// formatTime
// ============================================
describe('Formatters - formatTime', () => {
    test('deve formatar ISO string para HH:mm', () => {
        expect(formatTime('2024-01-31T08:30:00')).toBe('08:30');
        expect(formatTime('2024-01-31T14:15:00')).toBe('14:15');
        expect(formatTime('2024-01-31T00:00:00')).toBe('00:00');
    });

    test('deve formatar string com espaço (YYYY-MM-DD HH:MM)', () => {
        expect(formatTime('2024-01-31 08:30')).toBe('08:30');
        expect(formatTime('2024-01-31 14:15:00')).toBe('14:15');
    });

    test('deve formatar string de horário simples (HH:MM)', () => {
        expect(formatTime('08:30')).toBe('08:30');
        expect(formatTime('9:5')).toBe('09:05');
    });

    test('deve aceitar objeto Date', () => {
        const date = new Date('2024-01-31T10:45:00');
        expect(formatTime(date)).toBe('10:45');
    });

    test('deve retornar --:-- para valores inválidos', () => {
        expect(formatTime(null)).toBe('--:--');
        expect(formatTime(undefined)).toBe('--:--');
        expect(formatTime('invalid')).toBe('--:--');
    });
});

// ============================================
// formatDateTime
// ============================================
describe('Formatters - formatDateTime', () => {
    test('deve formatar data e hora completa', () => {
        const result = formatDateTime('2024-01-31T08:30:00');
        expect(result).toContain('31/01/2024');
        expect(result).toContain('08:30');
    });

    test('deve formatar string com espaço', () => {
        const result = formatDateTime('2024-01-31 14:15:00');
        expect(result).toContain('31/01/2024');
        expect(result).toContain('14:15');
    });

    test('deve retornar -- para valores inválidos', () => {
        expect(formatDateTime(null)).toBe('--');
        expect(formatDateTime(undefined)).toBe('--');
    });
});

// ============================================
// formatDate
// ============================================
describe('Formatters - formatDate', () => {
    test('deve formatar data para DD de MMM', () => {
        const result = formatDate('2024-01-31');
        expect(result).toContain('31');
        expect(result).toContain('de');
    });

    test('deve retornar -- para valores inválidos', () => {
        expect(formatDate(null)).toBe('--');
        expect(formatDate(undefined)).toBe('--');
    });
});

// ============================================
// formatDateNumeric
// ============================================
describe('Formatters - formatDateNumeric', () => {
    test('deve formatar data para DD/MM/YYYY', () => {
        expect(formatDateNumeric('2024-01-31T12:00:00')).toBe('31/01/2024');
        expect(formatDateNumeric('2024-12-25T12:00:00')).toBe('25/12/2024');
    });

    test('deve formatar apenas data YYYY-MM-DD', () => {
        const result = formatDateNumeric('2024-01-31');
        expect(result).toContain('31');
        expect(result).toContain('01');
        expect(result).toContain('2024');
    });

    test('deve retornar -- para valores inválidos', () => {
        expect(formatDateNumeric(null)).toBe('--');
        expect(formatDateNumeric(undefined)).toBe('--');
    });
});

// ============================================
// formatDateFull
// ============================================
describe('Formatters - formatDateFull', () => {
    test('deve formatar data com mês por extenso', () => {
        const result = formatDateFull('2024-01-31');
        expect(result).toContain('31');
        expect(result).toContain('de');
    });

    test('deve retornar -- para valores inválidos', () => {
        expect(formatDateFull(null)).toBe('--');
        expect(formatDateFull(undefined)).toBe('--');
    });
});

// ============================================
// formatDateShort
// ============================================
describe('Formatters - formatDateShort', () => {
    test('deve formatar data como DD/MMM', () => {
        const result = formatDateShort('2024-01-31');
        expect(result).toMatch(/^\d{2}\/[A-Z][a-z]{2}$/);
        expect(result).toContain('31');
        expect(result).toContain('Jan');
    });

    test('deve retornar -- para valores inválidos', () => {
        expect(formatDateShort(null)).toBe('--');
        expect(formatDateShort(undefined)).toBe('--');
    });
});

// ============================================
// formatDateTimeShort
// ============================================
describe('Formatters - formatDateTimeShort', () => {
    test('deve formatar data e hora curtos', () => {
        const result = formatDateTimeShort('2024-01-31T14:30:00');
        expect(result).toContain('31');
        expect(result).toContain('Jan');
        expect(result).toContain('14:30');
    });

    test('deve retornar -- para valores inválidos', () => {
        expect(formatDateTimeShort(null)).toBe('--');
        expect(formatDateTimeShort(undefined)).toBe('--');
    });
});

// ============================================
// formatCurrency
// ============================================
// Intl.NumberFormat usa NBSP (\u00a0) entre símbolo e valor
const R$ = (v: string): string => `R$\u00a0${v}`;

describe('Formatters - formatCurrency', () => {
    test('deve formatar valor para R$', () => {
        expect(formatCurrency(1000)).toBe(R$('1.000,00'));
        expect(formatCurrency(0)).toBe(R$('0,00'));
        expect(formatCurrency(1234.56)).toBe(R$('1.234,56'));
    });

    test('deve aceitar string numérica', () => {
        expect(formatCurrency('500')).toBe(R$('500,00'));
    });

    test('deve retornar R$ 0,00 para valores inválidos', () => {
        // Valores inválidos retornam string hardcoded com espaço regular
        expect(formatCurrency(null)).toBe('R$ 0,00');
        expect(formatCurrency(undefined)).toBe('R$ 0,00');
        expect(formatCurrency('invalid')).toBe('R$ 0,00');
    });
});

// ============================================
// formatPhone
// ============================================
describe('Formatters - formatPhone', () => {
    test('deve formatar telefone celular (11 dígitos)', () => {
        expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    });

    test('deve formatar telefone fixo (10 dígitos)', () => {
        expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
    });

    test('deve retornar - para valores null/undefined', () => {
        expect(formatPhone(null)).toBe('-');
        expect(formatPhone(undefined)).toBe('-');
    });
});

// ============================================
// formatText
// ============================================
describe('Formatters - formatText', () => {
    test('deve substituir underscores e capitalizar', () => {
        expect(formatText('primeira_consulta')).toBe('Primeira Consulta');
        expect(formatText('em_atendimento')).toBe('Em Atendimento');
    });

    test('deve substituir hífens e capitalizar', () => {
        expect(formatText('follow-up')).toBe('Follow Up');
    });

    test('deve retornar string vazia para valores inválidos', () => {
        expect(formatText(null)).toBe('');
        expect(formatText(undefined)).toBe('');
        expect(formatText('')).toBe('');
    });
});

// ============================================
// getTimeAgo
// ============================================
describe('Formatters - getTimeAgo', () => {
    test('deve retornar "Agora" para datas recentes', () => {
        const now = new Date();
        expect(getTimeAgo(now)).toBe('Agora');
        expect(getTimeAgo(now.toISOString())).toBe('Agora');
    });

    test('deve retornar minutos para diferença < 1 hora', () => {
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
        expect(getTimeAgo(thirtyMinAgo)).toBe('30m');
    });

    test('deve retornar horas para diferença < 24 horas', () => {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        expect(getTimeAgo(twoHoursAgo)).toBe('2h');
    });

    test('deve retornar dias para diferença >= 24 horas', () => {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        expect(getTimeAgo(threeDaysAgo)).toBe('3d');
    });

    test('deve retornar "Sem data" para valores null/undefined', () => {
        expect(getTimeAgo(null)).toBe('Sem data');
        expect(getTimeAgo(undefined)).toBe('Sem data');
    });
});
