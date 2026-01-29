import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Critical User Flows
 * Tests: Public Scheduling, Login Security, Admin Kanban
 */

// ============================================
// HELPERS & FIXTURES
// ============================================

const CREDENTIALS = {
  valid: {
    username: 'admin@medicalcrm.com',
    password: 'Mudar123!'
  },
  invalid: {
    username: 'wrong@user.com',
    password: 'wrongpass'
  }
};

/**
 * Helper function to perform login
 */
async function loginAsAdmin(page: Page) {
  await page.goto('/login.html');
  await page.fill('#email', CREDENTIALS.valid.username);
  await page.fill('#password', CREDENTIALS.valid.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin.html', { timeout: 15000 });
}

// ============================================
// TEST SUITE 1: PUBLIC SCHEDULING FLOW
// ============================================

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
});

// ============================================
// TEST SUITE 2: LOGIN & AUTHENTICATION
// ============================================

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
});

// ============================================
// TEST SUITE 3: ADMIN KANBAN BOARD
// ============================================

test.describe('Admin Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsAdmin(page);
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
    
    // Verify KPI elements exist (checking actual IDs from admin.html)
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

  test('should display user name in header', async ({ page }) => {
    // Verify user greeting exists
    const userName = page.locator('#userName');
    await expect(userName).toBeVisible();
    
    // Verify it contains actual text
    const text = await userName.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('should show navigation buttons', async ({ page }) => {
    // Verify navigation elements exist (use .first() since some links appear in both desktop and mobile nav)
    await expect(page.locator('a[href="patients.html"]').first()).toBeVisible();
    await expect(page.locator('a[href="agenda.html"]').first()).toBeVisible();
    await expect(page.locator('button[onclick="logout()"]').first()).toBeVisible();
  });

  test('should handle logout correctly', async ({ page }) => {
    // Click logout button
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

// ============================================
// TEST SUITE 4: RESPONSIVE DESIGN
// ============================================

test.describe('Responsive Design Tests', () => {
  test('scheduling page should be mobile-friendly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/agendar.html');
    
    // Verify key elements are visible on mobile
    await expect(page.locator('h2').first()).toBeVisible();
    await expect(page.locator('#appointmentForm')).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#phone')).toBeVisible();
  });
});

// ============================================
// TEST SUITE 5: PERFORMANCE & LOADING
// ============================================

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
});
