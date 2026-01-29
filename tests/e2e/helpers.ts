import { Page } from '@playwright/test';

/**
 * E2E Test Helpers & Fixtures
 */

export const CREDENTIALS = {
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
 * Helper function to perform login as admin
 */
export async function loginAsAdmin(page: Page) {
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

/**
 * Helper to close any open modals
 */
export async function closeOpenModals(page: Page) {
  await page.evaluate(() => {
    // Close edit modal if open
    const editModal = document.getElementById('editModal');
    if (editModal && !editModal.classList.contains('hidden')) {
      editModal.classList.add('hidden');
    }
    
    // Close move modal if open
    const moveModal = document.getElementById('moveModal');
    if (moveModal && !moveModal.classList.contains('hidden')) {
      moveModal.classList.add('hidden');
    }
    
    // Remove ALL overlays with high z-index that could intercept clicks
    const highZIndexElements = Array.from(document.querySelectorAll('*')).filter((el: Element) => {
      const zIndex = window.getComputedStyle(el).zIndex;
      return zIndex !== 'auto' && parseInt(zIndex) > 1000;
    });
    
    highZIndexElements.forEach((el: Element) => {
      // Only hide/remove if it's an overlay (fixed position, full screen)
      const style = window.getComputedStyle(el);
      if (style.position === 'fixed' && 
          (el.classList.contains('bg-black') || 
           el.classList.contains('backdrop-blur') ||
           el.getAttribute('class')?.includes('inset-0'))) {
        (el as HTMLElement).style.display = 'none';
      }
    });
  });
  
  // Wait for any animations to complete
  await page.waitForTimeout(500);
}
