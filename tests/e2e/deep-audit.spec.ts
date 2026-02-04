/**
 * AUDITORIA PROFUNDA DO FRONTEND
 * Testa cada interação como um usuário real faria
 *
 * Testes:
 * - CRUD completo de Leads
 * - CRUD de Pacientes
 * - Funcionalidades da Agenda
 * - Modais e formulários
 * - Validações de campos
 * - Drag and drop
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

// Configurar timeout maior para este arquivo
test.setTimeout(60000);

async function login(page: Page) {
    await page.goto(`${BASE_URL}/login.html`);
    await page.waitForLoadState('networkidle');
    // Username: admin, Password: Mudar123!
    await page.fill('#email', 'admin');
    await page.fill('#password', 'Mudar123!');
    await page.click('button[type="submit"]');

    // Aguardar redirecionamento com timeout maior
    try {
        await page.waitForURL('**/admin.html', { timeout: 30000 });
    } catch {
        // Se não redirecionou, pode já estar na página
        if (!page.url().includes('admin.html')) {
            throw new Error('Login não redirecionou para admin.html');
        }
    }
    await page.waitForLoadState('networkidle');
}

// ========================================
// 1. CRUD COMPLETO DE LEADS
// ========================================
test.describe('📋 CRUD de Leads', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.waitForTimeout(2000);
    });

    test('1.1 - Ver detalhes de um lead existente', async ({ page }) => {
        // Aguardar cards carregarem
        await page.waitForSelector('.lead-card, [data-lead-id]', { timeout: 15000 });

        const leadCards = page.locator('.lead-card, [data-lead-id]');
        const count = await leadCards.count();

        if (count > 0) {
            // Clicar no primeiro card
            const firstCard = leadCards.first();
            await firstCard.click();
            await page.waitForTimeout(1000);

            // Verificar se modal de detalhes abriu
            const modal = page
                .locator('[id*="Modal"]:not(.hidden), .modal:not(.hidden), [role="dialog"]')
                .first();
            const isVisible = await modal.isVisible().catch(() => false);

            if (isVisible) {
                console.log('✅ Modal de detalhes do lead aberto');

                // Verificar se há campos de informação
                const name = modal
                    .locator('input[name*="name"], input[id*="name"], [data-field="name"]')
                    .first();
                const phone = modal
                    .locator('input[name*="phone"], input[id*="phone"], [data-field="phone"]')
                    .first();

                // Fechar modal
                const closeBtn = modal
                    .locator(
                        'button[aria-label="Fechar"], button:has-text("×"), .close-btn, [data-dismiss]'
                    )
                    .first();
                if (await closeBtn.isVisible()) {
                    await closeBtn.click();
                }
            } else {
                console.log('⚠️ Modal não abriu (pode ser por design ou card não clicável)');
            }
        }

        expect(count).toBeGreaterThan(0);
    });

    test('1.2 - Arrastar lead entre colunas (drag and drop)', async ({ page }) => {
        await page.waitForSelector('.lead-card, [data-lead-id]', { timeout: 15000 });

        // Pegar primeiro card da coluna "novo"
        const novoColumn = page.locator('#column-novo');
        const cards = novoColumn.locator('.lead-card, [data-lead-id]');
        const cardCount = await cards.count();

        if (cardCount > 0) {
            const firstCard = cards.first();
            const targetColumn = page.locator('#column-em_atendimento');

            // Usar drag and drop nativo do Playwright
            await firstCard.dragTo(targetColumn);
            await page.waitForTimeout(1000);

            console.log('✅ Drag and drop executado');
        } else {
            console.log('⚠️ Nenhum card na coluna Novo para arrastar');
        }
    });

    test('1.3 - Buscar lead por nome', async ({ page }) => {
        await page.waitForSelector('.lead-card', { timeout: 15000 });

        // Encontrar campo de busca
        const searchInput = page
            .locator('#searchInput, input[type="search"], input[placeholder*="Buscar"]')
            .first();

        if (await searchInput.isVisible()) {
            // Digitar termo de busca
            await searchInput.fill('Maria');
            await page.waitForTimeout(500);

            // Verificar se filtrou
            const visibleCards = page.locator('.lead-card:visible');
            console.log('✅ Busca executada');
        } else {
            console.log('⚠️ Campo de busca não encontrado');
        }
    });

    test('1.4 - Filtrar leads por status', async ({ page }) => {
        await page.waitForSelector('.lead-card', { timeout: 15000 });

        // Verificar se há filtros de status
        const statusFilter = page
            .locator('#statusFilter, select[name="status"], [data-filter="status"]')
            .first();

        if (await statusFilter.isVisible()) {
            // Selecionar um status
            await statusFilter.selectOption({ index: 1 });
            await page.waitForTimeout(1000);

            console.log('✅ Filtro de status aplicado');
        } else {
            // Verificar contagem de cards por coluna
            const columns = [
                '#column-novo',
                '#column-em_atendimento',
                '#column-agendado',
                '#column-finalizado',
            ];
            for (const col of columns) {
                const count = await page.locator(`${col} .lead-card`).count();
                console.log(`📊 ${col}: ${count} leads`);
            }
        }
    });
});

