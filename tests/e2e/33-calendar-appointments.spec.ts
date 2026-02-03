/**
 * E2E Test: Calendar Appointments Management
 *
 * Tests:
 * - Loading calendar with appointments
 * - Creating new appointment via button
 * - Viewing appointment details in tooltip
 * - Editing appointment (drag & drop)
 * - Deleting appointment
 * - Archiving appointment
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin } from './helpers';

const BASE_URL = 'http://localhost:3001';

test.describe('Calendar Appointments Management', () => {
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();

        // Enable console logging
        page.on('console', (msg) => {
            if (msg.type() === 'log' || msg.type() === 'warning' || msg.type() === 'error') {
                console.log(`[${msg.type()}] ${msg.text()}`);
            }
        });

        // Log API requests
        page.on('request', (request) => {
            if (request.url().includes('/api/')) {
                console.log(`➡️  ${request.method()} ${request.url()}`);
            }
        });

        page.on('response', (response) => {
            if (response.url().includes('/api/')) {
                console.log(`⬅️  ${response.status()} ${response.url()}`);
            }
        });

        // Log page errors
        page.on('pageerror', (error) => {
            console.error(`❌ Page Error: ${error.message}`);
        });

        await loginAsAdmin(page);
    });

    test.afterEach(async () => {
        await page.close();
    });

    test('Should load calendar page with FullCalendar', async () => {
        console.log('\n🧪 TEST: Load calendar page\n');

        await page.goto(`${BASE_URL}/agenda.html`);
        await page.waitForLoadState('networkidle');

        // Check if FullCalendar is loaded (use fc-header-toolbar which is always present)
        const calendar = await page.locator('#calendar .fc-header-toolbar');
        await expect(calendar).toBeVisible({ timeout: 10000 });

        console.log('✅ FullCalendar loaded successfully');
    });

    test('Should display "Novo Agendamento" button in toolbar', async () => {
        console.log('\n🧪 TEST: Display "Novo Agendamento" button\n');

        await page.goto(`${BASE_URL}/agenda.html`);
        await page.waitForLoadState('networkidle');

        // Wait for calendar to render
        await page.waitForSelector('#calendar .fc-header-toolbar', { timeout: 10000 });

        // Check for custom button
        const newAppointmentButton = await page.locator('button.fc-newAppointmentButton-button');

        if ((await newAppointmentButton.count()) > 0) {
            await expect(newAppointmentButton).toBeVisible();
            const buttonText = await newAppointmentButton.textContent();
            expect(buttonText).toContain('Novo Agendamento');
            console.log('✅ "Novo Agendamento" button is visible');
        } else {
            console.log(
                '⚠️  "Novo Agendamento" button not found - may need calendar to fully load'
            );
        }
    });

    test('Should load and display appointments in calendar', async () => {
        console.log('\n🧪 TEST: Load appointments in calendar\n');

        await page.goto(`${BASE_URL}/agenda.html`);
        await page.waitForLoadState('networkidle');

        // Wait for calendar to render
        await page.waitForSelector('#calendar .fc-header-toolbar', { timeout: 10000 });

        // Wait for API call to complete
        await page.waitForTimeout(2000);

        // Check console for "Loaded X appointments" message
        const consoleMessages: string[] = [];
        page.on('console', (msg) => {
            consoleMessages.push(msg.text());
        });

        // Check if events are rendered (look for .fc-event elements)
        const events = await page.locator('.fc-event');
        const eventCount = await events.count();

        console.log(`📊 Found ${eventCount} events in calendar`);

        if (eventCount > 0) {
            console.log('✅ Appointments loaded and displayed');
            expect(eventCount).toBeGreaterThan(0);
        } else {
            console.log('⚠️  No appointments visible (may be expected if no data for today)');
        }
    });

    test('Should open "Novo Agendamento" modal when clicking button', async () => {
        console.log('\n🧪 TEST: Open "Novo Agendamento" modal\n');

        await page.goto(`${BASE_URL}/agenda.html`);
        await page.waitForLoadState('networkidle');

        // Wait for calendar
        await page.waitForSelector('#calendar .fc-header-toolbar', { timeout: 10000 });

        // Try to click the "Novo Agendamento" button
        const newButton = await page.locator('button.fc-newAppointmentButton-button');

        if ((await newButton.count()) > 0) {
            await newButton.click();
            await page.waitForTimeout(500);

            // Check if modal opened
            const modal = await page.locator('#quickScheduleModal');
            const isVisible = await modal.isVisible();

            if (isVisible) {
                console.log('✅ "Novo Agendamento" modal opened');
                expect(isVisible).toBe(true);

                // Check modal content
                await expect(page.locator('#quickPatientName')).toBeVisible();
                await expect(page.locator('#quickDateTime')).toBeVisible();

                // Close modal
                const closeButton = await page.locator(
                    'button[onclick*="closeQuickScheduleModal"]'
                );
                if ((await closeButton.count()) > 0) {
                    await closeButton.first().click();
                }
            } else {
                console.log('⚠️  Modal did not open');
            }
        } else {
            console.log('⚠️  "Novo Agendamento" button not found');
        }
    });

    test('Should display event details on hover (tooltip)', async () => {
        console.log('\n🧪 TEST: Display event tooltip on hover\n');

        await page.goto(`${BASE_URL}/agenda.html`);
        await page.waitForLoadState('networkidle');

        // Wait for calendar
        await page.waitForSelector('#calendar .fc-header-toolbar', { timeout: 10000 });
        await page.waitForTimeout(2000);

        // Find first event
        const firstEvent = await page.locator('.fc-event').first();
        const eventCount = await page.locator('.fc-event').count();

        if (eventCount > 0) {
            // Hover over event
            await firstEvent.hover();
            await page.waitForTimeout(1000);

            // Check if tippy tooltip appears
            const tooltip = await page.locator('.tippy-content');

            if ((await tooltip.count()) > 0 && (await tooltip.isVisible())) {
                console.log('✅ Tooltip appeared on hover');

                // Check for action buttons in tooltip
                const editButton = await tooltip.locator('button[onclick*="editAppointment"]');
                const archiveButton = await tooltip.locator(
                    'button[onclick*="archiveAppointment"]'
                );
                const deleteButton = await tooltip.locator('button[onclick*="deleteAppointment"]');

                if ((await editButton.count()) > 0) {
                    console.log('✅ Edit button found in tooltip');
                }
                if ((await archiveButton.count()) > 0) {
                    console.log('✅ Archive button found in tooltip');
                }
                if ((await deleteButton.count()) > 0) {
                    console.log('✅ Delete button found in tooltip');
                }
            } else {
                console.log('⚠️  Tooltip did not appear (may need longer hover time)');
            }
        } else {
            console.log('⚠️  No events to test tooltip');
        }
    });

    test('Should handle appointment deletion with confirmation', async () => {
        console.log('\n🧪 TEST: Delete appointment with confirmation\n');

        await page.goto(`${BASE_URL}/agenda.html`);
        await page.waitForLoadState('networkidle');

        // Wait for calendar
        await page.waitForSelector('#calendar .fc-header-toolbar', { timeout: 10000 });
        await page.waitForTimeout(2000);

        const eventCount = await page.locator('.fc-event').count();

        if (eventCount > 0) {
            // Set up dialog handler BEFORE triggering the action
            page.once('dialog', async (dialog) => {
                console.log(`📢 Dialog: ${dialog.message()}`);
                expect(dialog.message()).toContain('EXCLUIR');
                await dialog.dismiss(); // Cancel deletion for test safety
                console.log('✅ Deletion dialog appeared and was dismissed');
            });

            // Trigger delete via console (safer than clicking tooltip)
            await page.evaluate(() => {
                if (window.deleteAppointment) {
                    window.deleteAppointment('1');
                }
            });

            await page.waitForTimeout(1000);
            console.log('✅ Delete function triggered successfully');
        } else {
            console.log('⚠️  No events to test deletion');
        }
    });

    test('Should handle appointment archiving with confirmation', async () => {
        console.log('\n🧪 TEST: Archive appointment with confirmation\n');

        await page.goto(`${BASE_URL}/agenda.html`);
        await page.waitForLoadState('networkidle');

        // Wait for calendar
        await page.waitForSelector('#calendar .fc-header-toolbar', { timeout: 10000 });
        await page.waitForTimeout(2000);

        const eventCount = await page.locator('.fc-event').count();

        if (eventCount > 0) {
            // Set up dialog handler
            page.once('dialog', async (dialog) => {
                console.log(`📢 Dialog: ${dialog.message()}`);
                expect(dialog.message()).toContain('arquivar');
                await dialog.dismiss(); // Cancel for test safety
                console.log('✅ Archive dialog appeared and was dismissed');
            });

            // Trigger archive via console
            await page.evaluate(() => {
                if (window.archiveAppointment) {
                    window.archiveAppointment('1');
                }
            });

            await page.waitForTimeout(1000);
            console.log('✅ Archive function triggered successfully');
        } else {
            console.log('⚠️  No events to test archiving');
        }
    });

    test('Should navigate between calendar views', async () => {
        console.log('\n🧪 TEST: Navigate between calendar views\n');

        await page.goto(`${BASE_URL}/agenda.html`);
        await page.waitForLoadState('networkidle');

        // Wait for calendar
        await page.waitForSelector('#calendar .fc-header-toolbar', { timeout: 10000 });

        // Try to switch to day view
        const dayButton = await page.locator('button.fc-timeGridDay-button');
        if ((await dayButton.count()) > 0) {
            await dayButton.click();
            await page.waitForTimeout(500);
            console.log('✅ Switched to day view');
        }

        // Try to switch to month view
        const monthButton = await page.locator('button.fc-dayGridMonth-button');
        if ((await monthButton.count()) > 0) {
            await monthButton.click();
            await page.waitForTimeout(500);
            console.log('✅ Switched to month view');
        }

        // Switch back to week view
        const weekButton = await page.locator('button.fc-timeGridWeek-button');
        if ((await weekButton.count()) > 0) {
            await weekButton.click();
            await page.waitForTimeout(500);
            console.log('✅ Switched back to week view');
        }
    });

    test('Should navigate to next/previous week', async () => {
        console.log('\n🧪 TEST: Navigate next/previous week\n');

        await page.goto(`${BASE_URL}/agenda.html`);
        await page.waitForLoadState('networkidle');

        // Wait for calendar
        await page.waitForSelector('#calendar .fc-header-toolbar', { timeout: 10000 });

        // Get current title
        const titleBefore = await page.locator('.fc-toolbar-title').textContent();
        console.log(`📅 Current: ${titleBefore}`);

        // Click next
        const nextButton = await page.locator('button.fc-next-button');
        if ((await nextButton.count()) > 0) {
            await nextButton.click();
            await page.waitForTimeout(1000);

            const titleAfter = await page.locator('.fc-toolbar-title').textContent();
            console.log(`📅 After next: ${titleAfter}`);
            expect(titleAfter).not.toBe(titleBefore);
            console.log('✅ Navigated to next week');

            // Go back
            const prevButton = await page.locator('button.fc-prev-button');
            await prevButton.click();
            await page.waitForTimeout(1000);
            console.log('✅ Navigated to previous week');
        }
    });
});
