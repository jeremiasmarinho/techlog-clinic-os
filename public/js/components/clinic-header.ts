/**
 * Clinic Header Component - Multi-Tenant Support
 * Exibe informações da clínica logada (nome, plano, status)
 */

interface RoleConfig {
    label: string;
    color: string;
    icon: string;
}

class ClinicHeader {
    clinicName: string;
    clinicSlug: string;
    clinicLogoUrl: string;
    userName: string;
    userRole: string;
    isOwner: boolean;

    constructor() {
        this.clinicName = sessionStorage.getItem('clinicName') || 'Clínica';
        this.clinicSlug = sessionStorage.getItem('clinicSlug') || '';
        this.clinicLogoUrl = sessionStorage.getItem('clinicLogoUrl') || '';
        this.userName = sessionStorage.getItem('userName') || 'Usuário';
        this.userRole = sessionStorage.getItem('userRole') || 'staff';
        this.isOwner = sessionStorage.getItem('isOwner') === 'true';
    }

    getPlanBadge(): string {
        let planLabel = 'Basic';
        let planColor = 'bg-gray-500';

        if (this.clinicSlug.includes('viva') || this.clinicSlug.includes('enterprise')) {
            planLabel = 'Enterprise';
            planColor = 'bg-purple-500';
        } else if (this.clinicSlug.includes('profissional') || this.clinicSlug.includes('pro')) {
            planLabel = 'Professional';
            planColor = 'bg-blue-500';
        }

        return `
            <span class="${planColor} text-white text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                ${planLabel}
            </span>
        `;
    }

    getRoleBadge(): string {
        const roleMap: Record<string, RoleConfig> = {
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

    render(): string {
        return `
            <div class="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 shadow-lg">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex items-center justify-between h-16">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-2">
                                ${this.clinicLogoUrl ? `<img id="clinicHeaderLogo" src="${this.clinicLogoUrl}" class="w-10 h-10 rounded-lg object-cover border border-white/20" alt="Logo">` : '<i id="clinicHeaderIcon" class="fas fa-hospital text-cyan-400 text-2xl"></i>'}
                                <div>
                                    <h1 id="clinicHeaderName" class="text-white font-bold text-lg leading-tight">${this.clinicName}</h1>
                                    <div class="flex items-center gap-2 mt-0.5">
                                        ${this.getPlanBadge()}
                                        <span class="bg-green-500/20 text-green-400 text-xs font-semibold px-2 py-0.5 rounded">
                                            <i class="fas fa-check-circle mr-1"></i>Ativa
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
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
    }

    inject(targetSelector: string = 'body'): void {
        const target = document.querySelector(targetSelector);
        if (target) {
            const headerElement = document.createElement('div');
            headerElement.innerHTML = this.render();
            const firstChild = headerElement.firstElementChild;
            if (firstChild) {
                target.insertBefore(firstChild, target.firstChild);
            }
        }
    }

    static logout(): void {
        if (confirm('Deseja realmente sair do sistema?')) {
            sessionStorage.clear();
            window.location.href = '/login.html';
        }
    }

    static checkAuth(): boolean {
        const token = sessionStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }

    static getClinicInfo(): {
        id: string | null;
        name: string | null;
        slug: string | null;
        isOwner: boolean;
    } {
        return {
            id: sessionStorage.getItem('clinicId'),
            name: sessionStorage.getItem('clinicName'),
            slug: sessionStorage.getItem('clinicSlug'),
            isOwner: sessionStorage.getItem('isOwner') === 'true',
        };
    }

    static getUserInfo(): {
        id: string | null;
        name: string | null;
        role: string | null;
        isOwner: boolean;
    } {
        return {
            id: sessionStorage.getItem('userId'),
            name: sessionStorage.getItem('userName'),
            role: sessionStorage.getItem('userRole'),
            isOwner: sessionStorage.getItem('isOwner') === 'true',
        };
    }
}

if (
    window.location.pathname !== '/login.html' &&
    !window.location.pathname.includes('index.html') &&
    !window.location.pathname.endsWith('/')
) {
    document.addEventListener('DOMContentLoaded', () => {
        if ((document.body?.dataset as DOMStringMap)?.hideClinicHeader === 'true') {
            return;
        }
        if (ClinicHeader.checkAuth()) {
            const header = new ClinicHeader();
            header.inject();
        }
    });
}

(window as unknown as Record<string, unknown>).ClinicHeader = ClinicHeader;

export { ClinicHeader };