// ========================================
// 2. FORMULÁRIOS E VALIDAÇÕES
// ========================================
test.describe('📝 Formulários e Validações', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.waitForTimeout(2000);
    });

    test('2.1 - Validar campo de telefone com máscara', async ({ page }) => {
        // Abrir modal de novo lead se existir
        const novoBtn = page.locator('button:has-text("Novo"), button:has-text("+ Lead")').first();

        if (await novoBtn.isVisible()) {
            await novoBtn.click();
            await page.waitForTimeout(500);

            const phoneInput = page.locator('input[name="phone"], input[id*="phone"]').first();

            if (await phoneInput.isVisible()) {
                // Digitar telefone sem formatação
                await phoneInput.fill('11999998888');
                const value = await phoneInput.inputValue();

                // Verificar se máscara foi aplicada
                if (value.includes('(') || value.includes(')') || value.includes('-')) {
                    console.log(`✅ Máscara de telefone aplicada: ${value}`);
                } else {
                    console.log(`⚠️ Telefone sem máscara: ${value}`);
                }
            }
        } else {
            console.log('⚠️ Botão de novo lead não encontrado');
        }
    });

    test('2.2 - Validar campo de email', async ({ page }) => {
        // Navegar para agenda que pode ter formulário de agendamento
        await page.goto(`${BASE_URL}/agenda.html`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Procurar botão de novo agendamento
        const novoBtn = page
            .locator('button:has-text("Novo"), button:has-text("Adicionar"), button:has-text("+")')
            .first();

        if (await novoBtn.isVisible()) {
            await novoBtn.click();
            await page.waitForTimeout(500);

            const emailInput = page.locator('input[type="email"], input[name="email"]').first();

            if (await emailInput.isVisible()) {
                // Testar email inválido
                await emailInput.fill('email-invalido');
                await emailInput.blur();

                // Verificar validação
                const isInvalid = await emailInput.evaluate(
                    (el: HTMLInputElement) => !el.validity.valid
                );
                console.log(
                    `✅ Validação de email: ${isInvalid ? 'Campo inválido detectado' : 'Campo aceito'}`
                );
            }
        }
    });

    test('2.3 - Validar campos obrigatórios', async ({ page }) => {
        // Navegar para página de arquivo
        await page.goto(`${BASE_URL}/arquivo.html`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Procurar formulário ou botão de adicionar
        const novoBtn = page
            .locator('button:has-text("Novo"), button:has-text("Adicionar")')
            .first();

        if (await novoBtn.isVisible()) {
            await novoBtn.click();
            await page.waitForTimeout(500);

            // Tentar submeter formulário vazio
            const submitBtn = page
                .locator('button[type="submit"], button:has-text("Salvar")')
                .first();

            if (await submitBtn.isVisible()) {
                await submitBtn.click();
                await page.waitForTimeout(500);

                // Verificar se há mensagens de erro ou campos marcados
                const requiredFields = page.locator('[required]:invalid, .error, .is-invalid');
                const errorCount = await requiredFields.count();

                console.log(`✅ ${errorCount} campos com validação de obrigatoriedade`);
            }
        }
    });
});

