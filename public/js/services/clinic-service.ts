/**
 * Clinic Service - Gerenciamento de informações da clínica
 * Busca dados da API e armazena localmente
 */

import type { ClinicInfo, LimitCheck, TrialInfo, PlanBadgeConfig } from '../types/models';

interface ClinicData {
    id: number;
    name: string;
    slug: string;
    plan_tier: string;
    status: string;
    max_users: number;
    max_patients: number;
    trial_ends_at?: string;
    logo_url?: string;
    primary_color?: string;
}

export class ClinicService {
    static BASE_URL = '/api';

    /**
     * Busca informações detalhadas da clínica logada
     */
    static async fetchClinicInfo(): Promise<ClinicData> {
        try {
            const token = sessionStorage.getItem('token');
            if (!token) {
                throw new Error('Token não encontrado');
            }

            const response = await fetch(`${this.BASE_URL}/clinic/info`, {
                headers: {
                    'x-access-token': token,
                },
            });

            if (!response.ok) {
                throw new Error('Erro ao buscar informações da clínica');
            }

            const data = await response.json();

            if (data.clinic) {
                sessionStorage.setItem('clinicId', data.clinic.id);
                sessionStorage.setItem('clinicName', data.clinic.name);
                sessionStorage.setItem('clinicSlug', data.clinic.slug);
                sessionStorage.setItem('clinicPlan', data.clinic.plan_tier);
                sessionStorage.setItem('clinicStatus', data.clinic.status);
                sessionStorage.setItem('clinicMaxUsers', data.clinic.max_users);
                sessionStorage.setItem('clinicMaxPatients', data.clinic.max_patients);

                if (data.clinic.trial_ends_at) {
                    sessionStorage.setItem('clinicTrialEndsAt', data.clinic.trial_ends_at);
                }
            }

            return data.clinic;
        } catch {
            return {
                id: parseInt(sessionStorage.getItem('clinicId') || '0'),
                name: sessionStorage.getItem('clinicName') || 'Clínica',
                slug: sessionStorage.getItem('clinicSlug') || '',
                plan_tier: sessionStorage.getItem('clinicPlan') || 'basic',
                status: sessionStorage.getItem('clinicStatus') || 'active',
                max_users: parseInt(sessionStorage.getItem('clinicMaxUsers') || '5'),
                max_patients: parseInt(sessionStorage.getItem('clinicMaxPatients') || '100'),
            };
        }
    }

    /**
     * Retorna informações da clínica do sessionStorage
     */
    static getClinicInfo(): ClinicInfo {
        return {
            id: sessionStorage.getItem('clinicId'),
            name: sessionStorage.getItem('clinicName'),
            slug: sessionStorage.getItem('clinicSlug'),
            plan: sessionStorage.getItem('clinicPlan') || 'basic',
            status: sessionStorage.getItem('clinicStatus') || 'active',
            maxUsers: parseInt(sessionStorage.getItem('clinicMaxUsers') || '5'),
            maxPatients: parseInt(sessionStorage.getItem('clinicMaxPatients') || '100'),
        };
    }

    /**
     * Verifica se atingiu o limite de usuários
     */
    static async checkUserLimit(): Promise<LimitCheck> {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${this.BASE_URL}/users`, {
                headers: { 'x-access-token': token || '' },
            });

            if (!response.ok) return { canAdd: true, current: 0, max: 999 };

            const users = await response.json();
            const clinic = this.getClinicInfo();

            return {
                canAdd: users.length < clinic.maxUsers,
                current: users.length,
                max: clinic.maxUsers,
            };
        } catch {
            return { canAdd: true, current: 0, max: 999 };
        }
    }

    /**
     * Verifica se atingiu o limite de pacientes
     */
    static async checkPatientLimit(): Promise<LimitCheck> {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${this.BASE_URL}/leads`, {
                headers: { 'x-access-token': token || '' },
            });

            if (!response.ok) return { canAdd: true, current: 0, max: 999 };

            const leads = await response.json();
            const clinic = this.getClinicInfo();

