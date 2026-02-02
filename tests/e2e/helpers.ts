import { Page, expect } from '@playwright/test';

// ============================================================================
// CREDENTIALS - Credenciais de teste para E2E
// ============================================================================

export const CREDENTIALS = {
    // Usuário admin padrão (criado no seed)
    valid: {
        username: 'admin',
        password: 'Mudar123!',
    },
    // Credenciais inválidas para testes de erro
    invalid: {
        username: 'usuario_inexistente',
        password: 'senha_errada',
    },
    // Super Admin (criado no seed multi-tenant)
    superAdmin: {
        username: 'superadmin',
        password: 'Mudar123!',
    },
    // Clinic Admin (usuário admin padrão é clinic_admin na maioria dos casos)
    clinicAdmin: {
        username: 'admin',
        password: 'Mudar123!',
    },
    // Staff/Recepção
    staff: {
        username: 'joao.silva',
        password: 'Mudar123!',
    },
};

// ============================================================================
// LOGIN HELPERS
// ============================================================================

/**
 * Faz login como admin padrão
 */
export async function loginAsAdmin(page: Page) {
    await page.goto('/login.html');

    // Preenche credenciais (mesmas do seed: username='admin', senha='Mudar123!')
    await page.fill('#email', CREDENTIALS.valid.username);
    await page.fill('#password', CREDENTIALS.valid.password);

    // Clica e espera navegação
    await page.click('button[type="submit"]');

    // CORREÇÃO: Aceita admin.html OU kanban.html OU agenda.html OU saas-admin.html
    // Isso evita que o teste quebre se você mudar a página inicial
    await page.waitForURL(/.*(admin|kanban|agenda|saas-admin)\.html/, { timeout: 15000 });
}

/**
 * Faz login com credenciais específicas
 */
export async function loginAs(page: Page, username: string, password: string) {
    await page.goto('/login.html');

    await page.fill('#email', username);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');

    // Aguarda ou mensagem de erro ou redirecionamento
    const result = await Promise.race([
        page
            .waitForURL(/.*(admin|kanban|agenda|saas-admin|patients)\.html/, { timeout: 15000 })
            .then(() => ({ success: true, error: null })),
        page
            .waitForSelector(
                '.text-red-400, .bg-red-100, [class*="error"], #errorMessage:not(.hidden)',
                { timeout: 5000 }
            )
            .then(async () => {
                const errorText = await page
                    .locator('.text-red-400, .bg-red-100 .text-red-700, [class*="error"]')
                    .first()
                    .textContent();
                return { success: false, error: errorText || 'Credenciais incorretas' };
            })
            .catch(() => ({ success: false, error: null })), // Timeout esperando erro, pode ter redirecionado
    ]);

    if (!result.success && result.error) {
        throw new Error(`Login falhou para '${username}': ${result.error}`);
    }

    // Verifica se realmente redirecionou
    if (page.url().includes('login.html')) {
        const errorVisible = await page
            .locator('.text-red-400')
            .isVisible()
            .catch(() => false);
        if (errorVisible) {
            const errorText = await page.locator('.text-red-400').textContent();
            throw new Error(`Login falhou para '${username}': ${errorText}`);
        }
        throw new Error(`Login não redirecionou para página autenticada para '${username}'`);
    }
}

/**
 * Obtém dados da sessão do usuário logado
 */