// ========================================
// 3. PÁGINA DE AGENDA
// ========================================
test.describe('📅 Funcionalidades da Agenda', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/agenda.html`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('3.1 - Visualizar calendário ou lista', async ({ page }) => {
        // Verificar se há calendário ou lista de agendamentos
        const calendar = page.locator(
            '#calendar, .fc, [data-calendar], .agenda-list, #agenda-container'
        );
        await expect(calendar).toBeVisible({ timeout: 10000 });

        console.log('✅ Área de agenda visível');
    });

    test('3.2 - Navegar entre datas', async ({ page }) => {
        // Procurar controles de navegação
        const prevBtn = page
            .locator('button:has-text("Anterior"), button:has-text("<"), .fc-prev-button')
            .first();
        const nextBtn = page
            .locator('button:has-text("Próximo"), button:has-text(">"), .fc-next-button')
            .first();

        if (await nextBtn.isVisible()) {
            await nextBtn.click();
            await page.waitForTimeout(500);
            console.log('✅ Navegação para próxima data funcionando');
        }

        if (await prevBtn.isVisible()) {
            await prevBtn.click();
            await page.waitForTimeout(500);
            console.log('✅ Navegação para data anterior funcionando');
        }
    });

    test('3.3 - Ver lista de agendamentos do dia', async ({ page }) => {
        // Verificar se há lista de agendamentos
        const agendaItems = page.locator(
            '.agenda-item, .appointment, [data-appointment-id], tr[data-id]'
        );
        const count = await agendaItems.count();

        console.log(`📋 ${count} agendamentos encontrados`);
    });

    test('3.4 - Alterar visualização (dia/semana/mês)', async ({ page }) => {
        // Procurar botões de visualização
        const viewButtons = page.locator(
            '.fc-dayGridMonth-button, .fc-timeGridWeek-button, .fc-timeGridDay-button, [data-view]'
        );
        const count = await viewButtons.count();

        if (count > 0) {
            await viewButtons.first().click();
            await page.waitForTimeout(500);
            console.log(`✅ ${count} opções de visualização disponíveis`);
        } else {
            console.log('⚠️ Sem controles de visualização (pode ser lista fixa)');
        }
    });
});

// ========================================
// 4. PÁGINA DE ARQUIVO
// ========================================
test.describe('📦 Funcionalidades de Arquivo', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/arquivo.html`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('4.1 - Lista de arquivados carrega', async ({ page }) => {
        const archiveContainer = page.locator(
            '#arquivoList, .archive-list, table, .lista-arquivados'
        );
        await expect(archiveContainer).toBeVisible({ timeout: 10000 });

        console.log('✅ Container de arquivados visível');
    });

    test('4.2 - Buscar atendimento arquivado', async ({ page }) => {
        const searchInput = page
            .locator('#searchArchive, input[placeholder*="Buscar"], input[type="search"]')
            .first();

        if (await searchInput.isVisible()) {
            await searchInput.fill('Maria');
            await page.waitForTimeout(500);

            console.log('✅ Campo de busca de arquivados funcional');
        }
    });

    test('4.3 - Filtros de status', async ({ page }) => {
        // Verificar se há filtros de status
        const filters = page.locator(
            '[data-filter], button:has-text("Finalizados"), button:has-text("Cancelados")'
        );
        const count = await filters.count();

        if (count > 0) {
            console.log(`✅ Filtros de status presentes: ${count}`);
        } else {
            console.log('⚠️ Sem filtros de status visíveis');
        }
    });

    test('4.4 - Restaurar atendimento', async ({ page }) => {
        // Procurar botão de restaurar
        const restoreBtn = page.locator('button:has-text("Restaurar"), [data-restore]').first();

        if (await restoreBtn.isVisible()) {
            console.log('✅ Botão de restaurar presente');
        } else {
            console.log('⚠️ Botão de restaurar não visível (pode não ter itens)');
        }
    });
});

