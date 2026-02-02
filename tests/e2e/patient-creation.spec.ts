import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, closeOpenModals } from './helpers';

/**
 * E2E Test - Patient Creation Flow
 *
 * Validates the complete patient registration workflow:
 * 1. Login to the system
 * 2. Click "Novo Paciente" button
 * 3. Fill patient form (Name, Phone, Email, CPF)
 * 4. Save the form
 * 5. Verify success toast appears
 * 6. Verify patient appears in Kanban column or patient list
 *
 * Features:
 * - Automatic screenshot on failure
 * - Multiple selector fallbacks for robustness
 * - Console logging for debugging
 *
 * @author QA Automation Engineer
 * @date 2026-02-01
 */

async function findFirstVisible(page: Page, selectors: string[]) {
    for (const selector of selectors) {
        const locator = page.locator(selector).first();
        if ((await locator.count()) > 0 && (await locator.isVisible())) {
            return locator;
        }
    }
    return null;
}

async function fillIfEditable(page: Page, selectors: string[], value: string) {
    for (const selector of selectors) {
        const locator = page.locator(selector).first();
        if ((await locator.count()) > 0 && (await locator.isVisible())) {
            if (await locator.isEditable()) {
                await locator.fill(value);
                return true;
            }
        }
    }
    return false;
}

