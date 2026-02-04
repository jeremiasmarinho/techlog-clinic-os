import { test, expect } from '@playwright/test';
import { loginAs, CREDENTIALS } from './helpers';

test.describe('Data Loading Checks', () => {
    test('Relatórios deve carregar dados', async ({ page }) => {
        page.on('console', (msg) => console.log('console:', msg.type(), msg.text()));
        page.on('pageerror', (err) => console.log('pageerror:', err.message));

        await loginAs(page, CREDENTIALS.clinicAdmin.username, CREDENTIALS.clinicAdmin.password);

        await page.goto('/relatorios.html');
        await page.waitForSelector('#weeklyReportText', { state: 'attached', timeout: 15000 });
        await expect(page.locator('#weeklyReportText')).not.toHaveText(/Carregando/);
        await expect(page.locator('#totalLeads')).toHaveText(/\d+/);
    });

    test('Agenda deve carregar agendamentos', async ({ page }) => {
        await loginAs(page, CREDENTIALS.clinicAdmin.username, CREDENTIALS.clinicAdmin.password);

        await page.goto('/agenda.html');
        // Verifica se o calendário foi carregado
        await page.waitForSelector('.fc-view', { state: 'attached', timeout: 15000 });

        // Verifica se a API de appointments foi chamada com sucesso
        const response = await page.request.get('/api/calendar/appointments', {
            headers: {
                Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`,
            },
        });
        expect(response.status()).toBe(200);
    });
});
