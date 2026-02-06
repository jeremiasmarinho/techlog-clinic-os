/**
 * Centralized Date/Time Formatting Utilities
 * Ensures consistency across the entire application
 */

// ============================================
// TIME FORMATTING
// ============================================

/**
 * Format time to HH:mm (no seconds)
 * @param dateString - ISO date string, Date object, or time string
 * @returns Formatted time (HH:mm) or '--:--' if invalid
 */
export const formatTime = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return '--:--';

    try {
        let date: Date | undefined;

        if (dateString instanceof Date) {
            date = dateString;
        } else {
            const str = String(dateString);

            if (str.includes('T')) {
                date = new Date(str);
            } else if (str.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)) {
                const parts = str.split(' ');
                const timePart = parts[1];
                const [hours, minutes] = timePart.split(':');
                return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
            } else if (str.includes(':') && !str.includes(' ')) {
                const timeParts = str.split(':');
                const hours = timeParts[0].padStart(2, '0');
                const minutes = timeParts[1].padStart(2, '0');
                return `${hours}:${minutes}`;
            } else {
                date = new Date(str);
            }
        }

        if (!date || isNaN(date.getTime())) {
            return '--:--';
        }

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${hours}:${minutes}`;
    } catch {
        return '--:--';
    }
};

/**
 * Format time with date context (for tooltips/details)
 * @param dateString - ISO date string or Date object
 * @returns Formatted as "DD/MM/YYYY às HH:mm"
 */
export const formatDateTime = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return '--';

    try {
        let date: Date;
        const str = String(dateString);

        if (str.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)) {
            date = new Date(str.replace(' ', 'T'));
        } else {
            date = new Date(dateString);
        }

        if (isNaN(date.getTime())) {
            return '--';
        }

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}/${month}/${year} às ${hours}:${minutes}`;
    } catch {
        return '--';
    }
};

/**
 * Format date to aesthetic format: "31 de Jan"
 * @param dateString - ISO date string or Date object
 * @returns Formatted as "DD de MMM" (e.g., "31 de Jan")
 */
export const formatDate = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return '--';

    try {
        let dateToFormat: string | Date = dateString;
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateToFormat = dateString + 'T12:00:00';
        }

        const date = new Date(dateToFormat);

        if (isNaN(date.getTime())) {
            return '--';
        }

        const day = date.getDate();

        let month = date.toLocaleDateString('pt-BR', { month: 'short' });
        month = month.replace('.', '');
        month = month.charAt(0).toUpperCase() + month.slice(1);

        return `${day} de ${month}`;
    } catch {
        return '--';
    }
};

/**
 * Format date in numeric format (DD/MM/YYYY)
 * @param dateString - ISO date string or Date object
 * @returns Formatted as "DD/MM/YYYY"
 */
export const formatDateNumeric = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return '--';

    try {
        let dateToFormat: string | Date = dateString;
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
    } catch {
        return '--';
    }
};

/**
 * Format date with full month name: "31 de Janeiro"
 * @param dateString - ISO date string or Date object
 * @returns Formatted as "DD de MMMM" (e.g., "31 de Janeiro")
 */
export const formatDateFull = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return '--';

    try {
        let dateToFormat: string | Date = dateString;
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
    } catch {
        return '--';
    }
};

/**
 * Format date with abbreviated month (e.g., "31/Jan")
 * @param dateString - ISO date string or Date object
 * @returns Formatted as "DD/MMM"
 */
export const formatDateShort = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return '--';

    try {
        let dateToFormat: string | Date = dateString;
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateToFormat = dateString + 'T12:00:00';
        }

        const date = new Date(dateToFormat);

        if (isNaN(date.getTime())) {
            return '--';
        }

        const day = String(date.getDate()).padStart(2, '0');
        const months = [
            'Jan',
            'Fev',
            'Mar',
            'Abr',
            'Mai',
            'Jun',
            'Jul',
            'Ago',
            'Set',
            'Out',
            'Nov',
            'Dez',
        ];
        const month = months[date.getMonth()];

        return `${day}/${month}`;
    } catch {
        return '--';
    }
};

/**
 * Format date and time with abbreviated month (e.g., "31/Jan, 14:30")
 * @param dateString - ISO date string or Date object
 * @returns Formatted as "DD/MMM, HH:mm"
 */
export const formatDateTimeShort = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return '--';

    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return '--';
        }

        const day = String(date.getDate()).padStart(2, '0');
        const months = [
            'Jan',
            'Fev',
            'Mar',
            'Abr',
            'Mai',
            'Jun',
            'Jul',
            'Ago',
            'Set',
            'Out',
            'Nov',
            'Dez',
        ];
        const month = months[date.getMonth()];
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${day}/${month}, ${hours}:${minutes}`;
    } catch {
        return '--';
    }
};

// ============================================
// CURRENCY FORMATTING
// ============================================

/**
 * Format currency to Brazilian Real
 * @param value - Numeric value or string
 * @returns Formatted as "R$ X.XXX,XX"
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
    if (!value && value !== 0) return 'R$ 0,00';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) return 'R$ 0,00';

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(numValue);
};

// ============================================
// PHONE FORMATTING
// ============================================

/**
 * Format phone number to Brazilian standard
 * @param phone - Raw phone number
 * @returns Formatted as "(XX) XXXXX-XXXX"
 */
export const formatPhone = (phone: string | null | undefined): string => {
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
 * @param text - Raw text (e.g., 'primeira_consulta')
 * @returns Formatted text (e.g., 'Primeira Consulta')
 */
export const formatText = (text: string | null | undefined): string => {
    if (!text) return '';

    return text
        .replace(/[_-]/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

// ============================================
// RELATIVE TIME (Time Ago)
// ============================================

/**
 * Calculate relative time (e.g., "5m", "2h", "3d")
 * @param dateString - ISO date string or Date object
 * @returns Relative time string
 */
export const getTimeAgo = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return 'Sem data';

    try {
        const now = new Date();
        const past = new Date(dateString);
        const diffMs = now.getTime() - past.getTime();

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
    } catch {
        return 'Erro';
    }
};

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