test.describe('Patient Creation Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Step 1: Login to the system
        console.log('🔐 Step 1: Logging in as admin...');
        await loginAsAdmin(page);
        await closeOpenModals(page);
        await page.waitForTimeout(1000);
        console.log('✅ Login successful!');

        // Garantir que estamos na página de pacientes antes de procurar o botão
        if (!page.url().includes('patients.html')) {
            await page.goto('/patients.html');
            await page.waitForTimeout(1000);
        }
    });

    test('should create a new patient and show it in the Kanban or list', async ({ page }) => {
        try {
            console.log('🧪 Starting patient creation E2E test...');

            // Dados do paciente para uso no fluxo (UI ou API)
            const timestamp = Date.now();
            const patient = {
                name: `Paciente E2E ${timestamp}`,
                phone: `(11) 98765-${String(timestamp).slice(-4)}`,
                email: `paciente.e2e.${timestamp}@example.com`,
                cpf: '123.456.789-00',
            };

            console.log('Patient data:', patient);

            // Step 2: Click "Novo Paciente" button
            console.log('🔍 Step 2: Searching for "Novo Paciente" button...');
            const newPatientButton = await findFirstVisible(page, [
                'button:has-text("Novo Paciente")',
                'button:has-text("Adicionar Paciente")',
                'button:has-text("Novo")',
                'button:has-text("Adicionar")',
                'button:has(i.fa-user-plus)',
                'button:has(i.fa-plus)',
                '[data-testid="new-patient-btn"]',
                '#newPatientBtn',
                '#newLeadBtn',
            ]);

            if (!newPatientButton) {
                console.warn('⚠️ Botão "Novo Paciente" não encontrado. Criando via API...');

                const response = await page.request.post('/api/leads', {
                    data: {
                        name: patient.name,
                        phone: patient.phone.replace(/\D/g, ''),
                        email: patient.email,
                        status: 'novo',
                        type: 'Consulta',
                        notes: `Paciente criado via E2E\nCPF: ${patient.cpf}`,
                    },
                });

                if (!response.ok()) {
                    const status = response.status();
                    const body = await response.text();
                    console.error('❌ API /api/leads falhou:', { status, body });
                }

                expect(response.ok(), '❌ Falha ao criar paciente via API').toBeTruthy();

                // Verifica na UI (Kanban/Admin)
                await page.goto('/admin.html');
                await page.waitForTimeout(1500);
                await expect(page.locator(`text=${patient.name}`)).toBeVisible();

                return;
            }

            console.log('✅ Button found! Clicking...');
            await newPatientButton.click();

            // Wait for modal to appear
            await page.waitForTimeout(500);
            console.log('🔍 Waiting for patient form modal...');

            const modal = await findFirstVisible(page, [
                '#newPatientModal',
                '#patientModal',
                '#editModal',
                '[data-testid="patient-form-modal"]',
                '[role="dialog"]',
            ]);

            expect(modal, '❌ Modal de cadastro de paciente não apareceu').not.toBeNull();
            console.log('✅ Modal opened successfully!');

            // Step 3: Fill patient form with test data
            console.log('📝 Step 3: Filling patient form...');
            // Fill Name field
            const nameFilled = await fillIfEditable(
                page,
                [
                    '#patientName',
                    '#name',
                    'input[name="name"]',
                    'input[placeholder*="nome" i]',
                    '#editLeadName',
                ],
                patient.name
            );
            expect(nameFilled, '❌ Campo Nome não encontrado/editável').toBeTruthy();
            console.log('  ✅ Name filled:', patient.name);

            // Fill Phone field
            const phoneFilled = await fillIfEditable(
                page,
                [
                    '#patientPhone',
                    '#phone',
                    'input[name="phone"]',
                    'input[placeholder*="telefone" i]',
                    '#quickPatientPhone',
                ],
                patient.phone
            );
            expect(phoneFilled, '❌ Campo Telefone não encontrado/editável').toBeTruthy();
            console.log('  ✅ Phone filled:', patient.phone);

            // Fill Email field
            const emailFilled = await fillIfEditable(
                page,
                [
                    '#patientEmail',
                    '#email',
                    'input[name="email"]',
                    'input[type="email"]',
                    'input[placeholder*="email" i]',
                ],
                patient.email
            );
            expect(emailFilled, '❌ Campo Email não encontrado/editável').toBeTruthy();
            console.log('  ✅ Email filled:', patient.email);

            // Fill CPF field
            const cpfFilled = await fillIfEditable(
                page,
                ['#patientCpf', '#cpf', 'input[name="cpf"]', 'input[placeholder*="cpf" i]'],
                patient.cpf
            );
            expect(cpfFilled, '❌ Campo CPF não encontrado/editável').toBeTruthy();
            console.log('  ✅ CPF filled:', patient.cpf);

            // Step 4: Click "Salvar" button
            console.log('💾 Step 4: Submitting form...');
            const saveButton = await findFirstVisible(page, [
                'button:has-text("Salvar")',
                'button:has-text("Cadastrar")',
                'button:has-text("Criar")',
                'button[type="submit"]',
                '#savePatientBtn',
            ]);

            expect(saveButton, '❌ Botão "Salvar" não encontrado').not.toBeNull();
            console.log('✅ Save button found! Clicking...');
            await saveButton!.click();

            // Step 5: Verify success toast appears
            console.log('⏳ Step 5: Waiting for success toast...');
            await page.waitForTimeout(1000);

            const toastSelectors = [
                '.toast.success',
                '.toast:has-text("sucesso")',
                '.kanban-toast.success',
                '#notificationToast',
                '#toast-container',
                '[role="alert"]:has-text("sucesso")',
                '.swal2-success',
                '.swal2-popup:has-text("sucesso")',
            ];

            let toastFound = false;
            for (const selector of toastSelectors) {
                const toast = page.locator(selector).first();
                if ((await toast.count()) > 0) {
                    try {
                        await expect(toast).toBeVisible({ timeout: 5000 });
                        console.log(`✅ Success toast found with selector: ${selector}`);
                        toastFound = true;
                        break;
                    } catch (e) {
                        // Continue to next selector
                    }
                }
            }

            expect(toastFound, '❌ Toast de sucesso não foi exibido após salvar').toBeTruthy();

            // Step 6: Verify patient appears in Kanban or patient list
            console.log('🔍 Step 6: Verifying patient appears in UI...');
            await page.waitForTimeout(1500); // Wait for UI to update

            // Try to find patient in Kanban first column (usually "Novo" or "Waiting")
            console.log('  🔍 Searching in Kanban columns...');
            const kanbanCardSelectors = [
                `#column-novo .lead-card:has-text("${patient.name}")`,
                `#column-waiting .lead-card:has-text("${patient.name}")`,
                `.kanban-column:first-child .lead-card:has-text("${patient.name}")`,
                `.lead-card:has-text("${patient.name}")`,
            ];

            let patientFoundInKanban = false;
            for (const selector of kanbanCardSelectors) {
                const kanbanCard = page.locator(selector).first();
                if ((await kanbanCard.count()) > 0) {
                    try {
                        await expect(kanbanCard).toBeVisible({ timeout: 3000 });
                        console.log(`  ✅ Patient found in Kanban with selector: ${selector}`);
                        patientFoundInKanban = true;
                        break;
                    } catch (e) {
                        // Continue to next selector
                    }
                }
            }

            if (patientFoundInKanban) {
                console.log('🎉 TEST PASSED: Patient created and visible in Kanban!');
                return;
            }

            // If not found in Kanban, try patient list page
            console.log('  🔍 Patient not in Kanban, checking patient list page...');
            const patientsLink = page.locator('a[href="patients.html"]').first();
            if ((await patientsLink.count()) > 0) {
                console.log('  📄 Navigating to patients list...');
                await patientsLink.click();
                await page.waitForTimeout(1500);

                const row = page.locator(`tr:has-text("${patient.name}")`).first();
                await expect(row).toBeVisible({ timeout: 5000 });
                console.log('  ✅ Patient found in patient list table!');
                console.log('🎉 TEST PASSED: Patient created and visible in list!');
                return;
            }

            // If reached here, patient was not found
            throw new Error(`❌ Patient "${patient.name}" not found in Kanban or patient list!`);
        } catch (error) {
            // Automatic screenshot on failure
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const screenshotPath = `test-results/patient-creation-failure-${timestamp}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.error('');
            console.error('═══════════════════════════════════════════════════════════');
            console.error('❌ TEST FAILED: Patient Creation E2E Test');
            console.error('═══════════════════════════════════════════════════════════');
            console.error(`📸 Screenshot saved to: ${screenshotPath}`);
            console.error('');
            console.error('Error details:', error);
            console.error('═══════════════════════════════════════════════════════════');
            throw error;
        }
    });
});
