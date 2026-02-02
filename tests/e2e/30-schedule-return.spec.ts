import { test, expect } from '@playwright/test';

test.describe.skip('Schedule Return - Datetime Field', () => {
    // TODO: These tests need finalized leads in the test database
    // Skip for now as they are highly dependent on specific UI state
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('http://localhost:3001/login.html');

        // Wait for page to load
        await page.waitForSelector('#email', { timeout: 5000 });

        // Fill credentials
        await page.fill('#email', 'admin');
        await page.fill('#password', 'Mudar123!');

        // Click login button
        await page.click('button:has-text("Acessar")');

        // Wait for navigation (might redirect to saas-admin.html or admin.html)
        await page.waitForURL(/\/(admin|saas-admin)\.html/, { timeout: 10000 });

        // Navigate to admin.html (Kanban page)
        await page.goto('http://localhost:3001/admin.html');
        await page.waitForTimeout(3000); // Wait for Kanban to load
    });

    test('should show datetime-local field when clicking Retorno button', async ({ page }) => {
        console.log('🧪 Testing Schedule Return datetime field...');

        // Find a finalized lead
        const finalizedColumn = page.locator('#column-finalizado');
        await expect(finalizedColumn).toBeVisible();

        // Get first lead in finalized column
        const firstCard = finalizedColumn.locator('.lead-card').first();
        await expect(firstCard).toBeVisible();

        // Take screenshot before clicking
        await page.screenshot({ path: '/tmp/before-retorno-click.png', fullPage: true });

        // Click Retorno button
        const retornoButton = firstCard.locator('button:has-text("Retorno")');
        await expect(retornoButton).toBeVisible();

        console.log('📸 Clicking Retorno button...');
        await retornoButton.click();

        // Wait for modal to open
        await page.waitForTimeout(1000);

        // Take screenshot of modal
        await page.screenshot({ path: '/tmp/modal-opened.png', fullPage: true });

        // Check if modal is visible
        const modal = page.locator('#editModal');
        await expect(modal).toBeVisible();

        // Get datetime input
        const datetimeInput = page.locator('#editAppointmentDate');
        await expect(datetimeInput).toBeVisible();

        // Check input type
        const inputType = await datetimeInput.getAttribute('type');
        console.log('📋 Input type:', inputType);
        expect(inputType).toBe('datetime-local');

        // Get current value
        const currentValue = await datetimeInput.inputValue();
        console.log('📋 Current value:', currentValue);

        // Try to click on the input
        await datetimeInput.click();
        await page.waitForTimeout(500);

        // Take screenshot of clicked input
        await page.screenshot({ path: '/tmp/input-clicked.png', fullPage: true });

        // Try to type a datetime value
        const newDatetime = '2026-02-15T14:30';
        console.log('⌨️ Typing datetime:', newDatetime);

        // Clear and fill
        await datetimeInput.fill('');
        await datetimeInput.fill(newDatetime);
        await page.waitForTimeout(500);

        // Verify value was set
        const finalValue = await datetimeInput.inputValue();
        console.log('✅ Final value:', finalValue);

        // Take final screenshot
        await page.screenshot({ path: '/tmp/value-filled.png', fullPage: true });

        // Check if we can see time part
        expect(finalValue).toContain('T');
        expect(finalValue).toContain('14:30');

        console.log('✅ Test completed successfully!');
    });

    test('should check if datetime input shows controls', async ({ page }) => {
        console.log('🧪 Checking datetime input controls...');

        // Navigate to a finalized lead and open edit modal
        const finalizedColumn = page.locator('#column-finalizado');
        const firstCard = finalizedColumn.locator('.lead-card').first();
        const retornoButton = firstCard.locator('button:has-text("Retorno")');
        await retornoButton.click();
        await page.waitForTimeout(1000);

        // Get datetime input
        const datetimeInput = page.locator('#editAppointmentDate');

        // Get computed styles
        const inputBox = await datetimeInput.boundingBox();
        console.log('📐 Input dimensions:', inputBox);

        // Check if input is interactive
        const isEnabled = await datetimeInput.isEnabled();
        console.log('🔓 Input enabled:', isEnabled);
        expect(isEnabled).toBe(true);

        // Check if input is readonly
        const isReadonly = await datetimeInput.getAttribute('readonly');
        console.log('📖 Input readonly:', isReadonly);
        expect(isReadonly).toBeNull();

        // Get all input properties
        const inputProps = await page.evaluate((selector) => {
            const input = document.querySelector(selector) as HTMLInputElement;
            return {
                type: input.type,
                value: input.value,
                disabled: input.disabled,
                readonly: input.readOnly,
                placeholder: input.placeholder,
                min: input.min,
                max: input.max,
                step: input.step,
            };
        }, '#editAppointmentDate');

        console.log('📊 Input properties:', JSON.stringify(inputProps, null, 2));

        // Take detailed screenshot
        await page.screenshot({ path: '/tmp/input-properties.png', fullPage: true });
    });

    test('should test datetime input on different viewport', async ({ page }) => {
        // Test on desktop viewport
        await page.setViewportSize({ width: 1920, height: 1080 });

        const finalizedColumn = page.locator('#column-finalizado');
        const firstCard = finalizedColumn.locator('.lead-card').first();
        const retornoButton = firstCard.locator('button:has-text("Retorno")');
        await retornoButton.click();
        await page.waitForTimeout(1000);

        await page.screenshot({ path: '/tmp/desktop-modal.png', fullPage: true });

        // Try to interact with datetime field
        const datetimeInput = page.locator('#editAppointmentDate');
        await datetimeInput.click();
        await page.waitForTimeout(500);

        // Take screenshot of focused input
        await page.screenshot({ path: '/tmp/desktop-input-focused.png', fullPage: true });

        // Test setting value programmatically
        await page.evaluate(() => {
            const input = document.querySelector('#editAppointmentDate') as HTMLInputElement;
            input.value = '2026-02-20T15:45';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        });

        await page.waitForTimeout(500);
        await page.screenshot({ path: '/tmp/desktop-value-set.png', fullPage: true });

        const value = await datetimeInput.inputValue();
        console.log('📅 Programmatic value:', value);
        expect(value).toBe('2026-02-20T15:45');
    });
});
