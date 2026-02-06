/**
 * Input Masks Utility - Event Delegation Pattern
 * Works with dynamic content (modals, chat, etc)
 */

// ============================================
// CURRENCY MASK (Brazilian Real - BRL)
// ============================================

/**
 * Apply currency mask to a value
 * @param value - Raw value
 * @returns Formatted currency (R$ X.XXX,XX)
 */
function maskCurrency(value: string): string {
    if (!value) return '';

    value = value.replace(/\D/g, '');
    value = (Number(value) / 100).toFixed(2);
    value = value.replace('.', ',');
    value = value.replace(/(\d)(\d{3})(\d{3}),/g, '$1.$2.$3,');
    value = value.replace(/(\d)(\d{3}),/g, '$1.$2,');

    return 'R$ ' + value;
}

/**
 * Parse currency string to number
 * @param value - Formatted currency string
 * @returns Numeric value
 */
function parseCurrency(value: string | number | null | undefined): number {
    if (!value) return 0;
    if (typeof value === 'number') return value;

    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

/**
 * Format raw number to currency display
 * @param value - Raw number
 * @returns Formatted currency
 */
function formatCurrencyValue(value: number | string | null | undefined): string {
    if (!value && value !== 0) return 'R$ 0,00';

    const number = typeof value === 'number' ? value : parseFloat(value as string);

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(number);
}

// ============================================
// PHONE MASK (Brazilian Format)
// ============================================

/**
 * Apply phone mask to a value
 * @param value - Raw phone number
 * @returns Formatted phone (XX) XXXXX-XXXX
 */
function maskPhone(value: string): string {
    if (!value) return '';

    value = value.replace(/\D/g, '');

    if (value.length > 11) {
        value = value.substring(0, 11);
    }

    value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');

    return value;
}

/**
 * Parse phone string to clean digits
 * @param value - Formatted phone
 * @returns Clean digits only
 */
function parsePhone(value: string | null | undefined): string {
    if (!value) return '';
    return value.replace(/\D/g, '');
}

/**
 * Format phone number for display
 * @param phone - Raw phone number
 * @returns Formatted phone
 */
function formatPhoneNumber(phone: string | null | undefined): string {
    if (!phone) return '';

    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }

    return phone;
}

// ============================================
// EVENT DELEGATION SYSTEM (Universal Listener)
// ============================================

/**
 * Initialize global event delegation for masks
 * This works with dynamic content (modals, chat, etc)
 */
function initMaskDelegation(): void {
    document.addEventListener('input', function (e: Event) {
        const target = e.target as HTMLInputElement;
        if (!target) return;

        if (
            target.classList.contains('mask-money') ||
            target.classList.contains('mask-currency') ||
            target.classList.contains('currency-input')
        ) {
            const cursorPosition = target.selectionStart ?? 0;
            const oldLength = target.value.length;

            target.value = maskCurrency(target.value);

            const newLength = target.value.length;
            const diff = newLength - oldLength;
            target.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
        }

        if (
            target.classList.contains('mask-phone') ||
            target.classList.contains('phone-input') ||
            target.type === 'tel'
        ) {
            const cursorPosition = target.selectionStart ?? 0;
            const oldLength = target.value.length;

            target.value = maskPhone(target.value);

            const newLength = target.value.length;
            const diff = newLength - oldLength;
            target.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
        }
    });

    document.addEventListener(
        'blur',
        function (e: Event) {
            const target = e.target as HTMLInputElement;

            if (!target || !target.classList) return;

            if (
                target.classList.contains('mask-phone') ||
                target.classList.contains('phone-input') ||
                target.type === 'tel'
            ) {
                const cleaned = target.value.replace(/\D/g, '');

                if (cleaned.length > 0 && cleaned.length < 10) {
                    target.classList.add('border-red-500');
                    target.title = 'Telefone incompleto (mínimo 10 dígitos)';
                } else {
                    target.classList.remove('border-red-500');
                    target.title = '';
                }
            }

            if (
                target.classList.contains('mask-money') ||
                target.classList.contains('mask-currency') ||
                target.classList.contains('currency-input')
            ) {
                if (!target.value || target.value === 'R$ 0,00') {
                    target.value = '';
                    target.placeholder = 'R$ 0,00';
                }
            }
        },
        true
    );

    document.addEventListener(
        'focus',
        function (e: Event) {
            const target = e.target as HTMLInputElement;

            if (!target || !target.classList) return;

            if (
                target.classList.contains('mask-phone') ||
                target.classList.contains('phone-input') ||
                target.type === 'tel'
            ) {
                target.classList.remove('border-red-500');
            }

            if (
                target.classList.contains('mask-money') ||
                target.classList.contains('mask-currency') ||
                target.classList.contains('currency-input')
            ) {
                if (target.value === '') {
                    target.placeholder = 'Digite o valor...';
                }
            }
        },
        true
    );
}

// ============================================
// MANUAL APPLICATION (For existing inputs)
// ============================================

/**
 * Manually apply masks to existing inputs
 */
function applyMasksToExistingInputs(): void {
    document
        .querySelectorAll<HTMLInputElement>(
            '.mask-money, .mask-currency, .currency-input, input[id*="Value"], input[id*="value"]'
        )
        .forEach((input) => {
            if (input.value && !input.value.startsWith('R$')) {
                const numValue = parseFloat(input.value);
                if (!isNaN(numValue)) {
                    input.value = formatCurrencyValue(numValue);
                }
            }
        });

    document
        .querySelectorAll<HTMLInputElement>('.mask-phone, .phone-input, input[type="tel"]')
        .forEach((input) => {
            if (input.value && !input.value.includes('(')) {
                input.value = formatPhoneNumber(input.value);
            }
        });
}

// ============================================
// AUTO-INITIALIZATION
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initMaskDelegation();
        applyMasksToExistingInputs();
    });
} else {
    initMaskDelegation();
    applyMasksToExistingInputs();
}

const observer = new MutationObserver(() => {
    applyMasksToExistingInputs();
});

observer.observe(document.body, {
    childList: true,
    subtree: true,
});

// ============================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================

window.maskCurrency = maskCurrency;
window.maskPhone = maskPhone;
window.parseCurrency = parseCurrency;
window.parsePhone = parsePhone;
window.formatCurrencyValue = formatCurrencyValue;
window.formatPhoneNumber = formatPhoneNumber;
window.initMaskDelegation = initMaskDelegation;
window.applyMasksToExistingInputs = applyMasksToExistingInputs;

export {
    maskCurrency,
    maskPhone,
    parseCurrency,
    parsePhone,
    formatCurrencyValue,
    formatPhoneNumber,
    initMaskDelegation,
    applyMasksToExistingInputs,
};
