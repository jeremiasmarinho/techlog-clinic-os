import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Public Scheduling Flow
 * Tests the patient-facing scheduling page
 */

test.describe('Public Scheduling Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agendar.html');
  });

  test('should load scheduling page with all essential elements', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Agendamento.*Clínica Viva|Clínica Viva.*Agendamento/i);
    
    // Verify header elements
    await expect(page.locator('h2').first()).toBeVisible();
    
    // Verify main content area
    await expect(page.locator('form')).toBeVisible();
  });

  test('should navigate through scheduling steps', async ({ page }) => {
    // Verify form is visible
    await expect(page.locator('form')).toBeVisible();
    
    // Step 1 should be visible (specialty selection)
    await expect(page.locator('#step1')).toBeVisible();
    
    // Name and phone are in step 5, so they should be hidden initially
    await expect(page.locator('#step5')).not.toBeVisible();
  });

  test('should be mobile-friendly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify key elements are visible on mobile
    await expect(page.locator('h2').first()).toBeVisible();
    await expect(page.locator('#appointmentForm')).toBeVisible();
    await expect(page.locator('#step1')).toBeVisible();
  });
});
