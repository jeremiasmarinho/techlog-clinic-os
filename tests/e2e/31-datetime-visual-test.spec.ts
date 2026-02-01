import { test, expect } from '@playwright/test';

test.describe('Datetime Field - Visual Test', () => {
    test('should show improved datetime field with clear instructions', async ({ page }) => {
        console.log('🎨 Testing improved datetime field UI...');

        // Login
        await page.goto('http://localhost:3001/login.html');
        await page.fill('#email', 'admin');
        await page.fill('#password', 'Mudar123!');
        await page.click('button:has-text("Acessar")');

        // Wait for redirect and navigate to Kanban
        await page.waitForURL(/\/(admin|saas-admin)\.html/, { timeout: 10000 });
        await page.goto('http://localhost:3001/admin.html');
        await page.waitForTimeout(3000);

        console.log('📊 Looking for finalized leads...');

        // Find any lead card with Retorno button
        const retornoButton = page.locator('button:has-text("Retorno")').first();

        // Check if there's at least one lead to test
        const count = await retornoButton.count();
        if (count === 0) {
            console.log('⚠️ No finalized leads found, creating one by archiving...');

            // Find an attended lead and archive it
            const attendedSection = page.locator('[data-status="compareceu"]');
            const leadCard = attendedSection.locator('.lead-card').first();

            if ((await leadCard.count()) > 0) {
                const archiveBtn = leadCard.locator('button[onclick*="archiveLead"]').first();
                await archiveBtn.click();

                // Wait for the finalized section to update
                await page.waitForTimeout(2000);
            }
        }

        console.log('📸 Clicking Retorno button...');
        await page.screenshot({ path: '/tmp/visual-before-click.png', fullPage: true });

        await retornoButton.click();
        await page.waitForTimeout(1000);

        console.log('🖼️ Capturing modal with new datetime field design...');
        await page.screenshot({ path: '/tmp/visual-modal-opened.png', fullPage: true });

        // Verify the datetime field exists
        const datetimeInput = page.locator('#editAppointmentDate');
        await expect(datetimeInput).toBeVisible();

        // Check if help text is visible
        const helpText = page.locator('text=Como usar');
        await expect(helpText).toBeVisible();
        console.log('✅ Help text is visible');

        // Check for calendar icon
        const calendarIcon = page.locator('.fa-calendar-plus');
        await expect(calendarIcon).toBeVisible();
        console.log('✅ Calendar icon is visible');

        // Click on the input to show native picker
        await datetimeInput.click();
        await page.waitForTimeout(500);

        console.log('📸 Capturing datetime picker opened...');
        await page.screenshot({ path: '/tmp/visual-picker-opened.png', fullPage: true });

        // Try to fill a value
        const testDate = '2026-02-15T14:30';
        await datetimeInput.fill(testDate);
        await page.waitForTimeout(500);

        console.log('📸 Capturing filled value...');
        await page.screenshot({ path: '/tmp/visual-value-filled.png', fullPage: true });

        // Verify value was set
        const value = await datetimeInput.inputValue();
        console.log(`📋 Value set: ${value}`);
        expect(value).toBe(testDate);

        console.log('✅ Visual test completed!');
    });

    test('should verify datetime field styling', async ({ page }) => {
        console.log('🎨 Checking datetime field styling...');

        // Login and navigate
        await page.goto('http://localhost:3001/login.html');
        await page.fill('#email', 'admin');
        await page.fill('#password', 'Mudar123!');
        await page.click('button:has-text("Acessar")');
        await page.waitForURL(/\/(admin|saas-admin)\.html/, { timeout: 10000 });
        await page.goto('http://localhost:3001/admin.html');
        await page.waitForTimeout(3000);

        // Click Retorno
        const retornoButton = page.locator('button:has-text("Retorno")').first();
        await retornoButton.click();
        await page.waitForTimeout(1000);

        // Get datetime field
        const datetimeInput = page.locator('#editAppointmentDate');

        // Check border color (should be cyan)
        const borderColor = await datetimeInput.evaluate((el) => {
            return window.getComputedStyle(el).borderColor;
        });
        console.log(`🎨 Border color: ${borderColor}`);

        // Check if input is large enough
        const box = await datetimeInput.boundingBox();
        console.log(`📐 Input size: ${box?.width}x${box?.height}`);

        expect(box?.height).toBeGreaterThan(40); // Should be at least 40px tall

        console.log('✅ Styling check complete!');
    });
});
