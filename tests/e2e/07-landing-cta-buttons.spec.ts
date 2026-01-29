import { test, expect } from '@playwright/test';

test.describe('Landing Page - CTA Buttons Redirect', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3001/index.html');
        await page.waitForLoadState('networkidle');
    });

    test('Header button should redirect to /agendar.html', async ({ page }) => {
        const headerButton = page.locator('header a[href="/agendar.html"]').first();
        await expect(headerButton).toBeVisible();
        
        await headerButton.click();
        await page.waitForLoadState('networkidle');
        
        expect(page.url()).toContain('/agendar.html');
    });

    test('Hero main CTA button should redirect to /agendar.html', async ({ page }) => {
        const heroButton = page.locator('section a.neon-button[href="/agendar.html"]').first();
        await expect(heroButton).toBeVisible();
        await expect(heroButton).toContainText('AGENDAR AGORA');
        
        await heroButton.click();
        await page.waitForLoadState('networkidle');
        
        expect(page.url()).toContain('/agendar.html');
    });

    test('Specialty cards buttons should redirect to /agendar.html', async ({ page }) => {
        // Scroll to services section
        await page.locator('#services').scrollIntoViewIfNeeded();
        
        const specialtyButton = page.locator('a.neon-button[href="/agendar.html"]').filter({ hasText: 'Agendar' }).first();
        await expect(specialtyButton).toBeVisible();
        
        await specialtyButton.click();
        await page.waitForLoadState('networkidle');
        
        expect(page.url()).toContain('/agendar.html');
    });

    test('Doctor cards buttons should redirect to /agendar.html', async ({ page }) => {
        // Scroll to doctors section
        await page.locator('#doctors').scrollIntoViewIfNeeded();
        
        const doctorButton = page.locator('a.neon-button[href="/agendar.html"]').filter({ hasText: 'Agendar Consulta' }).first();
        await expect(doctorButton).toBeVisible();
        
        await doctorButton.click();
        await page.waitForLoadState('networkidle');
        
        expect(page.url()).toContain('/agendar.html');
    });

    test('Final CTA section button should redirect to /agendar.html', async ({ page }) => {
        // Scroll to bottom
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);
        
        const finalButton = page.locator('a.neon-button[href="/agendar.html"]').filter({ hasText: 'Agendar Consulta' }).last();
        await expect(finalButton).toBeVisible();
        
        await finalButton.click();
        await page.waitForLoadState('networkidle');
        
        expect(page.url()).toContain('/agendar.html');
    });

    test('All CTA buttons should be links, not onclick handlers', async ({ page }) => {
        // Check that main CTA buttons are <a> tags with href, not buttons with onclick
        const mainCTAButtons = page.locator('a.neon-button[href="/agendar.html"]');
        const count = await mainCTAButtons.count();
        
        console.log(`Found ${count} CTA buttons with href="/agendar.html"`);
        expect(count).toBeGreaterThan(10); // Should have at least 10 CTA buttons
        
        // Check that none of the main CTAs have onclick="openChat()"
        const oldStyleButtons = page.locator('button[onclick="openChat()"]').filter({ hasText: /Agendar/ });
        const oldCount = await oldStyleButtons.count();
        
        console.log(`Found ${oldCount} old-style buttons with onclick`);
        expect(oldCount).toBe(0); // Should have NO buttons with onclick for scheduling
    });

    test('Verify /agendar.html page loads correctly', async ({ page }) => {
        await page.goto('http://localhost:3001/agendar.html');
        await page.waitForLoadState('networkidle');
        
        // Should see the scheduling form
        await expect(page.locator('body')).toBeVisible();
        expect(page.url()).toContain('/agendar.html');
    });
});
