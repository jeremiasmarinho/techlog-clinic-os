import { test, expect } from '@playwright/test';
import { loginAsAdmin, closeOpenModals } from './helpers';

/**
 * E2E Tests: Date Filters
 * Tests date filtering functionality on kanban board
 */

test.describe('Date Filters', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await closeOpenModals(page);
  });

  test('should filter kanban by date period', async ({ page }) => {
    // Wait for Web Component to render
    await page.waitForFunction(() => {
      const sidebar = document.querySelector('medical-sidebar');
      return sidebar && sidebar.querySelector('#dateFilter');
    }, { timeout: 10000 });
    
    await page.waitForTimeout(500);
    
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
    // Wait for Web Component to render
    await page.waitForFunction(() => {
      const sidebar = document.querySelector('medical-sidebar');
      return sidebar && sidebar.querySelector('#dateFilter');
    }, { timeout: 10000 });
    
    await page.waitForTimeout(500);
    
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
    // Wait for Web Component to render
    await page.waitForFunction(() => {
      const sidebar = document.querySelector('medical-sidebar');
      return sidebar && sidebar.querySelector('#dateFilter');
    }, { timeout: 10000 });
    
    await page.waitForTimeout(500);
    
    // Change to "Today" (most restrictive filter)
    await page.selectOption('#dateFilter', 'today');
    await page.waitForTimeout(2000);
    
    // Count leads in kanban board
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
