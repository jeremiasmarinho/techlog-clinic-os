import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Settings Logo Upload', () => {
    test.beforeEach(async ({ page }) => {
        // Login
        await page.goto('/login.html');
        await page.fill('#email', 'admin');
        await page.fill('#password', 'Mudar123!');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin.html', { timeout: 15000 });

        // Navigate to settings
        await page.goto('/settings.html');
        await page.waitForLoadState('networkidle');
    });

    test('should upload and display logo', async ({ page }) => {
        // Click on "Perfil da Clínica" tab
        await page.click('text=Perfil da Clínica');
        await page.waitForTimeout(500);

        // Get the initial logo src
        const logoImage = page.locator('#logoImage');
        const initialSrc = await logoImage.getAttribute('src');
        console.log('Initial logo src:', initialSrc?.substring(0, 100));

        // Check if logo elements exist
        const logoInput = page.locator('#logoInput');
        const logoIcon = page.locator('#logoIcon');

        console.log('logoInput exists:', await logoInput.count());
        console.log('logoImage exists:', await logoImage.count());
        console.log('logoIcon exists:', await logoIcon.count());

        // Check visibility
        console.log('logoImage hidden class:', await logoImage.getAttribute('class'));
        console.log('logoIcon hidden class:', await logoIcon.getAttribute('class'));

        // Create a test image file
        const testImagePath = path.join(__dirname, 'test-logo.png');

        // Create a simple 1x1 red PNG
        const pngBuffer = Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
            0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00,
            0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08,
            0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xfe,
            0xd4, 0xef, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
        ]);
        fs.writeFileSync(testImagePath, pngBuffer);

        // Upload the file
        await logoInput.setInputFiles(testImagePath);

        // Wait for processing
        await page.waitForTimeout(1000);

        // Check if logo was updated
        const newSrc = await logoImage.getAttribute('src');
        console.log('New logo src:', newSrc?.substring(0, 100));

        // Check classes after upload
        console.log('logoImage hidden class after:', await logoImage.getAttribute('class'));
        console.log('logoIcon hidden class after:', await logoIcon.getAttribute('class'));

        // Verify the image is visible (hidden class removed)
        const logoImageClasses = await logoImage.getAttribute('class');
        expect(logoImageClasses).not.toContain('hidden');

        // Verify src changed to base64
        expect(newSrc).toContain('data:image');

        // Cleanup
        fs.unlinkSync(testImagePath);
    });

    test('should persist logo after save', async ({ page }) => {
        // Click on "Perfil da Clínica" tab
        await page.click('text=Perfil da Clínica');
        await page.waitForTimeout(500);

        const logoImage = page.locator('#logoImage');
        const logoInput = page.locator('#logoInput');

        // Create test image
        const testImagePath = path.join(__dirname, 'test-logo2.png');
        const pngBuffer = Buffer.from([
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
            0x44, 0x52, 0x00, 0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x02, 0x08, 0x02, 0x00, 0x00,
            0x00, 0xfd, 0xd4, 0x9a, 0x73, 0x00, 0x00, 0x00, 0x12, 0x49, 0x44, 0x41, 0x54, 0x08,
            0xd7, 0x63, 0xf8, 0x0f, 0x00, 0x00, 0x01, 0x01, 0x00, 0x05, 0x18, 0xd8, 0x4d, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
        ]);
        fs.writeFileSync(testImagePath, pngBuffer);

        // Upload file
        await logoInput.setInputFiles(testImagePath);
        await page.waitForTimeout(500);

        // Get the base64 after upload
        const uploadedSrc = await logoImage.getAttribute('src');
        console.log('Uploaded src starts with:', uploadedSrc?.substring(0, 50));

        // Click save button
        await page.click('#saveSettingsBtn');

        // Wait for save
        await page.waitForTimeout(2000);

        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Go to clinic profile tab
        await page.click('text=Perfil da Clínica');
        await page.waitForTimeout(1000);

        // Check if logo persisted
        const persistedSrc = await logoImage.getAttribute('src');
        console.log('Persisted src starts with:', persistedSrc?.substring(0, 50));

        expect(persistedSrc).toContain('data:image');

        // Cleanup
        fs.unlinkSync(testImagePath);
    });
});
