/**
 * ============================================
 * DATE UTILITIES
 * Funções utilitárias para manipulação de datas
 * ============================================
 */

/**
 * Extrai o horário de uma data ISO
 * @param datetime - Data no formato ISO (2024-01-31T08:00:00)
 * @returns Horário no formato HH:MM
 */
export function extractTimeFromDate(datetime: string | null | undefined): string {
    if (!datetime) return '00:00';
    try {
        const date = new Date(datetime);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch {
        return '00:00';
    }
}

/**
 * Formata data para exibição (DD/MM/YYYY)
 * @param date - Data ISO ou objeto Date
 * @returns Data formatada
 */
export function formatDate(date: string | Date | null | undefined): string {
    if (!date) return '';
    try {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } catch {
        return '';
    }
}

/**
 * Formata data e hora completa (DD/MM/YYYY HH:MM)
 * @param datetime - Data ISO ou objeto Date
 * @returns Data e hora formatadas
 */
export function formatDateTime(datetime: string | Date | null | undefined): string {
    if (!datetime) return '';
    try {
        const date = formatDate(datetime);
        const time = extractTimeFromDate(
            typeof datetime === 'string' ? datetime : datetime.toISOString()
        );
        return `${date} ${time}`;
    } catch {
        return '';
    }
}

/**
 * Retorna data de hoje no formato YYYY-MM-DD
 * @returns Data de hoje
 */
export function getTodayString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Retorna data de amanhã no formato YYYY-MM-DD
 * @returns Data de amanhã
 */
export function getTomorrowString(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Retorna data de ontem no formato YYYY-MM-DD
 * @returns Data de ontem
 */
export function getYesterdayString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Verifica se uma data é hoje
 * @param date - Data a verificar
 * @returns True se for hoje
 */
export function isToday(date: string | Date | null | undefined): boolean {
    if (!date) return false;
    try {
        const d = new Date(date);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    } catch {
        return false;
    }
}

/**
 * Verifica se uma data é amanhã
 * @param date - Data a verificar
 * @returns True se for amanhã
 */
export function isTomorrow(date: string | Date | null | undefined): boolean {
    if (!date) return false;
    try {
        const d = new Date(date);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return d.toDateString() === tomorrow.toDateString();
    } catch {
        return false;
    }
}

// Expose globals for cross-file access (IIFE isolation)
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).extractTimeFromDate = extractTimeFromDate;
    (window as unknown as Record<string, unknown>).formatDate = formatDate;
    (window as unknown as Record<string, unknown>).formatDateTime = formatDateTime;
    (window as unknown as Record<string, unknown>).isToday = isToday;
    (window as unknown as Record<string, unknown>).isTomorrow = isTomorrow;
}
