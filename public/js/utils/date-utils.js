/**
 * ============================================
 * DATE UTILITIES
 * Funções utilitárias para manipulação de datas
 * ============================================
 */

/**
 * Extrai o horário de uma data ISO
 * @param {string} datetime - Data no formato ISO (2024-01-31T08:00:00)
 * @returns {string} Horário no formato HH:MM
 */
export function extractTimeFromDate(datetime) {
    if (!datetime) return '00:00';
    try {
        const date = new Date(datetime);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (e) {
        return '00:00';
    }
}

/**
 * Formata data para exibição (DD/MM/YYYY)
 * @param {string|Date} date - Data ISO ou objeto Date
 * @returns {string} Data formatada
 */
export function formatDate(date) {
    if (!date) return '';
    try {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return '';
    }
}

/**
 * Formata data e hora completa (DD/MM/YYYY HH:MM)
 * @param {string|Date} datetime - Data ISO ou objeto Date
 * @returns {string} Data e hora formatadas
 */
export function formatDateTime(datetime) {
    if (!datetime) return '';
    try {
        const date = formatDate(datetime);
        const time = extractTimeFromDate(datetime);
        return `${date} ${time}`;
    } catch (e) {
        return '';
    }
}

/**
 * Retorna data de hoje no formato YYYY-MM-DD
 * @returns {string} Data de hoje
 */
export function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Retorna data de amanhã no formato YYYY-MM-DD
 * @returns {string} Data de amanhã
 */
export function getTomorrowString() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Retorna data de ontem no formato YYYY-MM-DD
 * @returns {string} Data de ontem
 */
export function getYesterdayString() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Verifica se uma data é hoje
 * @param {string|Date} date - Data a verificar
 * @returns {boolean} True se for hoje
 */
export function isToday(date) {
    if (!date) return false;
    try {
        const d = new Date(date);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    } catch (e) {
        return false;
    }
}

/**
 * Verifica se uma data é amanhã
 * @param {string|Date} date - Data a verificar
 * @returns {boolean} True se for amanhã
 */
export function isTomorrow(date) {
    if (!date) return false;
    try {
        const d = new Date(date);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return d.toDateString() === tomorrow.toDateString();
    } catch (e) {
        return false;
    }
}
