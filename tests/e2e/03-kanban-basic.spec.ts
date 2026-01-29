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
      'column-finalizado'
    ];
    
    for (const columnId of columns) {
      await expect(page.locator(`#${columnId}`)).toBeVisible();
    }
  });

  test('should display executive KPIs on dashboard', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Verify KPI elements exist
    const kpis = [
      '#taxaConversao',
      '#noShows',
      '#consultasSemana'
    ];
    
    for (const kpiId of kpis) {
      const kpi = page.locator(kpiId);
      await expect(kpi).toBeVisible();
    }
  });

  test('should display user name in sidebar', async ({ page }) => {
    // Set viewport to desktop size (sidebar is md:block hidden, needs >=768px)
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Wait for sidebar to render
    await page.waitForTimeout(300);
    
    // Verify user name appears
    const userName = page.locator('#userName');
    await expect(userName).toBeVisible();
    
    // Verify it contains actual text
    const text = await userName.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('should show navigation buttons', async ({ page }) => {
    // Verify navigation elements exist
    await expect(page.locator('a[href="patients.html"]').first()).toBeVisible();
    await expect(page.locator('a[href="agenda.html"]').first()).toBeVisible();
    await expect(page.locator('button[onclick="logout()"]').first()).toBeVisible();
  });
});
