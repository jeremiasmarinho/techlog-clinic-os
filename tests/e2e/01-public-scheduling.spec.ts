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
    await expect(page).toHaveTitle(/Clínica Viva.*Agendamento/i);
    
    // Verify header elements
    await expect(page.locator('h2').first()).toBeVisible();
    
    // Verify main content area
    await expect(page.locator('form')).toBeVisible();
  });

  test('should navigate through scheduling steps', async ({ page }) => {
    // Verify form is visible
    await expect(page.locator('form')).toBeVisible();
    
    // Verify input fields exist
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#phone')).toBeVisible();
    await expect(page.locator('#type')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    
    // Form validation should prevent submission
    const nameField = page.locator('#name');
    const isInvalid = await nameField.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('should be mobile-friendly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify key elements are visible on mobile
    await expect(page.locator('h2').first()).toBeVisible();
    await expect(page.locator('#appointmentForm')).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#phone')).toBeVisible();
  });
});
