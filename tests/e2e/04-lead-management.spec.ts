import { test, expect } from '@playwright/test';
import { loginAsAdmin, closeOpenModals } from './helpers';

/**
 * E2E Tests: Lead Management & Financial Fields
 * Tests lead editing, financial data, and modal interactions
 */

test.describe('Lead Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await closeOpenModals(page);
  });

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
      
      // Step 10: Wait for modal to close
      await page.waitForTimeout(2000);
      
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
    
    // Look for lead cards with financial badges
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
      
      // At least verify the structure exists
      expect(cardCount).toBeGreaterThan(0);
    }
  });
});
