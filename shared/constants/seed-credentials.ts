/**
 * 🔐 CREDENCIAIS DE SEED - FONTE ÚNICA DE VERDADE
 *
 * Este arquivo centraliza TODAS as credenciais usadas nos scripts de seed.
 * Ao alterar uma senha aqui, ela será atualizada em todos os lugares.
 *
 * ⚠️ IMPORTANTE: Após alterar, execute:
 *    npm run validate:logins
 *
 * Documentação: docs/LOGINS.md
 */

export const SEED_CREDENTIALS = {
    // Senha padrão para todos os usuários de desenvolvimento
    DEFAULT_PASSWORD: 'Mudar123!',

    // Usuários por clínica
    users: {
        // Clínica Padrão (ID: 1)
        admin: {
            username: 'admin',
            password: 'Mudar123!',
            role: 'clinic_admin',
            clinicId: 1,
        },

        // Clínica Viva (ID: 2) - Enterprise
        clinicaViva: {
            admin: {
                username: 'carlos@clinicaviva.com',
                password: 'Mudar123!',
                role: 'admin',
                clinicId: 2,
            },
            staff: [
                {
                    username: 'maria@clinicaviva.com',
                    password: 'Mudar123!',
                    role: 'recepcao',
                    clinicId: 2,
                },
                {
                    username: 'joao@clinicaviva.com',
                    password: 'Mudar123!',
                    role: 'recepcao',
                    clinicId: 2,
                },
            ],
        },

        // Saúde Total (ID: 3) - Basic
        saudeTotal: {
            admin: {
                username: 'patricia@saudetotal.com',
                password: 'Mudar123!',
                role: 'admin',
                clinicId: 3,
            },
            staff: [
                {
                    username: 'pedro@saudetotal.com',
                    password: 'Mudar123!',
                    role: 'recepcao',
                    clinicId: 3,
                },
            ],
        },
    },
} as const;

/**
 * Helper para obter todas as credenciais como array flat
 */
export function getAllCredentials(): Array<{
    username: string;
    password: string;
    role: string;
    clinicId: number;
}> {
    const creds = [];

    // Admin padrão
    creds.push(SEED_CREDENTIALS.users.admin);

    // Clínica Viva
    creds.push(SEED_CREDENTIALS.users.clinicaViva.admin);
    creds.push(...SEED_CREDENTIALS.users.clinicaViva.staff);

    // Saúde Total
    creds.push(SEED_CREDENTIALS.users.saudeTotal.admin);
    creds.push(...SEED_CREDENTIALS.users.saudeTotal.staff);

    return creds;
}

/**
 * Para uso em testes E2E
 */
export const TEST_CREDENTIALS = {
    admin: {
        username: SEED_CREDENTIALS.users.admin.username,
        password: SEED_CREDENTIALS.users.admin.password,
    },
    multiTenant: {
        username: SEED_CREDENTIALS.users.clinicaViva.admin.username,
        password: SEED_CREDENTIALS.users.clinicaViva.admin.password,
    },
};
