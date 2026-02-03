/**
 * Clinic Configuration Manager
 * Centralizes clinic settings loading and application across the app
 */

// Cache key for localStorage
const CACHE_KEY = 'clinicSettings';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load clinic configuration from API
 * Uses localStorage cache to minimize API calls
 */
export async function loadClinicConfig(forceRefresh = false) {
    try {
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
            const cached = getCachedSettings();
            if (cached) {
                console.log('✅ Using cached clinic settings');
                return cached;
            }
        }

        // Fetch from API - use /api/clinic/info (doesn't require admin)
        const token =
            sessionStorage.getItem('MEDICAL_CRM_TOKEN') || sessionStorage.getItem('token');

        if (!token) {
            console.warn('⚠️ No auth token found, using default settings');
            return getDefaultSettings();
        }

        const response = await fetch('/api/clinic/info', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 404 || response.status === 403) {
                console.log('⚠️ No clinic settings found, using defaults');
                return getDefaultSettings();
            }
            throw new Error('Failed to load clinic settings');
        }

        const data = await response.json();

        // Map clinic info to settings format
        const settings = {
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

        // Cache settings
        cacheSettings(settings);

        console.log('✅ Clinic settings loaded from API:', settings);

        return settings;
    } catch (error) {
        console.error('❌ Error loading clinic config:', error);
        return getDefaultSettings();
    }
}

/**
 * Get cached settings from localStorage
 */
function getCachedSettings() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const { settings, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid
        if (now - timestamp < CACHE_DURATION) {
            return settings;
        }

        // Cache expired
        localStorage.removeItem(CACHE_KEY);
        return null;
    } catch (error) {
        console.error('Error reading cache:', error);
        localStorage.removeItem(CACHE_KEY);
        return null;
    }
}

/**
 * Cache settings to localStorage
 */
function cacheSettings(settings) {
    try {
        const cacheData = {
            settings,
            timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Error caching settings:', error);
    }
}

/**
 * Clear cached settings (call after updating settings)
 */
export function clearSettingsCache() {
    localStorage.removeItem(CACHE_KEY);
    console.log('🗑️ Settings cache cleared');
}

/**
 * Get default settings (fallback)
 */
function getDefaultSettings() {
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
export async function applyBranding(settings) {
    if (!settings) {
        settings = await loadClinicConfig();
    }

    const identity = settings.identity || {};

    // Apply logo to sidebar
    const sidebarLogo = document.getElementById('sidebar-logo');
    const logoIcon = document.getElementById('logo-icon');

    if (sidebarLogo && identity.logo) {
        sidebarLogo.src = identity.logo;
        sidebarLogo.classList.remove('hidden');
        if (logoIcon) {
            logoIcon.classList.add('hidden');
        }
        console.log('✅ Sidebar logo updated');
    }

    // Apply primary color to CSS variables
    if (identity.primaryColor) {
        document.documentElement.style.setProperty('--primary-color', identity.primaryColor);
        console.log('✅ Primary color applied:', identity.primaryColor);
    }

    // Apply clinic name to title/header if exists
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
export async function populateInsuranceSelects(selectIds = []) {
    try {
        const settings = await loadClinicConfig();
        const insurancePlans = settings.insurancePlans || getDefaultSettings().insurancePlans;

        selectIds.forEach((selectId) => {
            const select = document.getElementById(selectId);
            if (!select) {
                console.warn(`⚠️ Select not found: ${selectId}`);
                return;
            }

            // Clear existing options (except first placeholder)
            const firstOption = select.querySelector('option:first-child');
            select.innerHTML = '';
            if (firstOption) {
                select.appendChild(firstOption);
            }

            // Add insurance options
            insurancePlans.forEach((plan) => {
                const option = document.createElement('option');
                option.value = plan;
                option.textContent = plan;
                select.appendChild(option);
            });

            console.log(`✅ Insurance options populated for #${selectId}:`, insurancePlans);
        });
    } catch (error) {
        console.error('❌ Error populating insurance selects:', error);
    }
}

/**
 * Get working hours for a specific day
 */
export function isClinicOpen(day = null) {
    const settings = getCachedSettings() || getDefaultSettings();
    const hours = settings.hours;

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
export async function initClinicConfig() {
    console.log('🏥 Initializing clinic configuration...');

    const settings = await loadClinicConfig();
    await applyBranding(settings);

    console.log('✅ Clinic configuration initialized');

    return settings;
}
