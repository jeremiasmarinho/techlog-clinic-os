/**
 * ============================================
 * TESTES UNITÁRIOS - STRING UTILS
 * ============================================
 */

import {
    formatPhone,
    cleanPhone,
    capitalize,
    truncate,
    slugify,
    isValidEmail,
    isValidCPF
} from '../public/js/utils/string-utils.js';

describe('String Utils - formatPhone', () => {
    test('deve formatar telefone celular (11 dígitos)', () => {
        expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    });
    
    test('deve formatar telefone fixo (10 dígitos)', () => {
        expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
    });
    
    test('deve retornar string vazia para valor null/undefined', () => {
        expect(formatPhone(null)).toBe('');
        expect(formatPhone(undefined)).toBe('');
    });
    
    test('deve retornar original se não for 10 ou 11 dígitos', () => {
        expect(formatPhone('123')).toBe('123');
    });
});

describe('String Utils - cleanPhone', () => {
    test('deve remover formatação de telefone', () => {
        expect(cleanPhone('(11) 98765-4321')).toBe('11987654321');
        expect(cleanPhone('11 9 8765-4321')).toBe('11987654321');
    });
    
    test('deve retornar string vazia para valor null/undefined', () => {
        expect(cleanPhone(null)).toBe('');
        expect(cleanPhone(undefined)).toBe('');
    });
});

describe('String Utils - capitalize', () => {
    test('deve capitalizar primeira letra de cada palavra', () => {
        expect(capitalize('joão silva')).toBe('João Silva');
        expect(capitalize('MARIA SANTOS')).toBe('Maria Santos');
        expect(capitalize('pedro DE oliveira')).toBe('Pedro De Oliveira');
    });
    
    test('deve retornar string vazia para valor null/undefined', () => {
        expect(capitalize(null)).toBe('');
        expect(capitalize(undefined)).toBe('');
    });
});

describe('String Utils - truncate', () => {
    test('deve truncar texto longo', () => {
        expect(truncate('Este é um texto muito longo', 10)).toBe('Este é um ...');
    });
    
    test('deve retornar texto completo se menor que maxLength', () => {
        expect(truncate('Texto curto', 20)).toBe('Texto curto');
    });
    
    test('deve retornar valor original se null/undefined', () => {
        expect(truncate(null, 10)).toBe(null);
        expect(truncate(undefined, 10)).toBe(undefined);
    });
});

describe('String Utils - slugify', () => {
    test('deve criar slug válido', () => {
        expect(slugify('Meu Texto Aqui')).toBe('meu-texto-aqui');
        expect(slugify('José Antônio')).toBe('jose-antonio');
        expect(slugify('Título: "Com Símbolos!"')).toBe('titulo-com-simbolos');
    });
    
    test('deve remover espaços extras e hífens duplicados', () => {
        expect(slugify('Texto   com   espaços')).toBe('texto-com-espacos');
    });
    
    test('deve retornar string vazia para valor null/undefined', () => {
        expect(slugify(null)).toBe('');
        expect(slugify(undefined)).toBe('');
    });
});

describe('String Utils - isValidEmail', () => {
    test('deve validar email correto', () => {
        expect(isValidEmail('teste@exemplo.com')).toBe(true);
        expect(isValidEmail('usuario.nome@empresa.com.br')).toBe(true);
    });
    
    test('deve rejeitar email inválido', () => {
        expect(isValidEmail('email-invalido')).toBe(false);
        expect(isValidEmail('@exemplo.com')).toBe(false);
        expect(isValidEmail('teste@')).toBe(false);
        expect(isValidEmail('teste @exemplo.com')).toBe(false);
    });
    
    test('deve retornar false para valor null/undefined', () => {
        expect(isValidEmail(null)).toBe(false);
        expect(isValidEmail(undefined)).toBe(false);
        expect(isValidEmail('')).toBe(false);
    });
});

describe('String Utils - isValidCPF', () => {
    test('deve validar CPF válido', () => {
        expect(isValidCPF('12345678909')).toBe(true);
        expect(isValidCPF('111.444.777-35')).toBe(true);
    });
    
    test('deve rejeitar CPF com todos dígitos iguais', () => {
        expect(isValidCPF('11111111111')).toBe(false);
        expect(isValidCPF('00000000000')).toBe(false);
    });
    
    test('deve rejeitar CPF com dígitos verificadores incorretos', () => {
        expect(isValidCPF('12345678900')).toBe(false);
    });
    
    test('deve rejeitar CPF com tamanho incorreto', () => {
        expect(isValidCPF('123')).toBe(false);
        expect(isValidCPF('123456789012345')).toBe(false);
    });
    
    test('deve retornar false para valor null/undefined', () => {
        expect(isValidCPF(null)).toBe(false);
        expect(isValidCPF(undefined)).toBe(false);
        expect(isValidCPF('')).toBe(false);
    });
});
