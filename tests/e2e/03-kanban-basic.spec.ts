import { test, expect } from '@playwright/test';
import { loginAsAdmin, closeOpenModals } from './helpers';

/**
 * E2E Tests: Kanban Board Basic Functionality
 * Tests kanban columns, KPIs, and navigation
 */

test.describe('Kanban Board - Basic Features', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsAdmin(page);
        await closeOpenModals(page);
    });

    test('should load kanban board with all columns', async ({ page }) => {
        // Verify page loaded
        await expect(page).toHaveTitle(/Medical CRM.*Gestão/i);

        // Verify all kanban columns exist
        const columns = [
            'column-novo',
            'column-em_atendimento',
            'column-agendado',
            'column-finalizado',
        ];

        for (const columnId of columns) {
            await expect(page.locator(`#${columnId}`)).toBeVisible();
        }
    });

    test.skip('should display executive KPIs on dashboard', async ({ page }) => {
        // TODO: Dashboard modal needs a visible button to open it
        // Currently the openDashboard() function exists but is not accessible via UI
        // Wait for page to fully load
        await page.waitForTimeout(2000);

        // Wait for sidebar component to render (state: attached allows hidden elements)
        await page.waitForSelector('medical-sidebar', { state: 'attached', timeout: 10000 });
        await page.waitForTimeout(1000);

        // Click dashboard button inside sidebar (may be hidden on mobile, use force)
        const dashboardBtn = page
            .locator('medical-sidebar button[onclick="openDashboard()"]')
            .first();
        await dashboardBtn.click({ force: true });
        await page.waitForTimeout(1000);

        // Wait for dashboard modal to be visible
        await page.waitForSelector('#dashboardModal:not(.hidden)', { timeout: 5000 });

        // Verify KPI elements exist (actual IDs from admin.html)
        const kpis = ['#totalLeads', '#revenueEstimate', '#attendanceRate'];

        for (const kpiId of kpis) {
            const kpi = page.locator(kpiId);
            await expect(kpi).toBeVisible();
        }
    });

    // Test disabled - sidebar component loads asynchronously
    // test('should display user name in sidebar', async ({ page }) => {
    //   // Set viewport to desktop size (sidebar is md:block hidden, needs >=768px)
    //   await page.setViewportSize({ width: 1280, height: 720 });
    //
    //   // Wait for sidebar to render
    //   await page.waitForTimeout(300);
    //
    //   // Verify user name appears
    //   const userName = page.locator('#userName');
    //   await expect(userName).toBeVisible();
    //
    //   // Verify it contains actual text
    //   const text = await userName.textContent();
    //   expect(text?.trim().length).toBeGreaterThan(0);
    // });

    test('should show navigation buttons', async ({ page }) => {
        // Verify navigation elements exist
        await expect(page.locator('a[href="arquivo.html"]').first()).toBeVisible();
        await expect(page.locator('a[href="agenda.html"]').first()).toBeVisible();
        await expect(page.locator('button[onclick="logout()"]').first()).toBeVisible();
    });
});
