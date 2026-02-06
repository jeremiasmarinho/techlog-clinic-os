/**
 * E2E Test: Theme Toggle Functionality
 *
 * Verifica que o botão "Tema" na sidebar alterna entre dark/light mode.
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers';

test.describe('Theme Toggle', () => {
    test.beforeEach(async ({ page }) => {
        // Login and navigate to admin page
        await loginAsAdmin(page);
        await page.waitForLoadState('networkidle');
    });

    test('ThemeManager deve estar disponível no window', async ({ page }) => {
        const hasThemeManager = await page.evaluate(() => {
            return typeof (window as any).ThemeManager !== 'undefined';
        });
        expect(hasThemeManager).toBe(true);
    });

    test('ThemeManager.init() deve ter sido chamado (data-theme definido)', async ({ page }) => {
        const dataTheme = await page.evaluate(() => {
            return document.documentElement.getAttribute('data-theme');
        });
        console.log('data-theme on page load:', dataTheme);
        expect(dataTheme).toBeTruthy();
        expect(['dark', 'light']).toContain(dataTheme);
    });

    test('ThemeManager.toggle() deve alternar o tema', async ({ page }) => {
        // Get initial theme
        const initialTheme = await page.evaluate(() => {
            return document.documentElement.getAttribute('data-theme');
        });
        console.log('Initial theme:', initialTheme);

        // Call toggle directly
        await page.evaluate(() => {
            (window as any).ThemeManager.toggle();
        });
        await page.waitForTimeout(500);

        // Check theme changed
        const afterToggle = await page.evaluate(() => {
            return document.documentElement.getAttribute('data-theme');
        });
        console.log('After toggle:', afterToggle);

        expect(afterToggle).not.toEqual(initialTheme);
        expect(['dark', 'light']).toContain(afterToggle);
    });

    test('Botão "Tema" na sidebar deve estar visível e funcionar', async ({ page }) => {
        // The sidebar custom element exists but Playwright sees it as "hidden"
        // because it's a custom element. Look inside it for the actual sidebar element.
        await page.waitForSelector('#sidebar', { timeout: 5000 });

        // Find the theme button - it has sun/moon icons inside the sidebar
        const themeBtn = page
            .locator(
                '#sidebar button:has(i.fa-sun), #sidebar button:has(i.fa-moon), #sidebar button:has-text("Tema")'
            )
            .first();

        const isBtnVisible = await themeBtn.isVisible().catch(() => false);
        console.log('Theme button visible:', isBtnVisible);

        if (!isBtnVisible) {
            // Try expanding sidebar first
            const toggleBtn = page.locator('#toggleSidebarBtn').first();
            if (await toggleBtn.isVisible()) {
                await toggleBtn.click();
                await page.waitForTimeout(300);
            }
        }

        await expect(themeBtn).toBeVisible({ timeout: 5000 });

        // Get current theme
        const beforeTheme = await page.evaluate(() => {
            return document.documentElement.getAttribute('data-theme');
        });
        console.log('Before click theme:', beforeTheme);

        // Click theme button
        await themeBtn.click();
        await page.waitForTimeout(500);

        // Theme should have changed
        const afterTheme = await page.evaluate(() => {
            return document.documentElement.getAttribute('data-theme');
        });
        console.log('After click theme:', afterTheme);

        expect(afterTheme).not.toEqual(beforeTheme);
    });

    test('Console deve mostrar erros JS relevantes', async ({ page }) => {
        const errors: string[] = [];
        const warnings: string[] = [];
        const logs: string[] = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') errors.push(msg.text());
            if (msg.type() === 'warning') warnings.push(msg.text());
            if (msg.type() === 'log') logs.push(msg.text());
        });

        page.on('pageerror', (err) => {
            errors.push(`PAGE ERROR: ${err.message}`);
        });

        // Reload page to capture all console output
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        console.log('=== Console Errors ===');
        errors.forEach((e) => console.log('  ERROR:', e));
        console.log('=== Console Warnings ===');
        warnings.forEach((w) => console.log('  WARN:', w));
        console.log('=== Console Logs (theme-related) ===');
        logs.filter((l) => /theme|Theme/i.test(l)).forEach((l) => console.log('  LOG:', l));

        // Filter out known non-critical errors
        const criticalErrors = errors.filter(
            (e) =>
                !e.includes('favicon.ico') &&
                !e.includes('tailwindcss') &&
                !e.includes('Content-Security-Policy') &&
                !e.includes('Content Security Policy') &&
                !e.includes('users/preferences') &&
                !e.includes('404') &&
                !e.includes('media-src') &&
                !e.includes('data:audio')
        );

        console.log('=== Critical JS Errors ===');
        criticalErrors.forEach((e) => console.log('  CRITICAL:', e));

        // No critical JS errors should exist
        expect(criticalErrors.length).toBe(0);
    });

    test('Diagnóstico: verificar estado do ThemeManager em detalhe', async ({ page }) => {
        const diagnostics = await page.evaluate(() => {
            const tm = (window as any).ThemeManager;
            return {
                exists: !!tm,
                type: typeof tm,
                hasInit: typeof tm?.init === 'function',
                hasToggle: typeof tm?.toggle === 'function',
                hasSetTheme: typeof tm?.setTheme === 'function',
                dataThemeAttr: document.documentElement.getAttribute('data-theme'),
                bodyClasses: document.body.className,
                htmlClasses: document.documentElement.className,
                localStorageTheme: localStorage.getItem('theme-preference'),
                themeToggleBtn: !!document.getElementById('themeToggle'),
                sidebarThemeBtn:
                    !!document.querySelector('button:has(i.fa-sun)') ||
                    !!document.querySelector('button:has(i.fa-moon)'),
                sidebarExists: !!document.querySelector('medical-sidebar'),
                sidebarInnerHTML:
                    document.querySelector('medical-sidebar')?.innerHTML?.substring(0, 200) ||
                    'EMPTY',
            };
        });

        console.log('=== ThemeManager Diagnostics ===');
        Object.entries(diagnostics).forEach(([key, val]) => {
            console.log(`  ${key}:`, val);
        });

        expect(diagnostics.exists).toBe(true);
        expect(diagnostics.hasToggle).toBe(true);
        expect(diagnostics.dataThemeAttr).toBeTruthy();
    });
});
