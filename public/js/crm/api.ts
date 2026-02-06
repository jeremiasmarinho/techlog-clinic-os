// ============================================
// API Configuration and Common Functions
// ============================================

const API_URL: string = '/api/leads';
const ACCESS_TOKEN: string =
    sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('accessToken') ||
    '';

// Notification sound (data URI)
const notificationSound: HTMLAudioElement = new Audio(
    'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBWK66/LIeiyAAAAAA=='
);

// Show/Hide Loading Spinner
function showLoading(show: boolean): void {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

// Show Toast Notification
type NotificationType = 'success' | 'error' | 'warning' | 'info';

function showNotification(message: string, type: NotificationType = 'info'): void {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    const colors: Record<NotificationType, string> = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
    };

    notification.className = `${colors[type] || colors.info} text-white px-6 py-3 rounded-lg shadow-lg mb-2 animate-slide-in`;
    notification.textContent = message;

    container.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Expose globals for cross-file access (IIFE isolation)
(window as unknown as Record<string, unknown>).showLoading = showLoading;
(window as unknown as Record<string, unknown>).showNotification = showNotification;
(window as unknown as Record<string, unknown>).notificationSound = notificationSound;
(window as unknown as Record<string, unknown>).API_URL = API_URL;
