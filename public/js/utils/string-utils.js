/**
 * ============================================
 * STRING UTILITIES
 * Funções utilitárias para manipulação de strings
 * ============================================
 */

/**
 * Formata telefone brasileiro
 * @param {string} phone - Telefone sem formatação (11987654321)
 * @returns {string} Telefone formatado ((11) 98765-4321)
 */
export function formatPhone(phone) {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
}

/**
 * Remove formatação de telefone
 * @param {string} phone - Telefone formatado
 * @returns {string} Apenas dígitos
 */
export function cleanPhone(phone) {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
}

/**
 * Capitaliza primeira letra de cada palavra
 * @param {string} str - String a ser capitalizada
 * @returns {string} String capitalizada
 */
export function capitalize(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Trunca texto com ellipsis
 * @param {string} text - Texto completo
 * @param {number} maxLength - Comprimento máximo
 * @returns {string} Texto truncado
 */
export function truncate(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

/**
 * Gera slug a partir de string
 * @param {string} str - String original
 * @returns {string} Slug (ex: "meu-texto-aqui")
 */
export function slugify(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Espaços para hífens
        .replace(/-+/g, '-') // Remove hífens duplicados
        .trim();
}

/**
 * Valida email
 * @param {string} email - Email a validar
 * @returns {boolean} True se válido
 */
export function isValidEmail(email) {
    if (!email) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Valida CPF (formato e dígitos verificadores)
 * @param {string} cpf - CPF a validar
 * @returns {boolean} True se válido
 */
export function isValidCPF(cpf) {
    if (!cpf) return false;
    
    const cleaned = cpf.replace(/\D/g, '');
    
    if (cleaned.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false; // Todos iguais
    
    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned.charAt(10))) return false;
    
    return true;
}
