import { test, expect } from '@playwright/test';
import { loginAs, CREDENTIALS } from './helpers';

test.describe('Data Loading Checks', () => {
  test('Pacientes e Relatórios devem carregar dados', async ({ page }) => {
    page.on('console', (msg) => console.log('console:', msg.type(), msg.text()));
    page.on('pageerror', (err) => console.log('pageerror:', err.message));
    page.on('request', (req) => {
      if (req.url().includes('/api/leads')) {
        console.log('request:', req.method(), req.url());
      }
    });

    await loginAs(page, CREDENTIALS.clinicAdmin.username, CREDENTIALS.clinicAdmin.password);

    const leadsResponsePromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/leads?view=all') && resp.request().method() === 'GET',
      { timeout: 15000 }
    );
    await page.goto('/patients.html');
    const hasLoadPatients = await page.evaluate(() => typeof loadPatients === 'function');
    const apiUrlValue = await page.evaluate(() => (typeof API_URL !== 'undefined' ? API_URL : null));
    console.log('loadPatients:', hasLoadPatients, 'API_URL:', apiUrlValue);
    const leadsResponse = await leadsResponsePromise;
    expect(leadsResponse.status()).toBe(200);
    const leadsData = await leadsResponse.json();
    expect(Array.isArray(leadsData)).toBeTruthy();
    expect(leadsData.length).toBeGreaterThan(0);

    await page.waitForSelector('#patientsTableBody', { state: 'attached' });
    await page.waitForFunction(() => document.querySelectorAll('#patientsTableBody tr').length > 0, null, { timeout: 15000 });

    const patientRows = await page.locator('#patientsTableBody tr').count();
    expect(patientRows).toBeGreaterThan(0);

    await page.goto('/relatorios.html');
    await page.waitForSelector('#weeklyReportText', { state: 'attached' });
    await expect(page.locator('#weeklyReportText')).not.toHaveText(/Carregando/);
    await expect(page.locator('#totalLeads')).toHaveText(/\d+/);
  });
});
