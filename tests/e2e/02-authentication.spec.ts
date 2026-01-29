import { test, expect } from '@playwright/test';
import { CREDENTIALS, closeOpenModals } from './helpers';

/**
 * E2E Tests: Authentication Flow
 * Tests login, logout, and session management
 */

test.describe('Login & Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login.html');
  });

  test('should load login page with form elements', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Acesso Restrito/i);
    
    // Verify login form exists
    await expect(page.locator('#loginForm')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill invalid credentials
    await page.fill('#email', CREDENTIALS.invalid.username);
    await page.fill('#password', CREDENTIALS.invalid.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('#error-msg:not(.hidden)', { timeout: 5000 });
    
    // Verify error is displayed
    await expect(page.locator('#error-msg')).toBeVisible();
    await expect(page.locator('#error-msg')).toContainText(/incorretas|inválid/i);
  });

  test('should redirect to admin panel with valid credentials', async ({ page }) => {
    // Fill valid credentials
    await page.fill('#email', CREDENTIALS.valid.username);
    await page.fill('#password', CREDENTIALS.valid.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin
    await page.waitForURL('/admin.html', { timeout: 10000 });
    
    // Verify we're on admin page
    await expect(page).toHaveURL('/admin.html');
  });

  test('should store authentication token after login', async ({ page }) => {
    // Perform login
    await page.fill('#email', CREDENTIALS.valid.username);
    await page.fill('#password', CREDENTIALS.valid.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('/admin.html', { timeout: 10000 });
    
    // Check if token is stored in sessionStorage
    const token = await page.evaluate(() => {
      return sessionStorage.getItem('MEDICAL_CRM_TOKEN');
    });
    
    expect(token).toBeTruthy();
    expect(typeof token).toBe('string');
  });

  test('should handle logout correctly', async ({ page }) => {
    // First login
    await page.fill('#email', CREDENTIALS.valid.username);
    await page.fill('#password', CREDENTIALS.valid.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin.html', { timeout: 10000 });
    
    // Close any open modals before logout (to avoid z-index interception)
    await closeOpenModals(page);
    
    // Then logout
    await page.click('button[onclick="logout()"]');
    
    // Should redirect to login page
    await page.waitForURL('/login.html', { timeout: 5000 });
    await expect(page).toHaveURL('/login.html');
    
    // Verify token is cleared
    const token = await page.evaluate(() => {
      return sessionStorage.getItem('MEDICAL_CRM_TOKEN');
    });
    
    expect(token).toBeNull();
  });
});
