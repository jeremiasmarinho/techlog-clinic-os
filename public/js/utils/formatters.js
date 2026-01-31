/**
 * Centralized Date/Time Formatting Utilities
 * Ensures consistency across the entire application
 */

// ============================================
// TIME FORMATTING
// ============================================

/**
 * Format time to HH:mm (no seconds)
 * @param {string|Date} dateString - ISO date string, Date object, or time string
 * @returns {string} Formatted time (HH:mm) or '--:--' if invalid
 */
export const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    
    try {
        let date;
        
        // If it's already a Date object
        if (dateString instanceof Date) {
            date = dateString;
        }
        // If it's a string
        else {
            const str = String(dateString);
            
            // Handle ISO format: 2026-01-30T21:00:00.000Z
            if (str.includes('T')) {
                date = new Date(str);
            }
            // Handle time-only format: 21:00:00 or 21:00
            else if (str.includes(':')) {
                const timeParts = str.split(':');
                const hours = timeParts[0].padStart(2, '0');
                const minutes = timeParts[1].padStart(2, '0');
                return `${hours}:${minutes}`;
            }
            // Handle other formats
            else {
                date = new Date(str);
            }
        }
        
        // Validate date
        if (isNaN(date.getTime())) {
            console.warn('⚠️  Invalid date for formatTime:', dateString);
            return '--:--';
        }
        
        // Format to HH:mm
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${hours}:${minutes}`;
        
    } catch (error) {
        console.error('❌ Error formatting time:', error, dateString);
        return '--:--';
    }
};

/**
 * Format time with date context (for tooltips/details)
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted as "DD/MM/YYYY às HH:mm"
 */
export const formatDateTime = (dateString) => {
    if (!dateString) return '--';
    
    try {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return '--';
        }
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${day}/${month}/${year} às ${hours}:${minutes}`;
        
    } catch (error) {
        console.error('❌ Error formatting datetime:', error);
        return '--';
    }
};

/**
 * Format date to aesthetic format: "31 de Jan"
 * NEW: Beautiful Brazilian format with abbreviated month
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted as "DD de MMM" (e.g., "31 de Jan")
 */
export const formatDate = (dateString) => {
    if (!dateString) return '--';
    
    try {
        // Handle timezone issues: add T12:00:00 if date-only string
        let dateToFormat = dateString;
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Date-only format (YYYY-MM-DD) - add midday time to avoid timezone shift
            dateToFormat = dateString + 'T12:00:00';
        }
        
        const date = new Date(dateToFormat);
        
        if (isNaN(date.getTime())) {
            console.warn('⚠️  Invalid date for formatDate:', dateString);
            return '--';
        }
        
        // Extract day
        const day = date.getDate();
        
        // Extract abbreviated month in Portuguese
        let month = date.toLocaleDateString('pt-BR', { month: 'short' });
        
        // Clean up: Remove period and capitalize first letter
        // "jan." -> "Jan"
        month = month.replace('.', '');
        month = month.charAt(0).toUpperCase() + month.slice(1);
        
        return `${day} de ${month}`;
        
    } catch (error) {
        console.error('❌ Error formatting date:', error, dateString);
        return '--';
    }
};

/**
 * Format date in numeric format (DD/MM/YYYY)
 * Traditional format for forms and inputs
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted as "DD/MM/YYYY"
 */
export const formatDateNumeric = (dateString) => {
    if (!dateString) return '--';
    
    try {
        let dateToFormat = dateString;
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateToFormat = dateString + 'T12:00:00';
        }
        
        const date = new Date(dateToFormat);
        
        if (isNaN(date.getTime())) {
            return '--';
        }
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
        
    } catch (error) {
        console.error('❌ Error formatting numeric date:', error);
        return '--';
    }
};

/**
 * Format date with full month name: "31 de Janeiro"
 * Alternative format for formal displays
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted as "DD de MMMM" (e.g., "31 de Janeiro")
 */
