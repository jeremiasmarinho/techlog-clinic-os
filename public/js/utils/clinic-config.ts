/**
 * Clinic Configuration Manager
 * Centralizes clinic settings loading and application across the app
 */

import type { ClinicSettings } from '../types/models';

const CACHE_KEY = 'clinicSettings';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedData {
    settings: ClinicSettings;
    timestamp: number;
}

/**
 * Load clinic configuration from API
 * Uses localStorage cache to minimize API calls
 */
export async function loadClinicConfig(forceRefresh: boolean = false): Promise<ClinicSettings> {
    try {
        if (!forceRefresh) {
            const cached = getCachedSettings();
            if (cached) {
                return cached;
            }
        }

        const token =
            sessionStorage.getItem('MEDICAL_CRM_TOKEN') || sessionStorage.getItem('token');

        if (!token) {
            return getDefaultSettings();
        }

        const response = await fetch('/api/clinic/info', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 404 || response.status === 403) {
                return getDefaultSettings();
            }
            throw new Error('Failed to load clinic settings');
        }

        const data = await response.json();

        const settings: ClinicSettings = {
            identity: {
                name: data.clinic?.name || data.name,
                logo: data.clinic?.logo_url || data.logo_url,
                primaryColor: data.clinic?.primary_color || '#0891b2',
            },
            insurancePlans: data.clinic?.insurance_plans || [
                'Particular',
                'Unimed',
                'Bradesco Saúde',
            ],
        };

        cacheSettings(settings);

        return settings;
    } catch {
        return getDefaultSettings();
    }
}

/**
 * Get cached settings from localStorage
 */
function getCachedSettings(): ClinicSettings | null {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const { settings, timestamp }: CachedData = JSON.parse(cached);
        const now = Date.now();

        if (now - timestamp < CACHE_DURATION) {
            return settings;
        }

        localStorage.removeItem(CACHE_KEY);
        return null;
    } catch {
        localStorage.removeItem(CACHE_KEY);
        return null;
    }
}

/**
 * Cache settings to localStorage
 */
function cacheSettings(settings: ClinicSettings): void {
    try {
        const cacheData: CachedData = {
            settings,
            timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch {
        // silently fail
    }
}

/**
 * Clear cached settings (call after updating settings)
 */
export function clearSettingsCache(): void {
    localStorage.removeItem(CACHE_KEY);
}

/**
 * Get default settings (fallback)
 */
function getDefaultSettings(): ClinicSettings {
    return {
        identity: {
            name: 'Clínica',
            phone: '',
            address: '',
            primaryColor: '#06b6d4',
            logo: null,
        },
        hours: {
            opening: '08:00',
            closing: '18:00',
            lunchStart: '',
            lunchEnd: '',
            workingDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
        },
        insurancePlans: ['Particular', 'Unimed', 'Bradesco Saúde', 'Amil'],
        chatbot: {
            greeting: '',
            awayMessage: '',
            instructions: '',
        },
    };
}

/**
 * Apply branding (logo, colors) to the application
 */
export async function applyBranding(settings?: ClinicSettings | null): Promise<void> {
    if (!settings) {
        settings = await loadClinicConfig();
    }

    const identity = settings.identity || {};

    const sidebarLogo = document.getElementById('sidebar-logo') as HTMLImageElement | null;
    const logoIcon = document.getElementById('logo-icon');

    if (sidebarLogo && identity.logo) {
        sidebarLogo.src = identity.logo;
        sidebarLogo.classList.remove('hidden');
        if (logoIcon) {
            logoIcon.classList.add('hidden');
        }
    }

    if (identity.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', identity.primaryColor);
    }

    if (identity.name) {
        const clinicNameElements = document.querySelectorAll('.clinic-name');
        clinicNameElements.forEach((el) => {
            el.textContent = identity.name;
        });
    }
}

/**
 * Populate insurance select options from clinic settings
 */
export async function populateInsuranceSelects(selectIds: string[] = []): Promise<void> {
    try {
        const settings = await loadClinicConfig();
        const insurancePlans = settings.insurancePlans || getDefaultSettings().insurancePlans;

        selectIds.forEach((selectId) => {
            const select = document.getElementById(selectId) as HTMLSelectElement | null;
            if (!select) {
                return;
            }

            const firstOption = select.querySelector('option:first-child');
            select.innerHTML = '';
            if (firstOption) {
                select.appendChild(firstOption);
            }

            insurancePlans.forEach((plan) => {
                const option = document.createElement('option');
                option.value = plan;
                option.textContent = plan;
                select.appendChild(option);
            });
        });
    } catch {
        // silently fail
    }
}

/**
 * Get working hours for a specific day
 */
export function isClinicOpen(day?: string | null): boolean {
    const settings = getCachedSettings() || getDefaultSettings();
    const hours = settings.hours;

    if (!hours) return true;

    if (!day) {
        const now = new Date();
        const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
        day = daysMap[now.getDay()];
    }

    return hours.workingDays.includes(day);
}

/**
 * Initialize clinic config on page load
 */
export async function initClinicConfig(): Promise<ClinicSettings> {
    const settings = await loadClinicConfig();
    await applyBranding(settings);

    return settings;
}
