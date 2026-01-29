import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Performance & Loading Times
 * Tests page load performance across the application
 */

test.describe('Performance Tests', () => {
  test('pages should load within acceptable time', async ({ page }) => {
    const pages = [
      { url: '/', name: 'Landing Page' },
      { url: '/login.html', name: 'Login Page' },
      { url: '/agendar.html', name: 'Scheduling Page' }
    ];
    
    for (const pageInfo of pages) {
      const startTime = Date.now();
      await page.goto(pageInfo.url);
      const loadTime = Date.now() - startTime;
      
      // Page should load in less than 3 seconds
      expect(loadTime).toBeLessThan(3000);
      console.log(`${pageInfo.name} loaded in ${loadTime}ms`);
    }
  });

  test('should load kanban board efficiently', async ({ page }) => {
    // Clear storage to ensure fresh load
    await page.goto('/login.html');
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
    
    // Login
    await page.fill('#email', 'admin@medicalcrm.com');
    await page.fill('#password', 'Mudar123!');
    
    const startTime = Date.now();
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin.html', { timeout: 15000 });
    
    // Wait for kanban to be fully loaded
    await page.waitForSelector('.lead-card', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Should load in less than 5 seconds
    expect(loadTime).toBeLessThan(5000);
    console.log(`Kanban board loaded in ${loadTime}ms`);
  });
});
