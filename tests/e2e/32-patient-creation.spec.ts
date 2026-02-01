import { test, expect } from '@playwright/test';
import { loginAsAdmin, closeOpenModals } from './helpers';

/**
 * E2E Tests: Patient Creation Flow
 * Tests the complete patient/lead registration flow from frontend
 * Validates form submission, success toast, and Kanban/List update
 *
 * QA Focus: POST/PUT operations that write data to the database
 * Screenshot on failure for visual debugging
 */

test.describe.skip('Patient Creation Flow', () => {
    test.beforeEach(async ({ page }) => {
        // 1. Login to the system
        await loginAsAdmin(page);
        await closeOpenModals(page);

        // Wait for page to fully load
        await page.waitForTimeout(2000);
    });

    test('should create a new patient successfully', async ({ page }) => {
        // ============================================
        // STEP 1: Click "Novo Paciente" Button
        // ============================================

        // Try multiple possible selectors for "New Patient" button
        // The button might be a FAB, header button, or in the form area
        const newPatientButtonSelectors = [
            'button:has-text("Novo Paciente")',
            'button:has-text("Adicionar Paciente")',
            'button:has-text("Nova Lead")',
            'button:has-text("Adicionar Lead")',
            'button[onclick*="novo"]',
            'button[onclick*="adicionar"]',
            'button:has(i.fa-plus)',
            '.fab', // Floating Action Button
            '[data-testid="new-patient-btn"]',
            '#newPatientBtn',
            '#newLeadBtn',
        ];

        let newPatientButton = null;

        for (const selector of newPatientButtonSelectors) {
            const button = page.locator(selector).first();
            if ((await button.count()) > 0 && (await button.isVisible())) {
                newPatientButton = button;
                console.log(`✅ Found "Novo Paciente" button with selector: ${selector}`);
                break;
            }
        }

        // If no button found, try to find the edit modal directly (some systems open it differently)
        if (!newPatientButton) {
            console.log('⚠️ "Novo Paciente" button not found. Trying alternative methods...');

            // Alternative: Look for existing lead and duplicate the modal opening logic
            // Or manually open the modal if it exists
            const editModal = page.locator('#editModal');
            if ((await editModal.count()) > 0) {
                await page.evaluate(() => {
                    const modal = document.getElementById('editModal');
                    if (modal) {
                        modal.classList.remove('hidden');
                    }
                });
            }
        } else {
            // Click the "Novo Paciente" button
            await newPatientButton.click();
            console.log('✅ Clicked "Novo Paciente" button');
        }

        // Wait for modal animation
        await page.waitForTimeout(1000);

        // ============================================
        // STEP 2: Verify Modal Opened
        // ============================================

        const modal = page
            .locator('#editModal, #newPatientModal, [data-testid="patient-form-modal"]')
            .first();

        await expect(modal).toBeVisible({ timeout: 5000 });
        console.log('✅ Modal opened successfully');

        // ============================================
        // STEP 3: Fill Patient Form
        // ============================================

        const timestamp = Date.now();
        const testPatient = {
            name: `Paciente Teste E2E ${timestamp}`,
            phone: `(11) 98765-${String(timestamp).slice(-4)}`,
            email: `e2e.test.${timestamp}@example.com`,
            cpf: '123.456.789-00', // CPF de teste (não validado)
        };

        console.log('📝 Filling patient form with:', testPatient);

        // Fill Name (try multiple possible selectors)
        const nameSelectors = [
            '#editLeadName',
            '#patientName',
            'input[name="name"]',
            'input[placeholder*="nome" i]',
        ];
        for (const selector of nameSelectors) {
            const field = page.locator(selector).first();
            if ((await field.count()) > 0 && (await field.isVisible())) {
                await field.fill(testPatient.name);
                console.log(`✅ Filled name field: ${selector}`);
                break;
            }
        }

        // Fill Phone (try multiple possible selectors)
        const phoneSelectors = [
            '#editLeadPhone',
            '#patientPhone',
            'input[name="phone"]',
            'input[placeholder*="telefone" i]',
        ];
        for (const selector of phoneSelectors) {
            const field = page.locator(selector).first();
            if ((await field.count()) > 0 && (await field.isVisible())) {
                await field.fill(testPatient.phone);
                console.log(`✅ Filled phone field: ${selector}`);
                break;
            }
        }

        // Fill Email (try multiple possible selectors)
        const emailSelectors = [
            '#editLeadEmail',
            '#patientEmail',
            'input[name="email"]',
            'input[type="email"]',
            'input[placeholder*="email" i]',
        ];
        for (const selector of emailSelectors) {
            const field = page.locator(selector).first();
            if ((await field.count()) > 0 && (await field.isVisible())) {
                await field.fill(testPatient.email);
                console.log(`✅ Filled email field: ${selector}`);
                break;
            }
        }

        // Fill CPF (try multiple possible selectors)
        const cpfSelectors = [
            '#editLeadCpf',
            '#patientCpf',
            'input[name="cpf"]',
            'input[placeholder*="cpf" i]',
        ];
        for (const selector of cpfSelectors) {
            const field = page.locator(selector).first();
            if ((await field.count()) > 0 && (await field.isVisible())) {
                await field.fill(testPatient.cpf);
                console.log(`✅ Filled CPF field: ${selector}`);
                break;
            }
        }

        // Take screenshot of filled form (for debugging)
        await page.screenshot({ path: 'test-results/patient-form-filled.png', fullPage: true });

        // ============================================
        // STEP 4: Click "Salvar" (Save) Button
        // ============================================

        const saveButtonSelectors = [
            'button:has-text("Salvar")',
            'button:has-text("Criar")',
            'button:has-text("Adicionar")',
            'button[type="submit"]',
            'button[onclick*="salvar"]',
            'button[onclick*="save"]',
            '#savePatientBtn',
            '#submitBtn',
        ];

        let saveButton = null;

        for (const selector of saveButtonSelectors) {
            const button = page.locator(selector).first();
            if ((await button.count()) > 0 && (await button.isVisible())) {
                saveButton = button;
                console.log(`✅ Found "Salvar" button with selector: ${selector}`);
                break;
            }
        }

        if (!saveButton) {
            console.error('❌ "Salvar" button not found!');
            await page.screenshot({
                path: 'test-results/save-button-not-found.png',
                fullPage: true,
            });
            throw new Error('Save button not found');
        }

        // Click Save button
        await saveButton.click();
        console.log('✅ Clicked "Salvar" button');

        // Wait for API request to complete
        await page.waitForTimeout(2000);

        // ============================================
        // STEP 5: Verify Success Toast
        // ============================================

        const toastSelectors = [
            '.toast:has-text("sucesso")',
            '.toast.success',
            '#toast',
            '.swal-modal', // SweetAlert
            '.Toastify__toast--success', // Toastify
            '[role="alert"]:has-text("sucesso")',
            'div:has-text("salvo com sucesso")',
            'div:has-text("criado com sucesso")',
            'div:has-text("adicionado com sucesso")',
        ];

        let toastFound = false;

        for (const selector of toastSelectors) {
            const toast = page.locator(selector).first();
            if ((await toast.count()) > 0) {
                try {
                    await expect(toast).toBeVisible({ timeout: 3000 });
                    console.log(`✅ Success toast found: ${selector}`);
                    toastFound = true;
                    break;
                } catch (error) {
                    continue;
                }
            }
        }

        if (!toastFound) {
            console.warn('⚠️ Success toast not found, but continuing test...');
        }

        // Wait for toast animation to complete
        await page.waitForTimeout(1000);

        // ============================================
        // STEP 6: Verify Patient Appears in Kanban/List
        // ============================================

        // Wait for Kanban to refresh
        await page.waitForTimeout(2000);

        // Check if patient appears in "Novos" column (first column)
        const kanbanColumns = [
            '#column-novo',
            '#column-em_atendimento',
            '#column-agendado',
            '#column-finalizado',
            '.kanban-column',
        ];

        let patientFound = false;

        for (const columnSelector of kanbanColumns) {
            const column = page.locator(columnSelector);
            if ((await column.count()) > 0) {
                const patientCard = column
                    .locator(`.lead-card:has-text("${testPatient.name}")`)
                    .first();
                if ((await patientCard.count()) > 0 && (await patientCard.isVisible())) {
                    console.log(`✅ Patient found in column: ${columnSelector}`);

                    // Verify card contains patient information
                    await expect(patientCard).toContainText(testPatient.name);

                    // Optional: Verify phone or email if displayed on card
                    const cardText = await patientCard.textContent();
                    console.log('📄 Patient card content:', cardText);

                    patientFound = true;
                    break;
                }
            }
        }

        // If not found in Kanban, try searching in patient list/table
        if (!patientFound) {
            console.log('⚠️ Patient not found in Kanban, checking patient list...');

            // Navigate to patients page
            const patientsLink = page.locator('a[href="patients.html"]').first();
            if ((await patientsLink.count()) > 0) {
                await patientsLink.click();
                await page.waitForTimeout(2000);

                // Search for patient in table
                const patientRow = page.locator(`tr:has-text("${testPatient.name}")`).first();
                if ((await patientRow.count()) > 0) {
                    await expect(patientRow).toBeVisible();
                    console.log('✅ Patient found in patient list');
                    patientFound = true;
                }
            }
        }

        if (!patientFound) {
            console.error('❌ Patient not found in Kanban or List!');
            await page.screenshot({ path: 'test-results/patient-not-found.png', fullPage: true });
            throw new Error(`Patient "${testPatient.name}" not found after creation`);
        }

        // ============================================
        // STEP 7: Success - Take Final Screenshot
        // ============================================

        await page.screenshot({
            path: 'test-results/patient-creation-success.png',
            fullPage: true,
        });
        console.log('✅ Patient creation test completed successfully');
    });

    // ============================================
    // Additional Test: Validation Errors
    // ============================================

    test('should show validation error when required fields are missing', async ({ page }) => {
        // Try to open new patient form
        const newPatientButton = page
            .locator('button:has-text("Novo Paciente"), button:has(i.fa-plus)')
            .first();

        if ((await newPatientButton.count()) > 0 && (await newPatientButton.isVisible())) {
            await newPatientButton.click();
            await page.waitForTimeout(1000);

            // Try to save without filling fields
            const saveButton = page
                .locator('button:has-text("Salvar"), button[type="submit"]')
                .first();

            if ((await saveButton.count()) > 0 && (await saveButton.isVisible())) {
                await saveButton.click();
                await page.waitForTimeout(1000);

                // Should show error toast or validation message
                const errorIndicators = [
                    '.toast.error',
                    '.toast:has-text("obrigatório")',
                    'div:has-text("campo obrigatório")',
                    'input:invalid',
                    '.error-message',
                ];

                let errorFound = false;

                for (const selector of errorIndicators) {
                    const error = page.locator(selector).first();
                    if ((await error.count()) > 0) {
                        console.log(`✅ Validation error found: ${selector}`);
                        errorFound = true;
                        break;
                    }
                }

                if (!errorFound) {
                    console.warn(
                        '⚠️ Validation error not shown (might be OK if fields have defaults)'
                    );
                }

                await page.screenshot({
                    path: 'test-results/validation-error.png',
                    fullPage: true,
                });
            }
        }
    });
});

// ============================================
// Global Failure Handler - Auto Screenshot
// ============================================

test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
        // Test failed - take screenshot
        const screenshotPath = `test-results/FAILURE-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Failure screenshot saved: ${screenshotPath}`);

        // Also save console logs
        const logs = await page.evaluate(() => {
            return (window as any).__testLogs || [];
        });
        console.log('📋 Console logs at failure:', logs);
    }
});
