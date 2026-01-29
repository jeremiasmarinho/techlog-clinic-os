import { test, expect } from '@playwright/test';

test.describe('Scheduling Page - Multi-step Flow', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3001/agendar.html');
        await page.waitForLoadState('networkidle');
    });

    test('Should have same styling as landing page', async ({ page }) => {
        // Check glass-card styling
        const formContainer = page.locator('#formContainer');
        await expect(formContainer).toBeVisible();
        await expect(formContainer).toHaveClass(/glass-card/);
        
        // Check header exists
        const header = page.locator('header');
        await expect(header).toBeVisible();
        await expect(header).toContainText('Sua Clínica Aqui');
    });

    test('Step 1: Select specialty', async ({ page }) => {
        // Should show step 1 by default
        await expect(page.locator('#step1')).toBeVisible();
        await expect(page.locator('#step2')).toBeHidden();
        
        // Click on Clínica Geral
        await page.getByText('Clínica Geral').click();
        
        // Should move to step 2
        await expect(page.locator('#step1')).toBeHidden();
        await expect(page.locator('#step2')).toBeVisible();
    });

    test('Step 2: Select payment type', async ({ page }) => {
        // Go through step 1
        await page.getByText('Clínica Geral').click();
        
        // Select payment
        await page.getByText('Plano de Saúde').first().click();
        
        // Should move to step 3
        await expect(page.locator('#step2')).toBeHidden();
        await expect(page.locator('#step3')).toBeVisible();
    });

    test('Step 3: Select period', async ({ page }) => {
        // Go through steps 1-2
        await page.getByText('Clínica Geral').click();
        await page.getByText('Plano de Saúde').first().click();
        
        // Select period
        await page.getByText('Manhã').first().click();
        
        // Should move to step 4
        await expect(page.locator('#step3')).toBeHidden();
        await expect(page.locator('#step4')).toBeVisible();
    });

    test('Step 4: Select day preference', async ({ page }) => {
        // Go through steps 1-3
        await page.getByText('Clínica Geral').click();
        await page.getByText('Plano de Saúde').first().click();
        await page.getByText('Manhã').first().click();
        
        // Select day
        await page.getByText('Segunda a Sexta').first().click();
        
        // Should move to step 5
        await expect(page.locator('#step4')).toBeHidden();
        await expect(page.locator('#step5')).toBeVisible();
    });

    test('Complete flow: Full appointment submission', async ({ page }) => {
        // Step 1: Specialty
        await page.getByText('Cardiologia').click();
        
        // Step 2: Payment
        await page.getByText('Particular').first().click();
        
        // Step 3: Period
        await page.getByText('Tarde').first().click();
        
        // Step 4: Day
        await page.getByText('Tanto faz').last().click();
        
        // Step 5: Personal data
        await expect(page.locator('#step5')).toBeVisible();
        
        await page.locator('#name').fill('João da Silva');
        await page.locator('#phone').fill('11999887766');
        
        // Verify phone mask
        const phoneValue = await page.locator('#phone').inputValue();
        expect(phoneValue).toMatch(/\(\d{2}\) \d{5}-\d{4}/);
        
        // Submit form
        await page.locator('#submitBtn').click();
        
        // Wait for API call
        await page.waitForTimeout(2000);
        
        // Should show success message
        await expect(page.locator('#successContainer')).toBeVisible();
        await expect(page.locator('#formContainer')).toBeHidden();
        
        // Verify summary
        await expect(page.locator('#summarySpecialty')).toContainText('Cardiologia');
        await expect(page.locator('#summaryPayment')).toContainText('Particular');
    });

    test('Progress indicator updates correctly', async ({ page }) => {
        const indicators = page.locator('.step-indicator');
        
        // Step 1: First indicator active
        await expect(indicators.nth(0)).toHaveClass(/active/);
        await expect(indicators.nth(1)).not.toHaveClass(/active/);
        
        // Go to step 2
        await page.getByText('Clínica Geral').click();
        await expect(indicators.nth(1)).toHaveClass(/active/);
        
        // Go to step 3
        await page.getByText('Plano de Saúde').first().click();
        await expect(indicators.nth(2)).toHaveClass(/active/);
    });

    test('Should validate name requires full name', async ({ page }) => {
        // Go through all steps quickly
        await page.getByText('Clínica Geral').click();
        await page.getByText('Plano de Saúde').first().click();
        await page.getByText('Manhã').first().click();
        await page.getByText('Segunda a Sexta').first().click();
        
        // Try with single name
        await page.locator('#name').fill('João');
        await page.locator('#phone').fill('11999887766');
        
        // Listen for alert
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('nome e sobrenome');
            await dialog.accept();
        });
        
        await page.locator('#submitBtn').click();
    });

    test('Should validate phone with minimum length', async ({ page }) => {
        // Go through all steps
        await page.getByText('Clínica Geral').click();
        await page.getByText('Plano de Saúde').first().click();
        await page.getByText('Manhã').first().click();
        await page.getByText('Segunda a Sexta').first().click();
        
        // Try with invalid phone
        await page.locator('#name').fill('João Silva');
        await page.locator('#phone').fill('119988');
        
        // Listen for alert
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('WhatsApp válido');
            await dialog.accept();
        });
        
        await page.locator('#submitBtn').click();
    });

    test('Reset form should return to step 1', async ({ page }) => {
        // Complete full flow
        await page.getByText('Clínica Geral').click();
        await page.getByText('Plano de Saúde').first().click();
        await page.getByText('Manhã').first().click();
        await page.getByText('Segunda a Sexta').first().click();
        await page.locator('#name').fill('João Silva');
        await page.locator('#phone').fill('11999887766');
        await page.locator('#submitBtn').click();
        
        // Wait for success
        await page.waitForTimeout(2000);
        await expect(page.locator('#successContainer')).toBeVisible();
        
        // Click reset
        await page.getByText('Fazer Novo Agendamento').click();
        
        // Should be back to step 1
        await expect(page.locator('#formContainer')).toBeVisible();
        await expect(page.locator('#step1')).toBeVisible();
        await expect(page.locator('#successContainer')).toBeHidden();
        
        // Fields should be empty
        expect(await page.locator('#name').inputValue()).toBe('');
        expect(await page.locator('#phone').inputValue()).toBe('');
    });
});
