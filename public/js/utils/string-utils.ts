/**
 * ============================================
 * STRING UTILITIES
 * Funções utilitárias para manipulação de strings
 * ============================================
 */

/**
 * Formata telefone brasileiro
 * @param phone - Telefone sem formatação (11987654321)
 * @returns Telefone formatado ((11) 98765-4321)
 */
export function formatPhone(phone: string | null | undefined): string {
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
 * @param phone - Telefone formatado
 * @returns Apenas dígitos
 */
export function cleanPhone(phone: string | null | undefined): string {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
}

/**
 * Capitaliza primeira letra de cada palavra
 * @param str - String a ser capitalizada
 * @returns String capitalizada
 */
export function capitalize(str: string | null | undefined): string {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Trunca texto com ellipsis
 * @param text - Texto completo
 * @param maxLength - Comprimento máximo
 * @returns Texto truncado
 */
export function truncate(text: string | null | undefined, maxLength: number): string {
    if (!text || text.length <= maxLength) return text || '';
    return text.slice(0, maxLength) + '...';
}

/**
 * Gera slug a partir de string
 * @param str - String original
 * @returns Slug (ex: "meu-texto-aqui")
 */
export function slugify(str: string | null | undefined): string {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/**
 * Valida email
 * @param email - Email a validar
 * @returns True se válido
 */
export function isValidEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Valida CPF (formato e dígitos verificadores)
 * @param cpf - CPF a validar
 * @returns True se válido
 */
export function isValidCPF(cpf: string | null | undefined): boolean {
    if (!cpf) return false;

    const cleaned = cpf.replace(/\D/g, '');

    if (cleaned.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleaned)) return false;

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