            return {
                canAdd: leads.length < clinic.maxPatients,
                current: leads.length,
                max: clinic.maxPatients,
            };
        } catch {
            return { canAdd: true, current: 0, max: 999 };
        }
    }

    /**
     * Mostra alerta de limite atingido
     */
    static showLimitAlert(type: 'user' | 'patient' = 'user'): void {
        const messages: Record<string, { title: string; message: string; icon: string }> = {
            user: {
                title: 'Limite de Usuários Atingido',
                message:
                    'Você atingiu o limite de usuários do seu plano. Faça upgrade para adicionar mais usuários.',
                icon: 'fa-users',
            },
            patient: {
                title: 'Limite de Pacientes Atingido',
                message:
                    'Você atingiu o limite de pacientes do seu plano. Faça upgrade para adicionar mais pacientes.',
                icon: 'fa-user-injured',
            },
        };

        const config = messages[type] || messages.user;

        const alertHTML = `
            <div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" id="limitAlert">
                <div class="bg-gradient-to-br from-slate-900 to-slate-800 border border-yellow-500/30 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
                    <div class="text-center">
                        <div class="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                            <i class="fas ${config.icon} text-yellow-400 text-4xl"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-white mb-2">${config.title}</h3>
                        <p class="text-gray-300 mb-6">${config.message}</p>
                        
                        <div class="flex gap-3">
                            <button 
                                onclick="document.getElementById('limitAlert').remove()" 
                                class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition">
                                Fechar
                            </button>
                            <button 
                                onclick="window.location.href='/settings.html?tab=plan'" 
                                class="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition">
                                <i class="fas fa-crown mr-2"></i>Fazer Upgrade
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', alertHTML);
    }

    /**
     * Retorna badge HTML do plano
     */
    static getPlanBadgeHTML(plan: string): string {
        const plans: Record<string, PlanBadgeConfig> = {
            basic: { label: 'Basic', color: 'gray', icon: 'fa-star' },
            professional: { label: 'Professional', color: 'blue', icon: 'fa-star-half-alt' },
            enterprise: { label: 'Enterprise', color: 'purple', icon: 'fa-crown' },
        };

        const config = plans[plan] || plans.basic;

        return `
            <span class="bg-${config.color}-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide inline-flex items-center gap-1">
                <i class="fas ${config.icon}"></i>
                ${config.label}
            </span>
        `;
    }

    /**
     * Verifica se o trial está próximo do fim
     */
    static checkTrialExpiration(): TrialInfo | null {
        const trialEndsAt = sessionStorage.getItem('clinicTrialEndsAt');
        if (!trialEndsAt) return null;

        const trialEnd = new Date(trialEndsAt);
        const now = new Date();
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 7 && daysLeft > 0) {
            return {
                daysLeft,
                message: `Seu trial expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}!`,
                urgent: daysLeft <= 3,
            };
        }

        return null;
    }

    /**
     * Mostra banner de trial expiração
     */
    static showTrialBanner(): void {
        const trial = this.checkTrialExpiration();
        if (!trial) return;

        const urgentClass = trial.urgent
            ? 'from-red-500 to-orange-500'
            : 'from-yellow-500 to-orange-500';

        const bannerHTML = `
            <div class="bg-gradient-to-r ${urgentClass} text-white px-6 py-3 text-center shadow-lg">
                <i class="fas fa-clock mr-2"></i>
                <strong>${trial.message}</strong>
                <a href="/settings.html?tab=plan" class="ml-4 underline font-bold hover:text-gray-200">
                    Fazer Upgrade Agora
                </a>
            </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', bannerHTML);
    }

    /**
     * Solicita upgrade de plano
     */
    static async requestUpgrade(requestedPlan: string, notes: string = ''): Promise<unknown> {
        const token = sessionStorage.getItem('token');
        if (!token) {
            throw new Error('Sessão inválida. Faça login novamente.');
        }

        const response = await fetch(`${this.BASE_URL}/clinic/upgrade-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,
            },
            body: JSON.stringify({ requested_plan: requestedPlan, notes }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data?.error || 'Erro ao solicitar upgrade');
        }

        return data;
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.ClinicService = ClinicService;
}