export async function getUserSession(page: Page): Promise<{
    token: string | null;
    userName: string | null;
    userRole: string | null;
    clinicId: number | null;
    isOwner: boolean;
}> {
    return await page.evaluate(() => {
        const token =
            sessionStorage.getItem('MEDICAL_CRM_TOKEN') ||
            sessionStorage.getItem('accessToken') ||
            sessionStorage.getItem('token');

        // Tenta pegar user do localStorage primeiro
        const localUserStr = localStorage.getItem('user');
        let user = null;

        try {
            user = localUserStr ? JSON.parse(localUserStr) : null;
        } catch (e) {
            // Ignora erro de parsing
        }

        // Se não encontrou no localStorage, tenta extrair do token JWT
        if (!user && token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                user = {
                    name: payload.name,
                    role: payload.role,
                    clinicId: payload.clinicId,
                    clinic_id: payload.clinicId,
                    isOwner: payload.isOwner,
                };
            } catch (e2) {
                console.error('Failed to decode token');
            }
        }

        return {
            token,
            userName: user?.name || sessionStorage.getItem('userName') || null,
            userRole: user?.role || null,
            clinicId: user?.clinicId || user?.clinic_id || null,
            isOwner: user?.isOwner || user?.is_owner || false,
        };
    });
}

// ============================================================================
// PATIENT HELPERS
// ============================================================================

export async function createPatient(page: Page, name: string) {
    // Navega para aba pacientes se não estiver nela
    if (!page.url().includes('patients.html') && !page.url().includes('kanban.html')) {
        await page.goto('/patients.html');
    }

    // Abre modal
    const btnNew = page
        .locator('button:has-text("Novo Paciente"), button:has-text("Adicionar")')
        .first();
    if (await btnNew.isVisible()) {
        await btnNew.click();
    } else {
        // Fallback para botão flutuante ou diferente
        await page.goto('/patients.html');
        await page.getByText('Novo Paciente').click();
    }

    // Preenche formulário
    await page.fill('input[name="name"]', name);
    await page.fill('input[name="phone"]', '11999999999');

    // CPF Generator simples para passar na validação
    const cpf = generateCPF();
    await page.fill('input[name="cpf"]', cpf);

    // Salva
    await page.click('button[type="submit"]');

    // Espera o modal fechar ou o toast aparecer
    await page.waitForTimeout(1000);
}

// ============================================================================
// MODAL HELPERS
// ============================================================================

export async function closeOpenModals(page: Page) {
    // Fecha modais/overlays comuns (se existirem)
    const closeSelectors = [
        'button:has-text("Fechar")',
        'button:has-text("Cancelar")',
        'button[aria-label="Close"]',
        '[data-dismiss="modal"]',
        '.modal button.close',
    ];

    for (const selector of closeSelectors) {
        const buttons = page.locator(selector);
        const count = await buttons.count();
        if (count > 0) {
            for (let i = 0; i < count; i += 1) {
                const btn = buttons.nth(i);
                if (await btn.isVisible()) {
                    await btn.click();
                }
            }
        }
    }

    // Fallback: pressiona ESC para fechar overlays
    await page.keyboard.press('Escape');
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

function generateCPF(): string {
    const rnd = (n: number) => Math.round(Math.random() * n);
    const mod = (base: number, div: number) => Math.round(base - Math.floor(base / div) * div);
    const n = Array(9)
        .fill(0)
        .map(() => rnd(9));

    let d1 = n.reduce((total, num, i) => total + num * (10 - i), 0);
    d1 = 11 - mod(d1, 11);
    if (d1 >= 10) d1 = 0;

    let d2 = n.reduce((total, num, i) => total + num * (11 - i), 0) + d1 * 2;
    d2 = 11 - mod(d2, 11);
    if (d2 >= 10) d2 = 0;

    return `${n.join('')}${d1}${d2}`;
}

/**
 * Aguarda um elemento aparecer e estar visível
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000) {
    await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Verifica se um toast de sucesso/erro apareceu
 */
export async function waitForToast(
    page: Page,
    type: 'success' | 'error' = 'success',
    timeout = 5000
) {
    const toastSelectors = [
        `.toast-${type}`,
        `.toast.${type}`,
        `[data-toast="${type}"]`,
        type === 'success' ? '.bg-green-500' : '.bg-red-500',
    ];

    for (const selector of toastSelectors) {
        try {
            await page.waitForSelector(selector, {
                state: 'visible',
                timeout: timeout / toastSelectors.length,
            });
            return true;
        } catch {
            continue;
        }
    }

    return false;
}