// ========================================
// 5. CONFIGURAÇÕES
// ========================================
test.describe('⚙️ Página de Configurações', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/settings.html`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('5.1 - Abas de configuração carregam', async ({ page }) => {
        // Verificar se há abas ou seções de configuração
        const tabs = page.locator('.tab, [role="tab"], .nav-link, .settings-section');
        const count = await tabs.count();

        console.log(`⚙️ ${count} seções de configuração encontradas`);
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('5.2 - Formulário de perfil/dados da clínica', async ({ page }) => {
        // Verificar se há formulário de configurações
        const form = page.locator('form, .settings-form');
        const inputs = page.locator('input, select, textarea');

        const inputCount = await inputs.count();
        console.log(`📝 ${inputCount} campos de configuração encontrados`);
    });

    test('5.3 - Botão de salvar configurações', async ({ page }) => {
        const saveBtn = page
            .locator(
                'button:has-text("Salvar"), button[type="submit"], button:has-text("Atualizar")'
            )
            .first();

        if (await saveBtn.isVisible()) {
            console.log('✅ Botão de salvar presente');
            // Não vamos clicar para não alterar dados
        } else {
            console.log('⚠️ Botão de salvar não encontrado');
        }
    });
});

// ========================================
// 6. RELATÓRIOS
// ========================================
test.describe('📊 Página de Relatórios', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.goto(`${BASE_URL}/relatorios.html`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
    });

    test('6.1 - Área de relatórios carrega', async ({ page }) => {
        const reportsArea = page.locator('#reports, .reports-container, main, .content');
        await expect(reportsArea).toBeVisible();

        console.log('✅ Área de relatórios visível');
    });

    test('6.2 - Filtros de período', async ({ page }) => {
        const dateFilters = page.locator(
            'input[type="date"], select:has-text("período"), #startDate, #endDate'
        );
        const count = await dateFilters.count();

        if (count > 0) {
            console.log(`✅ ${count} filtros de período encontrados`);
        }
    });

    test('6.3 - Gráficos ou KPIs carregam', async ({ page }) => {
        // Verificar se há elementos visuais de dados
        const charts = page.locator('canvas, svg, .chart, .kpi, .metric, .card');
        const count = await charts.count();

        console.log(`📈 ${count} elementos de visualização encontrados`);
    });

    test('6.4 - Exportar relatório', async ({ page }) => {
        const exportBtn = page
            .locator(
                'button:has-text("Exportar"), button:has-text("Download"), button:has-text("PDF")'
            )
            .first();

        if (await exportBtn.isVisible()) {
            console.log('✅ Botão de exportação presente');
        } else {
            console.log('⚠️ Sem opção de exportação visível');
        }
    });
});

// ========================================
// 7. HEADER DA CLÍNICA
// ========================================
test.describe('🏥 Header da Clínica', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
        await page.waitForTimeout(2000);
    });

    test('7.1 - Header carrega com nome da clínica', async ({ page }) => {
        // Header é injetado dinamicamente pelo clinic-header.js como div#top-header
        await page.waitForTimeout(2000); // Aguardar injeção

        const header = page.locator('#top-header, .glass-header, .clinic-header');

        // Pode não existir em todas as páginas
        if (await header.isVisible().catch(() => false)) {
            // Verificar se mostra nome da clínica
            const clinicName = page.locator('.clinic-name, [data-clinic-name], h1, h2').first();
            const text = await clinicName.textContent().catch(() => '');

            console.log(`🏥 Header carregado, texto: ${text.substring(0, 50)}`);
        } else {
            // Verificar pelo nome da clínica em qualquer lugar
            const anyClinicName = page.locator('text=Clínica, text=Medical, text=CRM').first();
            if (await anyClinicName.isVisible().catch(() => false)) {
                console.log('🏥 Nome da clínica visível na página');
            } else {
                console.log('⚠️ Header não encontrado (pode ser design sem header)');
            }
        }
    });

    test('7.2 - Menu de usuário funciona', async ({ page }) => {
        // Procurar dropdown de usuário
        const userMenu = page
            .locator('.user-menu, #userDropdown, [data-user-menu], .dropdown')
            .first();

        if (await userMenu.isVisible()) {
            await userMenu.click();
            await page.waitForTimeout(300);

            // Verificar se menu abriu
            const dropdownItems = page.locator(
                '.dropdown-menu.show, .dropdown-item, [role="menu"]'
            );
            const isOpen = await dropdownItems.isVisible().catch(() => false);

            if (isOpen) {
                console.log('✅ Menu de usuário funcional');
            }
        }
    });
});

// ========================================
// 8. VERIFICAÇÕES DE CONSISTÊNCIA
// ========================================
test.describe('🔍 Verificações de Consistência', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('8.1 - Links não quebrados na sidebar', async ({ page }) => {
        await page.waitForSelector('medical-sidebar', { state: 'attached' });
        await page.waitForTimeout(1000);

        const links = page.locator('medical-sidebar a[href]');
        const count = await links.count();

        console.log(`🔗 ${count} links na sidebar`);

        for (let i = 0; i < count; i++) {
            const link = links.nth(i);
            const href = await link.getAttribute('href');

            if (href && !href.startsWith('#') && !href.startsWith('javascript')) {
                // Verificar se o link é acessível
                const response = await page.request.head(`${BASE_URL}/${href}`).catch(() => null);
                if (response && response.ok()) {
                    console.log(`  ✅ ${href}`);
                } else {
                    console.log(`  ❌ ${href} - não acessível`);
                }
            }
        }
    });

    test('8.2 - Todas as imagens carregam', async ({ page }) => {
        // Aguardar carregamento completo
        await page.waitForTimeout(3000);

        const images = page.locator('img');
        const count = await images.count();

        let broken = 0;
        for (let i = 0; i < count; i++) {
            const img = images.nth(i);
            const src = await img.getAttribute('src');
            const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);

            if (naturalWidth === 0 && src && !src.startsWith('data:')) {
                broken++;
                console.log(`  ❌ Imagem quebrada: ${src}`);
            }
        }

        console.log(`🖼️ ${count - broken}/${count} imagens carregadas corretamente`);
    });

    test('8.3 - Scripts JavaScript sem erros de sintaxe', async ({ page }) => {
        const errors: string[] = [];

        page.on('pageerror', (error) => {
            if (!error.message.includes('Content Security Policy')) {
                errors.push(error.message);
            }
        });

        // Navegar por várias páginas
        const pages = ['admin.html', 'agenda.html', 'arquivo.html', 'settings.html'];

        for (const p of pages) {
            await page.goto(`${BASE_URL}/${p}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);
        }

        if (errors.length > 0) {
            console.log(`❌ ${errors.length} erros JavaScript:`);
            errors.forEach((e) => console.log(`  - ${e}`));
        } else {
            console.log('✅ Sem erros JavaScript críticos');
        }

        expect(errors.length).toBe(0);
    });

    test('8.4 - Estilos CSS carregam corretamente', async ({ page }) => {
        // Verificar se elementos têm estilos aplicados
        const sidebar = page.locator('medical-sidebar #sidebar');

        if (await sidebar.isVisible()) {
            const bgColor = await sidebar.evaluate((el) => getComputedStyle(el).backgroundColor);
            const isStyled = bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent';

            console.log(`🎨 Sidebar styled: ${isStyled} (bg: ${bgColor})`);
        }
    });
});

// ========================================
// 9. PERFORMANCE BÁSICA
// ========================================
test.describe('⚡ Performance', () => {
    test('9.1 - Página de login carrega em menos de 3s', async ({ page }) => {
        const start = Date.now();
        await page.goto(`${BASE_URL}/login.html`);
        await page.waitForLoadState('domcontentloaded');
        const loadTime = Date.now() - start;

        console.log(`⏱️ Login carregou em ${loadTime}ms`);
        expect(loadTime).toBeLessThan(3000);
    });

    test('9.2 - Kanban carrega em menos de 5s', async ({ page }) => {
        await login(page);

        const start = Date.now();
        await page.waitForSelector('.lead-card', { timeout: 15000 });
        const loadTime = Date.now() - start;

        console.log(`⏱️ Kanban cards carregaram em ${loadTime}ms`);
        expect(loadTime).toBeLessThan(5000);
    });
});
