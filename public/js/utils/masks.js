/**
 * Input Masks Utility - Event Delegation Pattern
 * Works with dynamic content (modals, chat, etc)
 */

// ============================================
// CURRENCY MASK (Brazilian Real - BRL)
// ============================================

/**
 * Apply currency mask to a value
 * @param {string} value - Raw value
 * @returns {string} Formatted currency (R$ X.XXX,XX)
 */
function maskCurrency(value) {
    if (!value) return '';
    
    // Remove all non-digit characters
    value = value.replace(/\D/g, '');
    
    // Convert to cents (divide by 100)
    value = (Number(value) / 100).toFixed(2);
    
    // Replace dot with comma (Brazilian format)
    value = value.replace('.', ',');
    
    // Add thousand separators
    value = value.replace(/(\d)(\d{3})(\d{3}),/g, '$1.$2.$3,');
    value = value.replace(/(\d)(\d{3}),/g, '$1.$2,');
    
    return 'R$ ' + value;
}

/**
 * Parse currency string to number
 * @param {string} value - Formatted currency string
 * @returns {number} Numeric value
 */
function parseCurrency(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    
    // Remove currency symbol and thousand separators, replace comma with dot
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

/**
 * Format raw number to currency display
 * @param {number} value - Raw number
 * @returns {string} Formatted currency
 */
function formatCurrencyValue(value) {
    if (!value && value !== 0) return 'R$ 0,00';
    
    const number = typeof value === 'number' ? value : parseFloat(value);
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(number);
}

// ============================================
// PHONE MASK (Brazilian Format)
// ============================================

/**
 * Apply phone mask to a value
 * @param {string} value - Raw phone number
 * @returns {string} Formatted phone (XX) XXXXX-XXXX
 */
function maskPhone(value) {
    if (!value) return '';
    
    // Remove all non-digit characters
    value = value.replace(/\D/g, '');
    
    // Limit to 11 digits (DDD + 9 digits)
    if (value.length > 11) {
        value = value.substring(0, 11);
    }
    
    // Apply formatting
    value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); // Add DDD parentheses
    value = value.replace(/(\d)(\d{4})$/, '$1-$2');     // Add hyphen
    
    return value;
}

/**
 * Parse phone string to clean digits
 * @param {string} value - Formatted phone
 * @returns {string} Clean digits only
 */
function parsePhone(value) {
    if (!value) return '';
    return value.replace(/\D/g, '');
}

/**
 * Format phone number for display
 * @param {string} phone - Raw phone number
 * @returns {string} Formatted phone
 */
function formatPhoneNumber(phone) {
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
function initMaskDelegation() {
    // Global input listener
    document.addEventListener('input', function(e) {
        const target = e.target;
        
        // Currency mask (class: mask-money or mask-currency)
        if (target.classList.contains('mask-money') || 
            target.classList.contains('mask-currency') ||
            target.classList.contains('currency-input')) {
            
            const cursorPosition = target.selectionStart;
            const oldLength = target.value.length;
            
            target.value = maskCurrency(target.value);
            
            // Restore cursor position (approximately)
            const newLength = target.value.length;
            const diff = newLength - oldLength;
            target.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
        }
        
        // Phone mask (class: mask-phone or type="tel")
        if (target.classList.contains('mask-phone') || 
            target.classList.contains('phone-input') ||
            target.type === 'tel') {
            
            const cursorPosition = target.selectionStart;
            const oldLength = target.value.length;
            
            target.value = maskPhone(target.value);
            
            // Restore cursor position
            const newLength = target.value.length;
            const diff = newLength - oldLength;
            target.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
        }
    });
    
    // Validation on blur
    document.addEventListener('blur', function(e) {
        const target = e.target;
        
        // Safety check: ensure target and classList exist
        if (!target || !target.classList) return;
        
        // Phone validation
        if (target.classList.contains('mask-phone') || 
            target.classList.contains('phone-input') ||
            target.type === 'tel') {
            
            const cleaned = target.value.replace(/\D/g, '');
            
            if (cleaned.length > 0 && cleaned.length < 10) {
                target.classList.add('border-red-500');
                target.title = 'Telefone incompleto (mínimo 10 dígitos)';
            } else {
                target.classList.remove('border-red-500');
                target.title = '';
            }
        }
        
        // Currency validation (ensure R$ 0,00 if empty)
        if (target.classList.contains('mask-money') || 
            target.classList.contains('mask-currency') ||
            target.classList.contains('currency-input')) {
            
            if (!target.value || target.value === 'R$ 0,00') {
                target.value = '';
                target.placeholder = 'R$ 0,00';
            }
        }
    }, true); // Use capture phase for blur
    
    // Clear validation on focus
    document.addEventListener('focus', function(e) {
        const target = e.target;
        
        if (target.classList.contains('mask-phone') || 
            target.classList.contains('phone-input') ||
            target.type === 'tel') {
            target.classList.remove('border-red-500');
        }
        
        if (target.classList.contains('mask-money') || 
            target.classList.contains('mask-currency') ||
            target.classList.contains('currency-input')) {
            if (target.value === '') {
                target.placeholder = 'Digite o valor...';
            }
        }
    }, true); // Use capture phase for focus
    
    console.log('✅ Mask delegation initialized (works with dynamic content)');
}

// ============================================
// MANUAL APPLICATION (For existing inputs)
// ============================================

/**
 * Manually apply masks to existing inputs
 * This is a fallback for inputs that already have values
 */
function applyMasksToExistingInputs() {
    // Currency inputs
    document.querySelectorAll('.mask-money, .mask-currency, .currency-input, input[id*="Value"], input[id*="value"]').forEach(input => {
        if (input.value && !input.value.startsWith('R$')) {
            const numValue = parseFloat(input.value);
            if (!isNaN(numValue)) {
                input.value = formatCurrencyValue(numValue);
            }
        }
    });
    
    // Phone inputs
    document.querySelectorAll('.mask-phone, .phone-input, input[type="tel"]').forEach(input => {
        if (input.value && !input.value.includes('(')) {
            input.value = formatPhoneNumber(input.value);
        }
    });
}

// ============================================
// AUTO-INITIALIZATION
// ============================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initMaskDelegation();
        applyMasksToExistingInputs();
    });
} else {
    initMaskDelegation();
    applyMasksToExistingInputs();
}

// Re-apply masks when new content is added (MutationObserver)
const observer = new MutationObserver(() => {
    applyMasksToExistingInputs();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
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

console.log('✅ Masks utility loaded (Event Delegation Pattern)');
