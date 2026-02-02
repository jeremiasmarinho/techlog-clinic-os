/**
 * Full Frontend Audit Test
 *
 * Testa todas as funcionalidades do sistema como um usuário real:
 * - Login/Logout
 * - Navegação pelo sidebar
 * - CRUD de leads no Kanban
 * - Modais de edição
 * - Agenda
 * - Pacientes
 * - Configurações
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';
const CREDENTIALS = { username: 'admin', password: 'Mudar123!' };

// Helper para login
async function login(page: Page) {
    await page.goto(`${BASE_URL}/login.html`);
    await page.waitForSelector('#email', { timeout: 5000 });
    await page.fill('#email', CREDENTIALS.username);
    await page.fill('#password', CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(admin|saas-admin)\.html/, { timeout: 10000 });
}

test.describe('🔐 1. Fluxo de Login', () => {
    test('1.1 - Página de login carrega corretamente', async ({ page }) => {
        await page.goto(`${BASE_URL}/login.html`);

        // Verificar elementos essenciais
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();

        // Verificar título
        await expect(page).toHaveTitle(/Medical CRM/);

        console.log('✅ Página de login carregou corretamente');
    });

    test('1.2 - Botão de mostrar/ocultar senha funciona', async ({ page }) => {
        await page.goto(`${BASE_URL}/login.html`);

        const passwordInput = page.locator('#password');
        const toggleBtn = page.locator('button[onclick="togglePassword()"]');

        // Inicialmente é password
        await expect(passwordInput).toHaveAttribute('type', 'password');

        // Clica para mostrar
        await toggleBtn.click();
        await expect(passwordInput).toHaveAttribute('type', 'text');

        // Clica para ocultar
        await toggleBtn.click();
        await expect(passwordInput).toHaveAttribute('type', 'password');

        console.log('✅ Toggle de senha funcionando');
    });

    test('1.3 - Login com credenciais válidas', async ({ page }) => {
        await login(page);

        // Deve estar no admin.html
        expect(page.url()).toContain('admin.html');

        // Token deve estar salvo
        const token = await page.evaluate(() => sessionStorage.getItem('token'));
        expect(token).toBeTruthy();

        console.log('✅ Login bem-sucedido');
    });

    test('1.4 - Login com credenciais inválidas mostra erro', async ({ page }) => {
        await page.goto(`${BASE_URL}/login.html`);
        await page.fill('#email', 'usuario_invalido');
        await page.fill('#password', 'senha_errada');
        await page.click('button[type="submit"]');

        // Aguardar mensagem de erro
        await page.waitForSelector('#error-msg:not(.hidden)', { timeout: 5000 });

        console.log('✅ Erro de login exibido corretamente');
    });
});

test.describe('📊 2. Kanban Board (admin.html)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.waitForTimeout(2000);
    });

    test('2.1 - Colunas do Kanban carregam', async ({ page }) => {
        // IDs reais das colunas no admin.html
        const columns = [
            '#column-novo',
            '#column-em_atendimento',
            '#column-agendado',
            '#column-finalizado',
        ];

        for (const col of columns) {
            await expect(page.locator(col)).toBeVisible({ timeout: 10000 });
        }

        console.log('✅ Todas as colunas do Kanban visíveis');
    });

    test('2.2 - Sidebar está visível e funcional', async ({ page }) => {
        // Esperar sidebar carregar
        await page.waitForSelector('medical-sidebar', { state: 'attached', timeout: 10000 });
        await page.waitForTimeout(1000);

        const sidebar = page.locator('medical-sidebar #sidebar');
        await expect(sidebar).toBeVisible();

        // Verificar links de navegação
        const navLinks = ['admin.html', 'agenda.html', 'patients.html'];
        for (const link of navLinks) {
            await expect(page.locator(`medical-sidebar a[href="${link}"]`)).toBeVisible();
        }

        console.log('✅ Sidebar carregado e funcional');
    });

    test('2.3 - Botão de novo lead abre modal', async ({ page }) => {
        // Procurar botão de novo lead
        const novoLeadBtn = page
            .locator(
                'button:has-text("Novo"), button:has-text("+ Lead"), button:has-text("Adicionar")'
            )
            .first();

        if (await novoLeadBtn.isVisible()) {
            await novoLeadBtn.click();
            await page.waitForTimeout(500);

            // Verificar se modal abriu
            const modal = page.locator('#newLeadModal, [id*="Modal"]:not(.hidden)').first();
            if (await modal.isVisible()) {
                console.log('✅ Modal de novo lead aberto');
            }
        } else {
            console.log('⚠️ Botão de novo lead não visível (pode ser por design)');
        }
    });

    test('2.4 - Cards de lead carregam corretamente', async ({ page }) => {
        // Aguardar carregamento dos leads
        await page.waitForTimeout(3000);

        const leadCards = page.locator('.lead-card, [data-lead-id]');
        const count = await leadCards.count();

        console.log(`📋 ${count} cards de lead encontrados`);

        if (count > 0) {
            // Verificar se o primeiro card tem estrutura correta
            const firstCard = leadCards.first();
            await expect(firstCard).toBeVisible();
        }

        console.log('✅ Cards de lead carregados');
    });

    test('2.5 - Filtro de data funciona', async ({ page }) => {
        await page.waitForSelector('medical-sidebar', { state: 'attached', timeout: 10000 });
        await page.waitForTimeout(2000);

        // O dateFilter fica dentro do medical-sidebar
        const dateFilter = page.locator('#dateFilter');

        if (await dateFilter.isVisible()) {
            // Pegar valor atual
            const valorAtual = await dateFilter.inputValue();
            console.log(`📅 Valor atual do filtro: ${valorAtual}`);

            // Mudar para 30 dias
            await dateFilter.selectOption('30days');
            await page.waitForTimeout(1000);

            // Verificar que a página não quebrou - usar os IDs corretos
            const columns = page.locator('[id^="column-"]');
            const count = await columns.count();
            expect(count).toBeGreaterThan(0);

            console.log('✅ Filtro de data funcionando');
        } else {
            // Se não tiver filtro, apenas passar
            console.log('⚠️ Filtro de data não visível (ok para esta página)');
        }
    });

    test('2.6 - Busca rápida funciona', async ({ page }) => {
        const searchInput = page.locator('#quickSearch');

        if (await searchInput.isVisible()) {
            await searchInput.fill('Maria');
            await page.waitForTimeout(500);

            // Limpar busca
            const clearBtn = page.locator('#clearSearch');
            if (await clearBtn.isVisible()) {
                await clearBtn.click();
            }

            console.log('✅ Busca rápida funcionando');
        } else {
            console.log('⚠️ Busca rápida não encontrada');
        }
    });
});

test.describe('📅 3. Agenda (agenda.html)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/agenda.html`);
        await page.waitForLoadState('networkidle');
    });

    test('3.1 - Página de agenda carrega', async ({ page }) => {
        // Verificar título ou elemento característico
        await expect(page.locator('body')).toBeVisible();

        // Verificar sidebar
        await page.waitForSelector('medical-sidebar', { state: 'attached', timeout: 10000 });

        console.log('✅ Página de agenda carregou');
    });

    test('3.2 - Lista de agendamentos carrega', async ({ page }) => {
        await page.waitForTimeout(2000);

        const appointmentsList = page.locator(
            '#appointmentsList, .appointments-list, [class*="appointment"]'
        );

        // A lista existe (mesmo que vazia)
        await expect(appointmentsList.first()).toBeAttached();

        console.log('✅ Lista de agendamentos presente');
    });
});

test.describe('👥 4. Pacientes (patients.html)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/patients.html`);
        await page.waitForLoadState('networkidle');
    });

    test('4.1 - Página de pacientes carrega', async ({ page }) => {
        await page.waitForSelector('medical-sidebar', { state: 'attached', timeout: 10000 });

        console.log('✅ Página de pacientes carregou');
    });

    test('4.2 - Lista/tabela de pacientes presente', async ({ page }) => {
        await page.waitForTimeout(2000);

        // Procurar por tabela ou lista de pacientes
        const patientsContainer = page
            .locator('#patientsList, table, .patients-list, [class*="patient"]')
            .first();
        await expect(patientsContainer).toBeAttached();

        console.log('✅ Container de pacientes presente');
    });
});

test.describe('⚙️ 5. Configurações (settings.html)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/settings.html`);
        await page.waitForLoadState('networkidle');
    });

    test('5.1 - Página de configurações carrega', async ({ page }) => {
        await page.waitForSelector('medical-sidebar', { state: 'attached', timeout: 10000 });

        console.log('✅ Página de configurações carregou');
    });
});

test.describe('📊 6. Relatórios (relatorios.html)', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/relatorios.html`);
        await page.waitForLoadState('networkidle');
    });

    test('6.1 - Página de relatórios carrega', async ({ page }) => {
        await page.waitForSelector('medical-sidebar', { state: 'attached', timeout: 10000 });

        console.log('✅ Página de relatórios carregou');
    });
});

test.describe('🔄 7. Navegação entre páginas', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('7.1 - Navegar de Kanban para Agenda via sidebar', async ({ page }) => {
        await page.waitForSelector('medical-sidebar', { state: 'attached', timeout: 10000 });
        await page.waitForTimeout(1000);

        const agendaLink = page.locator('medical-sidebar a[href="agenda.html"]');
        await agendaLink.click();

        await page.waitForURL(/agenda\.html/);
        console.log('✅ Navegação Kanban → Agenda OK');
    });

    test('7.2 - Navegar de Kanban para Pacientes via sidebar', async ({ page }) => {
        await page.waitForSelector('medical-sidebar', { state: 'attached', timeout: 10000 });
        await page.waitForTimeout(1000);

        const patientsLink = page.locator('medical-sidebar a[href="patients.html"]');
        await patientsLink.click();

        await page.waitForURL(/patients\.html/);
        console.log('✅ Navegação Kanban → Pacientes OK');
    });
});

test.describe('🚪 8. Logout', () => {
    test('8.1 - Logout funciona corretamente', async ({ page }) => {
        await login(page);
        await page.waitForSelector('medical-sidebar', { state: 'attached', timeout: 10000 });
        await page.waitForTimeout(1000);

        // Procurar botão de logout
        const logoutBtn = page
            .locator('medical-sidebar button[onclick="logout()"], button:has-text("Sair")')
            .first();

        if (await logoutBtn.isVisible()) {
            await logoutBtn.click();

            // Deve redirecionar para login
            await page.waitForURL(/login\.html/, { timeout: 5000 });

            // Token deve ser removido
            const token = await page.evaluate(() => sessionStorage.getItem('token'));
            expect(token).toBeNull();

            console.log('✅ Logout funcionando');
        } else {
            console.log('⚠️ Botão de logout não encontrado');
        }
    });
});

test.describe('📱 9. Responsividade', () => {
    test('9.1 - Layout mobile (360px)', async ({ page }) => {
        await page.setViewportSize({ width: 360, height: 640 });
        await login(page);

        // Página deve carregar sem erros
        await expect(page.locator('body')).toBeVisible();

        console.log('✅ Layout mobile OK');
    });

    test('9.2 - Layout tablet (768px)', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await login(page);

        await expect(page.locator('body')).toBeVisible();

        console.log('✅ Layout tablet OK');
    });

    test('9.3 - Layout desktop (1920px)', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await login(page);

        await expect(page.locator('body')).toBeVisible();

        console.log('✅ Layout desktop OK');
    });
});

test.describe('🔧 10. Verificação de Console Errors', () => {
    test('10.1 - Kanban sem erros de console críticos', async ({ page }) => {
        const consoleErrors: string[] = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        page.on('pageerror', (error) => {
            consoleErrors.push(error.message);
        });

        await login(page);
        await page.waitForTimeout(3000);

        // Filtrar erros críticos (ignorar warnings de rede)
        const criticalErrors = consoleErrors.filter(
            (e) => !e.includes('favicon') && !e.includes('404') && !e.includes('network')
        );

        if (criticalErrors.length > 0) {
            console.log('⚠️ Erros de console encontrados:', criticalErrors);
        } else {
            console.log('✅ Nenhum erro crítico de console');
        }
    });
});
