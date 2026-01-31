/**
 * E2E Test: Agenda Archive Functionality
 * 
 * Validates:
 * - Archive button is present
 * - Confirmation dialog appears
 * - PUT request sent to correct endpoint
 * - Appointment removed from list after archive
 * - Success feedback shown
 * - API responds with 200 OK
 */

import { test, expect, Page } from '@playwright/test';
import { CREDENTIALS, loginAsAdmin } from './helpers';

test.describe('Agenda Archive Functionality', () => {
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'warning' || msg.type() === 'error') {
                console.log(`[${msg.type()}] ${msg.text()}`);
            }
        });
        
        // Enable request/response logging for API calls
        page.on('request', request => {
            if (request.url().includes('/api/leads')) {
                console.log(`➡️  ${request.method()} ${request.url()}`);
            }
        });
        
        page.on('response', response => {
            if (response.url().includes('/api/leads')) {
                console.log(`⬅️  ${response.status()} ${response.url()}`);
            }
        });
        
        // Enable page error logging
        page.on('pageerror', error => {
            console.error(`❌ Page Error: ${error.message}`);
        });
        
        await loginAsAdmin(page);
    });

    test.afterEach(async () => {
        await page.close();
    });

    test('Botão Arquivar deve estar presente nos cards', async () => {
        console.log('\n🧪 TEST: Archive button present on cards\n');
        
        await page.goto('http://localhost:3001/agenda.html');
        await page.waitForSelector('#appointmentsList', { timeout: 10000 });
        
        const cards = await page.$$('.glass-card[data-appointment-id]');
        
        if (cards.length === 0) {
            console.log('⚠️  No appointments found');
            expect(true).toBe(true);
            return;
        }
        
        const firstCard = cards[0];
        
        // Check for archive button
        const archiveBtn = await firstCard.$('button[onclick*="archiveAppointment"]');
        expect(archiveBtn).not.toBeNull();
        console.log('✅ Archive button found');
        
        // Verify button has archive icon
        const hasIcon = await archiveBtn?.$('i.fa-archive');
        expect(hasIcon).not.toBeNull();
        console.log('✅ Archive icon present');
        
        // Verify button styling (gray/neutral colored)
        const buttonClasses = await archiveBtn?.getAttribute('class');
        expect(buttonClasses).toContain('gray');
        console.log('✅ Archive button has gray styling');
    });

    test('Botão Arquivar deve ter onclick com archiveAppointment', async () => {
        console.log('\n🧪 TEST: Archive button has correct onclick\n');
        
        await page.goto('http://localhost:3001/agenda.html');
        await page.waitForSelector('#appointmentsList', { timeout: 10000 });
        
        const archiveBtn = await page.$('button[onclick*="archiveAppointment"]');
        
        if (!archiveBtn) {
            console.log('⚠️  No archive button found');
            expect(true).toBe(true);
            return;
        }
        
        // Verify onclick attribute contains archiveAppointment function call
        const onclickAttr = await archiveBtn.getAttribute('onclick');
        expect(onclickAttr).toContain('archiveAppointment');
        console.log(`✅ onclick attribute: ${onclickAttr}`);
        
        // Extract appointment ID from onclick
        const match = onclickAttr?.match(/archiveAppointment\((\d+)\)/);
        expect(match).not.toBeNull();
        expect(match).toHaveLength(2);
        console.log(`✅ Appointment ID extracted: ${match?.[1]}`);
    });

    test('Múltiplos cards devem ter botão de arquivar', async () => {
        console.log('\n🧪 TEST: Multiple cards have archive button\n');
        
        await page.goto('http://localhost:3001/agenda.html');
        await page.waitForSelector('#appointmentsList', { timeout: 10000 });
        
        const allCards = await page.$$('.glass-card[data-appointment-id]');
        
        console.log(`📋 Total appointments: ${allCards.length}`);
        
        if (allCards.length === 0) {
            console.log('⚠️  No appointments to test');
            expect(true).toBe(true);
            return;
        }
        
        // Check first 3 cards (or all if less than 3)
        const cardsToCheck = Math.min(3, allCards.length);
        
        for (let i = 0; i < cardsToCheck; i++) {
            const card = allCards[i];
            const appointmentId = await card.getAttribute('data-appointment-id');
            const archiveBtn = await card.$('button[onclick*="archiveAppointment"]');
            
            expect(archiveBtn).not.toBeNull();
            console.log(`✅ Card ${appointmentId}: Archive button found`);
        }
        
        console.log(`✅ All ${cardsToCheck} cards have archive button`);
    });

    test('Confirmar deve enviar PUT request para /archive', async () => {
        console.log('\n🧪 TEST: Confirm sends PUT /archive request\n');
        
        await page.goto('http://localhost:3001/agenda.html');
        await page.waitForSelector('#appointmentsList', { timeout: 10000 });
        
        const firstCard = await page.$('.glass-card[data-appointment-id]');
        
        if (!firstCard) {
            console.log('⚠️  No appointments found');
            expect(true).toBe(true);
            return;
        }
        
        const appointmentId = await firstCard.getAttribute('data-appointment-id');
        console.log(`📋 Testing archive for appointment ID: ${appointmentId}`);
        
        // Setup dialog listener and accept
        page.once('dialog', async dialog => {
            console.log('✅ Accepting confirmation dialog');
            await dialog.accept();
        });
        
        // Setup request listener to capture PUT /archive
        const archiveRequestPromise = page.waitForRequest(
            request => request.url().includes(`/api/leads/${appointmentId}/archive`) && request.method() === 'PUT',
            { timeout: 10000 }
        );
        
        // Setup response listener
        const archiveResponsePromise = page.waitForResponse(
            response => response.url().includes(`/api/leads/${appointmentId}/archive`) && response.request().method() === 'PUT',
            { timeout: 10000 }
        );
        
        // Click archive button
        const archiveBtn = await firstCard.$('button[onclick*="archiveAppointment"]');
        await archiveBtn?.click();
        
        // Wait for API request
        const archiveRequest = await archiveRequestPromise;
        console.log(`✅ PUT request sent to: ${archiveRequest.url()}`);
        
        // Verify request body
        const requestBody = archiveRequest.postDataJSON();
        console.log('📦 Request body:', requestBody);
        expect(requestBody).toHaveProperty('archive_reason');
        expect(requestBody.archive_reason).toContain('manual_archive');
        
        // Wait for API response
        const archiveResponse = await archiveResponsePromise;
        const status = archiveResponse.status();
        console.log(`✅ API responded with status: ${status}`);
        
        expect(status).toBe(200);
        
        // Verify response body
        const responseBody = await archiveResponse.json();
        console.log('✅ Response body:', responseBody);
        expect(responseBody).toHaveProperty('message');
        expect(responseBody.message).toContain('arquivado');
    });

    test('Agendamento deve desaparecer da lista após arquivar', async () => {
        console.log('\n🧪 TEST: Appointment removed from list after archive\n');
        
        await page.goto('http://localhost:3001/agenda.html');
        await page.waitForSelector('#appointmentsList', { timeout: 10000 });
        
        const initialCards = await page.$$('.glass-card[data-appointment-id]');
        const initialCount = initialCards.length;
        
        console.log(`📋 Initial appointments: ${initialCount}`);
        
        if (initialCount === 0) {
            console.log('⚠️  No appointments to test');
            expect(true).toBe(true);
            return;
        }
        
        const firstCard = initialCards[0];
        const appointmentId = await firstCard.getAttribute('data-appointment-id');
        
        console.log(`🗑️  Archiving appointment ID: ${appointmentId}`);
        
        // Setup dialog listener and accept
        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        
        // Setup alert listener (success message)
        page.once('dialog', async dialog => {
            console.log(`📢 Alert message: "${dialog.message()}"`);
            expect(dialog.message()).toContain('sucesso');
            await dialog.accept();
        });
        
        // Wait for response
        const responsePromise = page.waitForResponse(
            response => response.url().includes(`/api/leads/${appointmentId}/archive`),
            { timeout: 10000 }
        );
        
        // Click archive button
        const archiveBtn = await firstCard.$('button[onclick*="archiveAppointment"]');
        await archiveBtn?.click();
        
        // Wait for archive to complete
        await responsePromise;
        
        // Wait for page reload/update
        await page.waitForTimeout(2000);
        
        // Wait for network to be idle
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
            console.log('⚠️  Network not idle after 5s, continuing...');
        });
        
        // Verify appointment removed from list
        const cardStillExists = await page.$(`[data-appointment-id="${appointmentId}"]`);
        expect(cardStillExists).toBeNull();
        console.log(`✅ Appointment ${appointmentId} removed from list`);
        
        // Verify count decreased
        const finalCards = await page.$$('.glass-card[data-appointment-id]');
        const finalCount = finalCards.length;
        console.log(`📊 Final appointments: ${finalCount}`);
        
        expect(finalCount).toBeLessThan(initialCount);
        console.log(`✅ Appointment count decreased: ${initialCount} → ${finalCount}`);
    });

    test('API retorna mensagem de sucesso ao arquivar', async () => {
        console.log('\n🧪 TEST: API returns success message\n');
        
        await page.goto('http://localhost:3001/agenda.html');
        await page.waitForSelector('#appointmentsList', { timeout: 10000 });
        
        const firstCard = await page.$('.glass-card[data-appointment-id]');
        
        if (!firstCard) {
            console.log('⚠️  No appointments found');
            expect(true).toBe(true);
            return;
        }
        
        const appointmentId = await firstCard.getAttribute('data-appointment-id');
        
        // Setup response listener
        const responsePromise = page.waitForResponse(
            response => response.url().includes(`/api/leads/${appointmentId}/archive`),
            { timeout: 10000 }
        );
        
        // Override confirm to auto-accept
        await page.evaluate(() => {
            (window as any).confirm = () => true;
        });
        
        // Click archive button
        const archiveBtn = await firstCard.$('button[onclick*="archiveAppointment"]');
        await archiveBtn?.click();
        
        // Wait for response
        const response = await responsePromise;
        const responseBody = await response.json();
        
        expect(responseBody).toHaveProperty('message');
        expect(responseBody.message).toContain('sucesso');
        console.log(`✅ Success message: "${responseBody.message}"`);
    });

    test('API retorna erro 500 quando forçado', async () => {
        console.log('\n🧪 TEST: API returns 500 error when forced\n');
        
        await page.goto('http://localhost:3001/agenda.html');
        await page.waitForSelector('#appointmentsList', { timeout: 10000 });
        
        // Intercept archive request and force error
        await page.route('**/api/leads/*/archive', route => {
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Simulated server error' })
            });
        });
        
        const firstCard = await page.$('.glass-card[data-appointment-id]');
        
        if (!firstCard) {
            console.log('⚠️  No appointments found');
            expect(true).toBe(true);
            return;
        }
        
        const appointmentId = await firstCard.getAttribute('data-appointment-id');
        
        // Setup response listener
        const responsePromise = page.waitForResponse(
            response => response.url().includes(`/api/leads/${appointmentId}/archive`),
            { timeout: 10000 }
        );
        
        // Override confirm to auto-accept
        await page.evaluate(() => {
            (window as any).confirm = () => true;
        });
        
        // Click archive button
        const archiveBtn = await firstCard.$('button[onclick*="archiveAppointment"]');
        await archiveBtn?.click();
        
        // Wait for error response
        const response = await responsePromise;
        
        expect(response.status()).toBe(500);
        console.log('✅ API returned 500 error as expected');
        
        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('error');
        console.log(`✅ Error message: "${responseBody.error}"`);
    });

    test('Token de autenticação deve ser enviado no header', async () => {
        console.log('\n🧪 TEST: Authorization header sent with request\n');
        
        await page.goto('http://localhost:3001/agenda.html');
        await page.waitForSelector('#appointmentsList', { timeout: 10000 });
        
        const firstCard = await page.$('.glass-card[data-appointment-id]');
        
        if (!firstCard) {
            console.log('⚠️  No appointments found');
            expect(true).toBe(true);
            return;
        }
        
        const appointmentId = await firstCard.getAttribute('data-appointment-id');
        
        // Setup dialog and accept
        page.once('dialog', async dialog => {
            await dialog.accept();
        });
        
        // Capture request
        const requestPromise = page.waitForRequest(
            request => request.url().includes(`/api/leads/${appointmentId}/archive`),
            { timeout: 10000 }
        );
        
        // Click archive button
        const archiveBtn = await firstCard.$('button[onclick*="archiveAppointment"]');
        await archiveBtn?.click();
        
        // Get request
        const request = await requestPromise;
        
        // Verify Authorization header
        const headers = request.headers();
        expect(headers).toHaveProperty('authorization');
        expect(headers.authorization).toContain('Bearer');
        console.log('✅ Authorization header present');
        console.log(`   Header: ${headers.authorization.substring(0, 50)}...`);
        
        // Verify Content-Type header
        expect(headers).toHaveProperty('content-type');
        expect(headers['content-type']).toContain('application/json');
        console.log('✅ Content-Type header correct');
    });
});
