/**
 * Medical CRM - Sidebar Component
 * Web Component reutilizável para navegação lateral
 */

class MedicalSidebar extends HTMLElement {
    constructor() {
        super();
        this.mainContentRetries = 0;
    }

    async connectedCallback() {
        // Read attributes here, when they are guaranteed to be available
        this.activePage = this.getAttribute('active') || 'admin';
        this.showDateFilter = this.getAttribute('show-date-filter') === 'true';

        this.render();
        this.initSidebar();
        this.loadUserName();

        // ============================================
        // APPLY CLINIC BRANDING (LOGO + COLORS)
        // ============================================
        try {
            await this.applyClinicBranding();
        } catch (error) {
            console.error('❌ Error applying sidebar branding:', error);
        }
    }

    async applyClinicBranding() {
        try {
            const token =
                sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
                sessionStorage.getItem('token') ||
                sessionStorage.getItem('accessToken');
            if (!token) {
                console.warn('⚠️ No token, skipping branding');
                return;
            }

            // Check cache first
            const cached = localStorage.getItem('clinicSettings');
            let settings;

            if (cached) {
                const { settings: cachedSettings, timestamp } = JSON.parse(cached);
                const now = Date.now();
                if (now - timestamp < 5 * 60 * 1000) {
                    // 5 min cache
                    settings = cachedSettings;
                    console.log('✅ Using cached clinic settings for branding');
                }
            }

            // Fetch if no cache - use /api/clinic/info (doesn't require admin)
            if (!settings) {
                const response = await fetch('/api/clinic/info', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    // Map clinic info to settings format
                    settings = {
                        identity: {
                            name: data.clinic?.name || data.name,
                            logo: data.clinic?.logo_url || data.logo_url,
                            primaryColor: data.clinic?.primary_color || '#0891b2',
                        },
                    };
                    // Cache it
                    localStorage.setItem(
                        'clinicSettings',
                        JSON.stringify({
                            settings,
                            timestamp: Date.now(),
                        })
                    );
                    console.log('✅ Clinic info loaded from API');
                }
            }

            if (settings && settings.identity) {
                // Apply logo
                const sidebarLogo = this.querySelector('#sidebar-logo');
                const logoIcon = this.querySelector('#logo-icon');

                if (sidebarLogo && settings.identity.logo) {
                    sidebarLogo.src = settings.identity.logo;
                    sidebarLogo.classList.remove('hidden');
                    if (logoIcon) logoIcon.classList.add('hidden');
                    console.log('✅ Sidebar logo updated');
                }

                // Apply clinic name
                if (settings.identity.name) {
                    const clinicNameEl = this.querySelector('.clinic-name');
                    if (clinicNameEl) {
                        clinicNameEl.textContent = settings.identity.name;
                    }
                }

                // Apply primary color
                if (settings.identity.primaryColor) {
                    document.documentElement.style.setProperty(
                        '--primary-color',
                        settings.identity.primaryColor
                    );
                    console.log('✅ Primary color applied:', settings.identity.primaryColor);
                }
            }
        } catch (error) {
            console.error('❌ Error in applyClinicBranding:', error);
        }
    }

    render() {
        const dateFilterHTML = this.showDateFilter
            ? `
            <!-- Date Filter -->
            <div class="px-5 mb-6">
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-10 h-10 flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-calendar-alt text-cyan-400 text-lg"></i>
                    </div>
                    <span class="sidebar-text text-gray-300 text-xs font-semibold whitespace-nowrap">Período</span>
                </div>
                <select 
                    id="dateFilter" 
                    onchange="handleDateFilterChange()"
                    class="w-full bg-slate-800/90 border border-slate-700 text-white text-xs font-semibold rounded-lg px-3 py-2 hover:bg-slate-700/90 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 transition-all cursor-pointer"
                    title="Filtrar por período"
                    style="appearance: none; -webkit-appearance: none; -moz-appearance: none; background-image: url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2306b6d4%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E'); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 2.5rem;"
                >
                    <option value="today">Hoje</option>
                    <option value="7days" selected>7 Dias</option>
                    <option value="30days">30 Dias</option>
                    <option value="thisMonth">Este Mês</option>
                    <option value="all">Tudo</option>
                </select>
            </div>
        `
            : '';

        this.innerHTML = `
            <!-- Modern Vertical Sidebar -->
            <aside id="sidebar" class="sidebar fixed left-0 top-0 h-screen w-20 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 transition-all duration-300 z-50 overflow-hidden">
                <div class="flex flex-col h-full py-6">
                    <!-- Logo + Toggle Button -->
                    <div class="px-5 mb-8">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                <!-- Dynamic Clinic Logo (loaded from settings) -->
                                <img id="sidebar-logo" src="" alt="Logo" class="w-full h-full object-cover hidden" />
                                <!-- Fallback Icon -->
                                <i id="logo-icon" class="fas fa-hospital text-white text-lg"></i>
                            </div>
                            <div class="sidebar-text whitespace-nowrap overflow-hidden">
                                <h2 class="text-white font-bold text-sm clinic-name">Medical CRM</h2>
                                <p class="text-cyan-400 text-xs">Gestão</p>
                            </div>
                        </div>
                        <!-- Toggle Sidebar Button -->
                        <button id="toggleSidebarBtn" class="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-all" title="Expandir/Recolher">
                            <i class="fas fa-angles-right" id="toggleIcon"></i>
                        </button>
                    </div>

                    <!-- User Info -->
                    <div class="px-5 mb-6 pb-6 border-b border-slate-700/50">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-user-circle text-cyan-400 text-xl"></i>
                            </div>
                            <div class="sidebar-text whitespace-nowrap overflow-hidden">
                                <p class="text-white text-sm font-medium">Olá,</p>
                                <p id="userName" class="text-cyan-400 text-xs font-bold">Admin</p>
                            </div>
                        </div>
                    </div>

                    ${dateFilterHTML}

                    <!-- Navigation -->
                    <nav class="flex-1 px-3 space-y-2">
                        <a href="admin.html" class="sidebar-item ${this.activePage === 'admin' ? 'bg-cyan-500/20' : ''}">
                            <i class="fas fa-th-large"></i>
                            <span>Kanban</span>
                        </a>
                        
                        <a href="agenda.html" class="sidebar-item ${this.activePage === 'agenda' ? 'bg-cyan-500/20' : ''}">
                            <i class="fas fa-calendar-day"></i>
                            <span>Agenda</span>
                        </a>
                        
                        <a href="patients.html" class="sidebar-item ${this.activePage === 'patients' ? 'bg-cyan-500/20' : ''}">
                            <i class="fas fa-users"></i>
                            <span>Pacientes</span>
                        </a>
                        
                        <a href="relatorios.html" class="sidebar-item ${this.activePage === 'relatorios' ? 'bg-cyan-500/20' : ''}">
                            <i class="fas fa-chart-pie"></i>
                            <span>Relatórios</span>
                        </a>
                        
                        <a href="settings.html" class="sidebar-item ${this.activePage === 'settings' ? 'bg-cyan-500/20' : ''}">
                            <i class="fas fa-cog"></i>
                            <span>Configurações</span>
                        </a>
                        
                        ${
                            this.activePage === 'admin'
                                ? `
                        <button id="teamButton" onclick="openTeamModal()" class="sidebar-item hidden">
                            <i class="fas fa-user-cog"></i>
                            <span>Equipe</span>
                        </button>
                        
                        <button id="togglePrivacy" onclick="togglePrivacyMode()" class="sidebar-item" title="Modo Privacidade">
                            <i class="fas fa-eye" id="privacyIcon"></i>
                            <span>Privacidade</span>
                        </button>
                        
                        <button onclick="loadLeads()" class="sidebar-item">
                            <i class="fas fa-sync-alt"></i>
                            <span>Atualizar</span>
                        </button>
                        `
                                : ''
                        }
                    </nav>

                    <!-- Logout -->
                    <div class="px-3 pt-6 border-t border-slate-700/50">
                        <button onclick="logout()" class="sidebar-item bg-gradient-to-r from-red-600/80 to-red-700/80 hover:from-red-600 hover:to-red-700">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Sair</span>
                        </button>
                    </div>
                </div>
            </aside>

            <!-- Mobile Overlay -->
            <div id="sidebarOverlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 hidden"></div>
        `;
    }

