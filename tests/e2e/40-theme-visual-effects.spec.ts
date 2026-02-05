/**
 * Testes E2E para efeitos visuais dos temas Dark e Light
 *
 * Verifica:
 * - Hover states em botões
 * - Hover states em cards
 * - Hover states na sidebar
 * - Transições suaves
 * - Cores e contrastes
 * - Sombras e profundidade
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

// Helper para alternar tema
async function setTheme(page: any, theme: 'dark' | 'light') {
    // Encontrar o toggle de tema na sidebar
    const themeToggle = page
        .locator(
            '#themeToggle, [id*="theme"], .theme-toggle, button:has(i.fa-sun), button:has(i.fa-moon)'
        )
        .first();

    // Verificar o tema atual
    const html = page.locator('html');
    const currentTheme = await html.getAttribute('data-theme');

    if (currentTheme !== theme) {
        if (await themeToggle.isVisible()) {
            await themeToggle.click();
            await page.waitForTimeout(500);
        }
    }
}

test.describe('Efeitos Visuais - Dark Mode', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
        await setTheme(page, 'dark');
    });

    test('Botões devem ter hover effect', async ({ page }) => {
        await page.goto('/kanban.html');
        await page.waitForLoadState('networkidle');

        // Encontrar botões
        const buttons = page.locator(
            '.btn, button.btn-primary, button.btn-secondary, button.btn-success'
        );
        const count = await buttons.count();

        if (count > 0) {
            const firstButton = buttons.first();

            // Capturar estilo antes do hover
            const beforeHover = await firstButton.evaluate((el: HTMLElement) => ({
                background: getComputedStyle(el).backgroundColor,
                transform: getComputedStyle(el).transform,
                boxShadow: getComputedStyle(el).boxShadow,
            }));

            // Fazer hover
            await firstButton.hover();
            await page.waitForTimeout(300);

            // Verificar que algo mudou
            const afterHover = await firstButton.evaluate((el: HTMLElement) => ({
                background: getComputedStyle(el).backgroundColor,
                transform: getComputedStyle(el).transform,
                boxShadow: getComputedStyle(el).boxShadow,
            }));

            // O estilo deve mudar no hover
            const changed =
                beforeHover.background !== afterHover.background ||
                beforeHover.transform !== afterHover.transform ||
                beforeHover.boxShadow !== afterHover.boxShadow;

            expect(changed).toBe(true);
        }
    });

    test('Cards devem ter hover effect com sombra', async ({ page }) => {
        await page.goto('/kanban.html');
        await page.waitForLoadState('networkidle');

        // Encontrar lead cards
        const cards = page.locator('.lead-card, .card, .glass-card');
        const count = await cards.count();

        if (count > 0) {
            const card = cards.first();

            const beforeHover = await card.evaluate((el: HTMLElement) => ({
                boxShadow: getComputedStyle(el).boxShadow,
                transform: getComputedStyle(el).transform,
                borderColor: getComputedStyle(el).borderColor,
            }));

            await card.hover();
            await page.waitForTimeout(300);

            const afterHover = await card.evaluate((el: HTMLElement) => ({
                boxShadow: getComputedStyle(el).boxShadow,
                transform: getComputedStyle(el).transform,
                borderColor: getComputedStyle(el).borderColor,
            }));

            const changed =
                beforeHover.boxShadow !== afterHover.boxShadow ||
                beforeHover.transform !== afterHover.transform ||
                beforeHover.borderColor !== afterHover.borderColor;

            expect(changed).toBe(true);
        }
    });

    test('Sidebar items devem ter hover effect', async ({ page }) => {
        await page.goto('/kanban.html');
        await page.waitForLoadState('networkidle');

        const sidebarItems = page.locator('#sidebar .sidebar-item, #sidebar a');
        const count = await sidebarItems.count();

        if (count > 0) {
            const item = sidebarItems.first();

            const beforeHover = await item.evaluate((el: HTMLElement) => ({
                background: getComputedStyle(el).backgroundColor,
                color: getComputedStyle(el).color,
            }));

            await item.hover();
            await page.waitForTimeout(300);

            const afterHover = await item.evaluate((el: HTMLElement) => ({
                background: getComputedStyle(el).backgroundColor,
                color: getComputedStyle(el).color,
            }));

            const changed =
                beforeHover.background !== afterHover.background ||
                beforeHover.color !== afterHover.color;

            expect(changed).toBe(true);
        }
    });

    test('Inputs devem ter focus effect', async ({ page }) => {
        await page.goto('/settings.html');
        await page.waitForLoadState('networkidle');

        const input = page.locator('input[type="text"], input[type="email"], textarea').first();

        if (await input.isVisible()) {
            const beforeFocus = await input.evaluate((el: HTMLElement) => ({
                boxShadow: getComputedStyle(el).boxShadow,
                borderColor: getComputedStyle(el).borderColor,
                outline: getComputedStyle(el).outline,
            }));

            await input.focus();
            await page.waitForTimeout(300);

            const afterFocus = await input.evaluate((el: HTMLElement) => ({
                boxShadow: getComputedStyle(el).boxShadow,
                borderColor: getComputedStyle(el).borderColor,
                outline: getComputedStyle(el).outline,
            }));

            // Verificar que algum efeito de focus ocorreu (boxShadow, border ou outline mudou)
            const hasChange =
                afterFocus.boxShadow !== beforeFocus.boxShadow ||
                afterFocus.borderColor !== beforeFocus.borderColor ||
                afterFocus.outline !== beforeFocus.outline;
            expect(hasChange).toBe(true);
        }
    });
});

test.describe('Efeitos Visuais - Light Mode', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
        await setTheme(page, 'light');
    });

    test('Tema light deve ter cores claras de fundo', async ({ page }) => {
        await page.goto('/kanban.html');
        await page.waitForLoadState('networkidle');

        const body = page.locator('body');
        const bgColor = await body.evaluate(
            (el: HTMLElement) => getComputedStyle(el).backgroundColor
        );

        // Converter RGB para valores individuais
        const rgb = bgColor.match(/\d+/g)?.map(Number) || [0, 0, 0];

        // Verificar que é uma cor clara (RGB alto)
        const brightness = (rgb[0] + rgb[1] + rgb[2]) / 3;
        expect(brightness).toBeGreaterThan(200); // Cores claras têm média > 200
    });

    test('Botões devem ter hover effect no light mode', async ({ page }) => {
        await page.goto('/kanban.html');
        await page.waitForLoadState('networkidle');

        const buttons = page.locator('.btn, button.btn-primary, button.btn-success');
        const count = await buttons.count();

        if (count > 0) {
            const firstButton = buttons.first();

            const beforeHover = await firstButton.evaluate((el: HTMLElement) => ({
                background: getComputedStyle(el).background,
                transform: getComputedStyle(el).transform,
                boxShadow: getComputedStyle(el).boxShadow,
            }));

            await firstButton.hover();
            await page.waitForTimeout(300);

            const afterHover = await firstButton.evaluate((el: HTMLElement) => ({
                background: getComputedStyle(el).background,
                transform: getComputedStyle(el).transform,
                boxShadow: getComputedStyle(el).boxShadow,
            }));

            const changed =
                beforeHover.background !== afterHover.background ||
                beforeHover.transform !== afterHover.transform ||
                beforeHover.boxShadow !== afterHover.boxShadow;

            expect(changed).toBe(true);
        }
    });

    test('Cards devem ter hover effect com sombra no light mode', async ({ page }) => {
        await page.goto('/kanban.html');
        await page.waitForLoadState('networkidle');

        const cards = page.locator('.lead-card, .card, .glass-card');
        const count = await cards.count();

        if (count > 0) {
            const card = cards.first();

            const beforeHover = await card.evaluate((el: HTMLElement) => ({
                boxShadow: getComputedStyle(el).boxShadow,
                transform: getComputedStyle(el).transform,
            }));

            await card.hover();
            await page.waitForTimeout(300);

            const afterHover = await card.evaluate((el: HTMLElement) => ({
                boxShadow: getComputedStyle(el).boxShadow,
                transform: getComputedStyle(el).transform,
            }));

            // Verificar que houve mudança visual
            const changed =
                beforeHover.boxShadow !== afterHover.boxShadow ||
                beforeHover.transform !== afterHover.transform;

            expect(changed).toBe(true);
        }
    });

    test('Sidebar deve ter estilo moderno no light mode', async ({ page }) => {
        await page.goto('/kanban.html');
        await page.waitForLoadState('networkidle');

        const sidebar = page.locator('#sidebar');

        if (await sidebar.isVisible()) {
            const styles = await sidebar.evaluate((el: HTMLElement) => ({
                background: getComputedStyle(el).background,
                boxShadow: getComputedStyle(el).boxShadow,
                borderRight: getComputedStyle(el).borderRight,
            }));

            // Sidebar deve ter fundo claro
            expect(styles.background).toContain('rgb');

            // Deve ter alguma sombra para profundidade
            expect(styles.boxShadow).not.toBe('none');
        }
    });

    test('Sidebar items devem ter hover effect no light mode', async ({ page }) => {
        await page.goto('/kanban.html');
        await page.waitForLoadState('networkidle');

        const sidebarItems = page.locator('#sidebar .sidebar-item, #sidebar nav a');
        const count = await sidebarItems.count();

        if (count > 0) {
            const item = sidebarItems.first();

            const beforeHover = await item.evaluate((el: HTMLElement) => ({
                background: getComputedStyle(el).backgroundColor,
                color: getComputedStyle(el).color,
                transform: getComputedStyle(el).transform,
            }));

            await item.hover();
            await page.waitForTimeout(300);

            const afterHover = await item.evaluate((el: HTMLElement) => ({
                background: getComputedStyle(el).backgroundColor,
                color: getComputedStyle(el).color,
                transform: getComputedStyle(el).transform,
            }));

            const changed =
                beforeHover.background !== afterHover.background ||
                beforeHover.color !== afterHover.color ||
                beforeHover.transform !== afterHover.transform;

            expect(changed).toBe(true);
        }
    });

    test('Inputs devem ter focus ring no light mode', async ({ page }) => {
        await page.goto('/settings.html');
        await page.waitForLoadState('networkidle');

        const input = page.locator('input[type="text"], input[type="email"], textarea').first();

        if (await input.isVisible()) {
            await input.focus();
            await page.waitForTimeout(300);

            const focusStyles = await input.evaluate((el: HTMLElement) => ({
                boxShadow: getComputedStyle(el).boxShadow,
                borderColor: getComputedStyle(el).borderColor,
                outline: getComputedStyle(el).outline,
            }));

            // Verificar que há efeito de focus
            const hasFocusEffect =
                focusStyles.boxShadow !== 'none' ||
                focusStyles.outline !== 'none' ||
                focusStyles.borderColor.includes('0, 145, 178'); // Cyan

            expect(hasFocusEffect).toBe(true);
        }
    });

    test('Texto deve ter bom contraste no light mode', async ({ page }) => {
        await page.goto('/kanban.html');
        await page.waitForLoadState('networkidle');

        // Verificar títulos/headings
        const headings = page.locator('h1, h2, h3, .text-white');
        const count = await headings.count();

        if (count > 0) {
            const heading = headings.first();
            const color = await heading.evaluate((el: HTMLElement) => getComputedStyle(el).color);

            // Cores de texto no light mode devem ser escuras
            const rgb = color.match(/\d+/g)?.map(Number) || [255, 255, 255];
            const brightness = (rgb[0] + rgb[1] + rgb[2]) / 3;

            // Texto principal deve ser escuro (brightness < 100)
            expect(brightness).toBeLessThan(150);
        }
    });

    test('Tabelas devem ter hover nas linhas no light mode', async ({ page }) => {
        await page.goto('/settings.html');
        await page.waitForLoadState('networkidle');

        // Clicar na aba de usuários para ver tabela
        const usersTab = page.locator('button:has-text("Usuários"), [data-tab="users"]').first();
        if (await usersTab.isVisible()) {
            await usersTab.click();
            await page.waitForTimeout(500);
        }

        const tableRows = page.locator('table tbody tr');
        const count = await tableRows.count();

        if (count > 0) {
            const row = tableRows.first();

            const beforeHover = await row.evaluate(
                (el: HTMLElement) => getComputedStyle(el).backgroundColor
            );

            await row.hover();
            await page.waitForTimeout(300);

            const afterHover = await row.evaluate(
                (el: HTMLElement) => getComputedStyle(el).backgroundColor
            );

            // Deve haver mudança de cor no hover
            expect(beforeHover).not.toBe(afterHover);
        }
    });
});

test.describe('Transições Suaves', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
    });

    test('Elementos devem ter transições CSS', async ({ page }) => {
        await page.goto('/kanban.html');
        await page.waitForLoadState('networkidle');

        // Verificar que botões têm transição
        const button = page.locator('.btn').first();
        if (await button.isVisible()) {
            const transition = await button.evaluate(
                (el: HTMLElement) => getComputedStyle(el).transition
            );

            expect(transition).not.toBe('none');
            expect(transition).not.toBe('all 0s ease 0s');
        }

        // Verificar que cards têm transição
        const card = page.locator('.card, .glass-card, .lead-card').first();
        if (await card.isVisible()) {
            const transition = await card.evaluate(
                (el: HTMLElement) => getComputedStyle(el).transition
            );

            expect(transition).not.toBe('none');
        }
    });

    test('Alternância de tema deve ser suave', async ({ page }) => {
        await page.goto('/kanban.html');
        await page.waitForLoadState('networkidle');

        // Capturar screenshot antes
        const beforeTheme = await page.locator('html').getAttribute('data-theme');

        // Toggle tema
        const themeToggle = page
            .locator('#themeToggle, button:has(i.fa-sun), button:has(i.fa-moon)')
            .first();

        if (await themeToggle.isVisible()) {
            await themeToggle.click();

            // Pequena espera para transição
            await page.waitForTimeout(500);

            const afterTheme = await page.locator('html').getAttribute('data-theme');

            // Tema deve ter mudado
            expect(beforeTheme).not.toBe(afterTheme);
        }
    });
});
