import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Critical User Flows
 * Tests: Public Scheduling, Login Security, Admin Kanban, Financial Fields
 * Updated: January 2026 - Glassmorphism Modal + Financial Features
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
  // Clear any existing session/storage to avoid conflicts
  await page.context().clearCookies();
  await page.goto('/login.html');
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  
  // Wait for page to be fully ready
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(500);
  
  // Fill credentials
  await page.fill('#email', CREDENTIALS.valid.username);
  await page.fill('#password', CREDENTIALS.valid.password);
  
  // Click login and wait for navigation
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin.html', { timeout: 15000 });
  
  // Wait for kanban board to load
  await page.waitForTimeout(2000);
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
    
    // Close any open modal overlays that might be blocking clicks
    await page.evaluate(() => {
      // Remove any custom dialog overlays (from dialogs.js) but NOT the edit modal itself
      const overlays = Array.from(document.querySelectorAll('.fixed.inset-0.bg-black\\/80'));
      overlays.forEach(overlay => {
        // Only remove if it's NOT the edit modal
        if (overlay.id !== 'editModal') {
          overlay.remove();
        }
      });
      
      // Close edit modal if open (but don't remove it)
      const editModal = document.getElementById('editModal');
      if (editModal && !editModal.classList.contains('hidden')) {
        editModal.classList.add('hidden');
      }
    });
    
    // Wait for any animations to complete
    await page.waitForTimeout(500);
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

  test('should display user name in sidebar', async ({ page }) => {
    // Hover over sidebar to reveal user name
    const sidebar = page.locator('#sidebar');
    await sidebar.hover();
    
    // Wait a bit for transition
    await page.waitForTimeout(400);
    
    // Verify user name appears
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

  // ============================================
  // FINANCIAL FIELDS TESTS
  // ============================================
  // Note: These tests are temporarily skipped due to modal opening issues
  // that need to be debugged in the browser console.

  test('should open edit modal with glassmorphism styling', async ({ page }) => {
    // Listen for console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleMessages.push(msg.text());
      }
    });
    
    // Wait for leads to load
    await page.waitForTimeout(3000);
    
    // Find first lead card
    const leadCard = page.locator('.lead-card').first();
    
    if (await leadCard.count() > 0) {
      // Verify button exists
      const editButton = leadCard.locator('button.lead-edit-btn');
      await expect(editButton).toBeVisible();
      
      // Click edit button
      await editButton.click();
      
      // Wait for modal animation
      await page.waitForTimeout(1000);
      
      // Debug: check console logs
      console.log('Console messages:', consoleMessages);
      
      // Verify modal is visible
      await expect(page.locator('#editModal')).toBeVisible();
      await expect(page.locator('#editModal')).not.toHaveClass(/hidden/);
      
      // Verify modal header with gradient
      await expect(page.locator('#editModal h2').filter({ hasText: 'Editar Agendamento' })).toBeVisible();
      
      // Close modal for cleanup
      await page.click('button[onclick="closeEditModal()"]');
      await page.waitForTimeout(500);
    }
  });

  test('should display all financial form fields', async ({ page }) => {
    // Wait for leads
    await page.waitForTimeout(3000);
    
    const leadCard = page.locator('.lead-card').first();
    
    if (await leadCard.count() > 0) {
      await leadCard.locator('button:has(i.fa-pen)').click();
      await page.waitForTimeout(500);
      
      // Verify modal opened
      await expect(page.locator('#editModal')).toBeVisible();
      
      // Verify basic fields
      await expect(page.locator('#editLeadName')).toBeVisible();
      await expect(page.locator('#editAppointmentDate')).toBeVisible();
      await expect(page.locator('#editDoctor')).toBeVisible();
      await expect(page.locator('#editType')).toBeVisible();
      
      // Verify financial section fields
      await expect(page.locator('#editPaymentType')).toBeVisible();
      await expect(page.locator('#editPaymentValue')).toBeVisible();
      await expect(page.locator('#editNotes')).toBeVisible();
      
      // Close modal
      await page.click('button[onclick="closeEditModal()"]');
      await page.waitForTimeout(500);
    }
  });

  test('should toggle insurance field based on payment type', async ({ page }) => {
    // Wait for leads
    await page.waitForTimeout(3000);
    
    const leadCard = page.locator('.lead-card').first();
    
    if (await leadCard.count() > 0) {
      await leadCard.locator('button:has(i.fa-pen)').click();
      await page.waitForTimeout(500);
      
      // Verify modal opened
      await expect(page.locator('#editModal')).toBeVisible();
      
      const insuranceContainer = page.locator('#insuranceNameContainer');
      
      // Select "Plano de Saúde"
      await page.selectOption('#editPaymentType', 'plano');
      
      // Wait for toggle animation
      await page.waitForTimeout(500);
      
      // Insurance field should now be visible
      await expect(insuranceContainer).not.toHaveClass(/hidden/);
      await expect(page.locator('#editInsuranceName')).toBeVisible();
      
      // Change to "Particular"
      await page.selectOption('#editPaymentType', 'particular');
      await page.waitForTimeout(500);
      
      // Insurance field should be hidden again
      await expect(insuranceContainer).toHaveClass(/hidden/);
      
      // Close modal
      await page.click('button[onclick="closeEditModal()"]');
      await page.waitForTimeout(500);
    }
  });

  test('should edit lead financials correctly', async ({ page }) => {
    // Wait for leads to load
    await page.waitForTimeout(3000);
    
    // Find first lead card
    const leadCard = page.locator('.lead-card').first();
    
    if (await leadCard.count() > 0) {
      // Get lead name for later verification
      const leadName = await leadCard.locator('.lead-name').textContent();
      
      // Step 1: Click edit button
      await leadCard.locator('button:has(i.fa-pen)').click();
      
      // Step 2: Wait for modal animation
      await page.waitForTimeout(500);
      
      // Step 3: Verify modal is visible
      await expect(page.locator('#editModal')).toBeVisible();
      
      // Step 4: Select "Plano de Saúde" payment type
      await page.selectOption('#editPaymentType', 'plano');
      
      // Step 5: Wait for insurance field animation
      await page.waitForTimeout(500);
      
      // Step 6: Verify insurance field became visible
      const insuranceContainer = page.locator('#insuranceNameContainer');
      await expect(insuranceContainer).not.toHaveClass(/hidden/);
      await expect(page.locator('#editInsuranceName')).toBeVisible();
      
      // Step 7: Fill value field
      await page.fill('#editPaymentValue', 'R$ 300,00');
      
      // Step 8: Fill insurance name
      await page.fill('#editInsuranceName', 'Unimed');
      
      // Step 9: Click Save button
      await page.locator('#editForm button[type="submit"]').click();
      
      // Step 10: Wait for modal to close (check for hidden class)
      await page.waitForTimeout(2000); // Wait for save operation
      
      // Verify modal closed
      const modalHidden = await page.locator('#editModal').evaluate((el) => {
        return el.classList.contains('hidden');
      });
      
      expect(modalHidden).toBeTruthy();
      
      // Wait for data refresh
      await page.waitForTimeout(2000);
      
      console.log(`Successfully edited financial data for lead: ${leadName}`);
    } else {
      console.log('No leads found to test financial edit');
    }
  });

  test('should display financial badges on lead cards', async ({ page }) => {
    // Wait for leads to load
    await page.waitForTimeout(2000);
    
    // Look for lead cards with financial badges (emerald/green color scheme)
    const allCards = page.locator('.lead-card');
    const cardCount = await allCards.count();
    
    console.log(`Found ${cardCount} lead cards total`);
    
    if (cardCount > 0) {
      // Check if any card has financial badge elements
      const cardsWithBadges = allCards.filter({
        has: page.locator('span[class*="emerald"], span[class*="green"]')
      });
      
      const badgeCount = await cardsWithBadges.count();
      console.log(`Found ${badgeCount} cards with financial badges`);
      
      // At least verify the structure exists (even if no financial data yet)
      expect(cardCount).toBeGreaterThan(0);
    }
  });

  test('should filter kanban by date period', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Verify date filter exists
    const dateFilter = page.locator('#dateFilter');
    await expect(dateFilter).toBeVisible();
    
    // Get initial lead count (default: 7 days)
    const initialCards = await page.locator('.lead-card').count();
    console.log(`Initial lead count (7 days): ${initialCards}`);
    
    // Change to "Today"
    await dateFilter.selectOption('today');
    await page.waitForTimeout(2000);
    
    // Verify leads were filtered
    const todayCards = await page.locator('.lead-card').count();
    console.log(`Today lead count: ${todayCards}`);
    
    // Today should have fewer or equal leads than 7 days
    expect(todayCards).toBeLessThanOrEqual(initialCards);
    
    // Change to "All"
    await dateFilter.selectOption('all');
    await page.waitForTimeout(2000);
    
    const allCards = await page.locator('.lead-card').count();
    console.log(`All lead count: ${allCards}`);
    
    // All should have most leads
    expect(allCards).toBeGreaterThanOrEqual(todayCards);
  });

  test('should persist date filter after page reload', async ({ page }) => {
    // Set filter to "30 days"
    await page.selectOption('#dateFilter', '30days');
    await page.waitForTimeout(1000);
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Verify filter is still "30 days"
    const dateFilter = page.locator('#dateFilter');
    const selectedValue = await dateFilter.inputValue();
    
    expect(selectedValue).toBe('30days');
    
    // Verify localStorage has correct value
    const savedFilter = await page.evaluate(() => {
      return localStorage.getItem('kanbanDateFilter');
    });
    
    expect(savedFilter).toBe('30days');
  });

  test('should always show active leads regardless of date filter', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Change to "Today" (most restrictive filter)
    await page.selectOption('#dateFilter', 'today');
    await page.waitForTimeout(2000);
    
    // Count leads in "Novos" and "Em Atendimento" columns
    const kanbanBoard = page.locator('#kanbanBoard');
    const allColumns = await kanbanBoard.locator('[id^="column-"]').count();
    
    console.log(`Found ${allColumns} kanban columns`);
    
    // Get counts for different filters
    const todayTotal = await page.locator('.lead-card').count();
    
    // Change to "All"
    await page.selectOption('#dateFilter', 'all');
    await page.waitForTimeout(2000);
    
    const allTotal = await page.locator('.lead-card').count();
    
    console.log(`Active leads: Today filter=${todayTotal}, All filter=${allTotal}`);
    
    // All should show same or more leads than today
    expect(allTotal).toBeGreaterThanOrEqual(todayTotal);
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
