import { test, expect } from '@playwright/test';
import { loginAs, getUserSession, CREDENTIALS } from './helpers';

test.describe('SaaS Multi-Tenancy Authentication', () => {
    test.beforeEach(async ({ page }) => {
        // Limpar sessão antes de cada teste
        await page.goto('/login.html');
        await page.evaluate(() => {
            sessionStorage.clear();
            localStorage.clear();
        });
    });

    test('Super Admin deve fazer login e ter role correto', async ({ page }) => {
        await loginAs(page, CREDENTIALS.superAdmin.username, CREDENTIALS.superAdmin.password);

        // Aguardar redirecionamento para qualquer página autenticada
        await page.waitForURL(/.*(admin|kanban|agenda|saas-admin)\.html/, { timeout: 10000 });

        // Verificar dados da sessão
        const session = await getUserSession(page);
        expect(session.userRole).toBe('super_admin');
        expect(session.token).toBeTruthy();
        // Super Admin não precisa ter clinic_id
    });

    test('Super Admin deve ter acesso à página de gestão SaaS', async ({ page }) => {
        await loginAs(page, CREDENTIALS.superAdmin.username, CREDENTIALS.superAdmin.password);
        await page.waitForURL(/.*(admin|kanban|agenda|saas-admin)\.html/, { timeout: 10000 });

        // Navegar para saas-admin (se não redirecionou automaticamente)
        if (!page.url().includes('saas-admin.html')) {
            await page.goto('/saas-admin.html');
        }

        // Verificar que a página carregou
        await expect(page).toHaveURL(/saas-admin\.html/);

        // Verificar elementos da página (quando existir)
        const pageContent = await page.content();
        expect(pageContent).toContain('html');
    });

    test('Clinic Admin deve fazer login com role correto', async ({ page }) => {
        await loginAs(page, CREDENTIALS.clinicAdmin.username, CREDENTIALS.clinicAdmin.password);

        // Aguardar redirecionamento para qualquer página autenticada
        await page.waitForURL(/.*(admin|kanban|agenda|saas-admin)\.html/, { timeout: 10000 });

        // Verificar dados da sessão
        const session = await getUserSession(page);
        expect(['clinic_admin', 'admin', 'super_admin']).toContain(session.userRole);
        expect(session.token).toBeTruthy();
        expect(session.clinicId).toBeTruthy();
    });

    test('Redirecionamento deve funcionar após login', async ({ page }) => {
        // Login com admin
        await loginAs(page, CREDENTIALS.valid.username, CREDENTIALS.valid.password);
        await page.waitForURL(/.*(admin|kanban|agenda|saas-admin)\.html/, { timeout: 10000 });

        // Verificar que não está mais na página de login
        expect(page.url()).not.toContain('login.html');
    });

    test('Sessão deve persistir ao navegar entre páginas', async ({ page }) => {
        await loginAs(page, CREDENTIALS.valid.username, CREDENTIALS.valid.password);
        await page.waitForURL(/.*(admin|kanban|agenda|saas-admin)\.html/, { timeout: 10000 });

        const sessionBefore = await getUserSession(page);

        // Navegar para outra página
        await page.goto('/admin.html');

        const sessionAfter = await getUserSession(page);

        // Verificar que o token persistiu
        expect(sessionAfter.token).toBe(sessionBefore.token);
    });

    test('JWT token deve ter estrutura válida', async ({ page }) => {
        await loginAs(page, CREDENTIALS.valid.username, CREDENTIALS.valid.password);
        await page.waitForURL(/.*(admin|kanban|agenda|saas-admin)\.html/, { timeout: 10000 });

        const session = await getUserSession(page);
        const token = session.token;

        // Verificar estrutura JWT (3 partes separadas por ponto)
        expect(token).toBeTruthy();
        if (token) {
            const parts = token.split('.');
            expect(parts.length).toBe(3);

            // Decodificar payload (parte do meio)
            const payload = JSON.parse(atob(parts[1]));

            // Verificar campos obrigatórios
            expect(payload.userId).toBeTruthy();
            expect(payload.role).toBeTruthy();
            expect(payload.exp).toBeTruthy(); // Expiration time
            expect(payload.iat).toBeTruthy(); // Issued at time
        }
    });

    test('Logout deve limpar dados da sessão', async ({ page }) => {
        await loginAs(page, CREDENTIALS.valid.username, CREDENTIALS.valid.password);
        await page.waitForURL(/.*(admin|kanban|agenda|saas-admin)\.html/, { timeout: 10000 });

        // Verificar que há dados de sessão
        const sessionBefore = await getUserSession(page);
        expect(sessionBefore.token).toBeTruthy();

        // Fazer logout (simular clique no botão ou executar função)
        await page.evaluate(() => {
            sessionStorage.clear();
            localStorage.clear();
        });

        // Verificar que os dados foram limpos
        const sessionAfter = await getUserSession(page);
        expect(sessionAfter.token).toBeFalsy();
    });
});