    initSidebar() {
        // Default: expanded (true) - user can close if they want
        const savedState = localStorage.getItem('sidebarExpanded');
        const sidebarExpanded = savedState === null ? true : savedState === 'true';
        const sidebar = this.querySelector('#sidebar');

        if (sidebarExpanded) {
            sidebar.classList.add('expanded');
            this.applyMainContentState(true);
        } else {
            this.applyMainContentState(false);
        }

        // Toggle button click
        this.querySelector('#toggleSidebarBtn')?.addEventListener('click', () => {
            sidebar.classList.toggle('expanded');
            const isExpanded = sidebar.classList.contains('expanded');
            this.applyMainContentState(isExpanded);

            localStorage.setItem('sidebarExpanded', isExpanded);
        });

        // Mobile overlay click
        this.querySelector('#sidebarOverlay')?.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            this.querySelector('#sidebarOverlay').classList.toggle('show');
        });

        // Setup button event listeners (for functions that need to be called)
        const dashboardBtn = this.querySelector('[onclick="openDashboard()"]');
        if (dashboardBtn && typeof window.openDashboard === 'function') {
            dashboardBtn.removeAttribute('onclick');
            dashboardBtn.addEventListener('click', () => window.openDashboard());
        }

        const teamBtn = this.querySelector('[onclick="openTeamModal()"]');
        if (teamBtn && typeof window.openTeamModal === 'function') {
            teamBtn.removeAttribute('onclick');
            teamBtn.addEventListener('click', () => window.openTeamModal());
        }

        const privacyBtn = this.querySelector('[onclick="togglePrivacyMode()"]');
        if (privacyBtn && typeof window.togglePrivacyMode === 'function') {
            privacyBtn.removeAttribute('onclick');
            privacyBtn.addEventListener('click', () => window.togglePrivacyMode());
        }

        const refreshBtn = this.querySelector('[onclick="loadLeads()"]');
        if (refreshBtn && typeof window.loadLeads === 'function') {
            refreshBtn.removeAttribute('onclick');
            refreshBtn.addEventListener('click', () => window.loadLeads());
        }

        const logoutBtn = this.querySelector('[onclick="logout()"]');
        if (logoutBtn && typeof window.logout === 'function') {
            logoutBtn.removeAttribute('onclick');
            logoutBtn.addEventListener('click', () => window.logout());
        }
    }

    applyMainContentState(isExpanded) {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) {
            if (this.mainContentRetries < 10) {
                this.mainContentRetries += 1;
                requestAnimationFrame(() => this.applyMainContentState(isExpanded));
            }
            return;
        }

        mainContent.classList.toggle('expanded', isExpanded);
        this.mainContentRetries = 0;
    }

    loadUserName() {
        // Load username from auth or localStorage
        const token =
            sessionStorage.getItem('token') ||
            sessionStorage.getItem('accessToken') ||
            localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userNameEl = this.querySelector('#userName');
                if (userNameEl && payload.name) {
                    userNameEl.textContent = payload.name;
                }
            } catch (e) {
                console.error('Error parsing token:', e);
            }
        }
    }
}

// Register the custom element
customElements.define('medical-sidebar', MedicalSidebar);