export const formatDateFull = (dateString) => {
    if (!dateString) return '--';
    
    try {
        let dateToFormat = dateString;
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateToFormat = dateString + 'T12:00:00';
        }
        
        const date = new Date(dateToFormat);
        
        if (isNaN(date.getTime())) {
            return '--';
        }
        
        const day = date.getDate();
        let month = date.toLocaleDateString('pt-BR', { month: 'long' });
        month = month.charAt(0).toUpperCase() + month.slice(1);
        
        return `${day} de ${month}`;
        
    } catch (error) {
        console.error('❌ Error formatting full date:', error);
        return '--';
    }
};

/**
 * Format date with abbreviated month (e.g., "31/Jan")
 * Compact format for tight spaces
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted as "DD/MMM"
 */
export const formatDateShort = (dateString) => {
    if (!dateString) return '--';
    
    try {
        // Handle timezone issues: add T12:00:00 if date-only string
        let dateToFormat = dateString;
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateToFormat = dateString + 'T12:00:00';
        }
        
        const date = new Date(dateToFormat);
        
        if (isNaN(date.getTime())) {
            return '--';
        }
        
        const day = String(date.getDate()).padStart(2, '0');
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const month = months[date.getMonth()];
        
        return `${day}/${month}`;
        
    } catch (error) {
        console.error('❌ Error formatting short date:', error);
        return '--';
    }
};

/**
 * Format date and time with abbreviated month (e.g., "31/Jan, 14:30")
 * Used in Kanban cards for compact display
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted as "DD/MMM, HH:mm"
 */
export const formatDateTimeShort = (dateString) => {
    if (!dateString) return '--';
    
    try {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return '--';
        }
        
        const day = String(date.getDate()).padStart(2, '0');
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const month = months[date.getMonth()];
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${day}/${month}, ${hours}:${minutes}`;
        
    } catch (error) {
        console.error('❌ Error formatting short datetime:', error);
        return '--';
    }
};

// ============================================
// CURRENCY FORMATTING
// ============================================

/**
 * Format currency to Brazilian Real
 * @param {number|string} value - Numeric value or string
 * @returns {string} Formatted as "R$ X.XXX,XX"
 */
export const formatCurrency = (value) => {
    if (!value && value !== 0) return 'R$ 0,00';
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) return 'R$ 0,00';
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numValue);
};

// ============================================
// PHONE FORMATTING
// ============================================

/**
 * Format phone number to Brazilian standard
 * @param {string} phone - Raw phone number
 * @returns {string} Formatted as "(XX) XXXXX-XXXX"
 */
export const formatPhone = (phone) => {
    if (!phone) return '-';
    
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
};

// ============================================
// TEXT FORMATTING
// ============================================

/**
 * Format text by removing underscores/hyphens and capitalizing words
 * @param {string} text - Raw text (e.g., 'primeira_consulta')
 * @returns {string} Formatted text (e.g., 'Primeira Consulta')
 */
export const formatText = (text) => {
    if (!text) return '';
    
    return text
        .replace(/[_-]/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
};

// ============================================
// RELATIVE TIME (Time Ago)
// ============================================

/**
 * Calculate relative time (e.g., "5m", "2h", "3d")
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Relative time string
 */
export const getTimeAgo = (dateString) => {
    if (!dateString) return 'Sem data';
    
    try {
        const now = new Date();
        const past = new Date(dateString);
        const diffMs = now - past;
        
        if (isNaN(past.getTime())) {
            return 'Data inválida';
        }
        
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        return `${diffDays}d`;
        
    } catch (error) {
        console.error('❌ Error calculating time ago:', error);
        return 'Erro';
    }
};

// ============================================
// CONSOLE LOG
// ============================================

console.log('✅ Formatters utility loaded (Centralized Date/Time/Currency/Phone)');

// ============================================
// EXPOSE GLOBALLY (for backward compatibility)
// ============================================

if (typeof window !== 'undefined') {
    window.formatTime = formatTime;
    window.formatDateTime = formatDateTime;
    window.formatDate = formatDate;
    window.formatDateNumeric = formatDateNumeric;
    window.formatDateFull = formatDateFull;
    window.formatDateShort = formatDateShort;
    window.formatDateTimeShort = formatDateTimeShort;
    window.formatCurrency = formatCurrency;
    window.formatPhone = formatPhone;
    window.formatText = formatText;
    window.getTimeAgo = getTimeAgo;
}
