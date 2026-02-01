/**
 * Clinic Header Component - Multi-Tenant Support
 * Exibe informações da clínica logada (nome, plano, status)
 */

class ClinicHeader {
    constructor() {
        this.clinicName = sessionStorage.getItem('clinicName') || 'Clínica';
        this.clinicSlug = sessionStorage.getItem('clinicSlug') || '';
        this.userName = sessionStorage.getItem('userName') || 'Usuário';
        this.userRole = sessionStorage.getItem('userRole') || 'staff';
        this.isOwner = sessionStorage.getItem('isOwner') === 'true';
    }

    /**
     * Retorna o badge HTML do plano baseado no slug da clínica
     */
    getPlanBadge() {
        // Inferir plano do nome/slug (pode ser melhorado com API)
        let plan = 'basic';
        let planLabel = 'Basic';
        let planColor = 'bg-gray-500';

        // Simulação: clínicas com "viva" ou "enterprise" são Enterprise
        if (this.clinicSlug.includes('viva') || this.clinicSlug.includes('enterprise')) {
            plan = 'enterprise';
            planLabel = 'Enterprise';
            planColor = 'bg-purple-500';
        } else if (this.clinicSlug.includes('profissional') || this.clinicSlug.includes('pro')) {
            plan = 'professional';
            planLabel = 'Professional';
            planColor = 'bg-blue-500';
        }

        return `
            <span class="${planColor} text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                ${planLabel}
            </span>
        `;
    }

    /**
     * Retorna o badge de role do usuário
     */
    getRoleBadge() {
        const roleMap = {
            super_admin: { label: 'Super Admin', color: 'bg-red-500', icon: 'fa-crown' },
            admin: { label: 'Admin', color: 'bg-cyan-500', icon: 'fa-user-shield' },
            recepcao: { label: 'Recepção', color: 'bg-green-500', icon: 'fa-desk' },
            staff: { label: 'Staff', color: 'bg-blue-500', icon: 'fa-user' },
        };

        const role = roleMap[this.userRole] || roleMap['staff'];

        return `
            <span class="${role.color} text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
                <i class="fas ${role.icon}"></i>
                ${role.label}
            </span>
        `;
    }

    /**
     * Renderiza o header completo
     */
    render() {
        const headerHTML = `
            <div class="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex items-center justify-between h-16">
                        <!-- Logo e Nome da Clínica -->
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-hospital text-cyan-400 text-2xl"></i>
                                <div>
                                    <h1 class="text-white font-bold text-lg leading-tight">${this.clinicName}</h1>
                                    <div class="flex items-center gap-2 mt-0.5">
                                        ${this.getPlanBadge()}
                                        <span class="bg-green-500/20 text-green-400 text-xs font-semibold px-2 py-0.5 rounded">
                                            <i class="fas fa-check-circle mr-1"></i>Ativa
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- User Info e Menu -->
                        <div class="flex items-center space-x-4">
                            <!-- User Badge -->
                            <div class="hidden md:flex items-center space-x-3 bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700">
                                <div class="text-right">
                                    <p class="text-white text-sm font-semibold">${this.userName}</p>
                                    <div class="flex items-center justify-end gap-2">
                                        ${this.getRoleBadge()}
                                        ${this.isOwner ? '<span class="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded"><i class="fas fa-star mr-1"></i>Owner</span>' : ''}
                                    </div>
                                </div>
                                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                                    ${this.userName.charAt(0).toUpperCase()}
                                </div>
                            </div>

                            <!-- Logout Button -->
                            <button 
                                onclick="ClinicHeader.logout()" 
                                class="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-all border border-red-500/20 hover:border-red-500/40 flex items-center gap-2"
                                title="Sair">
                                <i class="fas fa-sign-out-alt"></i>
                                <span class="hidden sm:inline">Sair</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return headerHTML;
    }

    /**
     * Injeta o header no DOM
     */
    inject(targetSelector = 'body') {
        const target = document.querySelector(targetSelector);
        if (target) {
            const headerElement = document.createElement('div');
            headerElement.innerHTML = this.render();
            target.insertBefore(headerElement.firstElementChild, target.firstChild);
        }
    }

    /**
     * Logout estático
     */
    static logout() {
        if (confirm('Deseja realmente sair do sistema?')) {
            sessionStorage.clear();
            window.location.href = '/login.html';
        }
    }

    /**
     * Verifica autenticação
     */
    static checkAuth() {
        const token = sessionStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }

    /**
     * Retorna informações da clínica
     */
    static getClinicInfo() {
        return {
            id: sessionStorage.getItem('clinicId'),
            name: sessionStorage.getItem('clinicName'),
            slug: sessionStorage.getItem('clinicSlug'),
            isOwner: sessionStorage.getItem('isOwner') === 'true',
        };
    }

    /**
     * Retorna informações do usuário
     */
    static getUserInfo() {
        return {
            id: sessionStorage.getItem('userId'),
            name: sessionStorage.getItem('userName'),
            role: sessionStorage.getItem('userRole'),
            isOwner: sessionStorage.getItem('isOwner') === 'true',
        };
    }
}

// Inicializar automaticamente se não for a página de login
if (
    window.location.pathname !== '/login.html' &&
    !window.location.pathname.includes('index.html') &&
    !window.location.pathname.endsWith('/')
) {
    document.addEventListener('DOMContentLoaded', () => {
        // Verificar autenticação
        if (ClinicHeader.checkAuth()) {
            // Injetar header
            const header = new ClinicHeader();
            header.inject();
        }
    });
}

// Exportar para uso global
window.ClinicHeader = ClinicHeader;
