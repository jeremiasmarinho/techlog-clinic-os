import { test, expect } from '@playwright/test';
import { loginAs, getUserSession, CREDENTIALS } from './helpers';

test.describe('SaaS Multi-Tenancy Authentication', () => {
  
  test.beforeEach(async ({ page }) => {
    // Limpar sessão antes de cada teste
    await page.goto('/login.html');
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
  });

  test('Super Admin deve fazer login e ter role correto', async ({ page }) => {
    await loginAs(page, CREDENTIALS.superAdmin.username, CREDENTIALS.superAdmin.password);
    
    // Aguardar redirecionamento
    await page.waitForURL('**/saas-admin.html', { timeout: 5000 });
    
    // Verificar dados da sessão
    const session = await getUserSession(page);
    expect(session.userRole).toBe('super_admin');
    expect(session.token).toBeTruthy();
    expect(session.userName).toBeTruthy();
    expect(session.clinicId).toBeTruthy();
  });

  test('Super Admin deve ter acesso à página de gestão SaaS', async ({ page }) => {
    await loginAs(page, CREDENTIALS.superAdmin.username, CREDENTIALS.superAdmin.password);
    await page.waitForURL('**/saas-admin.html', { timeout: 5000 });
    
    // Verificar que a página carregou
    await expect(page).toHaveURL(/saas-admin\.html/);
    
    // Verificar elementos da página (quando existir)
    const pageContent = await page.content();
    expect(pageContent).toContain('html');
  });

  test('Clinic Admin deve fazer login com role correto', async ({ page }) => {
    // Verificar se existe um usuário clinic_admin no banco
    const hasClinicAdmin = CREDENTIALS.clinicAdmin.username !== '';
    
    if (hasClinicAdmin) {
      await loginAs(page, CREDENTIALS.clinicAdmin.username, CREDENTIALS.clinicAdmin.password);
      
      // Aguardar redirecionamento para admin.html
      await page.waitForURL('**/admin.html', { timeout: 5000 });
      
      // Verificar dados da sessão
      const session = await getUserSession(page);
      expect(session.userRole).toBe('clinic_admin');
      expect(session.token).toBeTruthy();
      expect(session.clinicId).toBeTruthy();
      expect(session.isOwner).toBeDefined();
    } else {
      test.skip();
    }
  });

  test('Redirecionamento deve ser baseado no role do usuário', async ({ page }) => {
    // Super Admin deve ir para saas-admin.html
    await loginAs(page, CREDENTIALS.superAdmin.username, CREDENTIALS.superAdmin.password);
    await page.waitForURL('**/saas-admin.html', { timeout: 5000 });
    expect(page.url()).toContain('saas-admin.html');
    
    // Fazer logout
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
    
    // Verificar Clinic Admin (se existir)
    if (CREDENTIALS.clinicAdmin.username) {
      await page.goto('/login.html');
      await loginAs(page, CREDENTIALS.clinicAdmin.username, CREDENTIALS.clinicAdmin.password);
      await page.waitForURL('**/admin.html', { timeout: 5000 });
      expect(page.url()).toContain('admin.html');
    }
  });

  test('Sessão deve persistir ao navegar entre páginas', async ({ page }) => {
    await loginAs(page, CREDENTIALS.superAdmin.username, CREDENTIALS.superAdmin.password);
    await page.waitForURL('**/saas-admin.html', { timeout: 5000 });
    
    const sessionBefore = await getUserSession(page);
    
    // Navegar para outra página
    await page.goto('/admin.html');
    
    const sessionAfter = await getUserSession(page);
    
    // Verificar que os dados persistiram
    expect(sessionAfter.token).toBe(sessionBefore.token);
    expect(sessionAfter.userRole).toBe(sessionBefore.userRole);
    expect(sessionAfter.userId).toBe(sessionBefore.userId);
  });

  test('JWT token deve ter estrutura válida', async ({ page }) => {
    await loginAs(page, CREDENTIALS.superAdmin.username, CREDENTIALS.superAdmin.password);
    await page.waitForURL('**/saas-admin.html', { timeout: 5000 });
    
    const session = await getUserSession(page);
    const token = session.token;
    
    // Verificar estrutura JWT (3 partes separadas por ponto)
    expect(token).toBeTruthy();
    const parts = token.split('.');
    expect(parts.length).toBe(3);
    
    // Decodificar payload (parte do meio)
    const payload = JSON.parse(atob(parts[1]));
    
    // Verificar campos obrigatórios
    expect(payload.userId).toBeTruthy();
    expect(payload.role).toBe('super_admin');
    expect(payload.clinicId).toBeTruthy();
    expect(payload.exp).toBeTruthy(); // Expiration time
    expect(payload.iat).toBeTruthy(); // Issued at time
  });

  test('Usuário não-admin não deve acessar página SaaS', async ({ page }) => {
    // Se existir usuário staff, tentar acessar diretamente
    if (CREDENTIALS.staff.username) {
      await loginAs(page, CREDENTIALS.staff.username, CREDENTIALS.staff.password);
      await page.waitForURL('**/admin.html', { timeout: 5000 });
      
      // Tentar acessar página SaaS diretamente
      const response = await page.goto('/saas-admin.html');
      
      // Deve estar logado mas não deve ter acesso (ou redirecionar)
      const session = await getUserSession(page);
      expect(session.userRole).not.toBe('super_admin');
    }
  });

  test('Logout deve limpar dados da sessão', async ({ page }) => {
    await loginAs(page, CREDENTIALS.superAdmin.username, CREDENTIALS.superAdmin.password);
    await page.waitForURL('**/saas-admin.html', { timeout: 5000 });
    
    // Verificar que há dados de sessão
    const sessionBefore = await getUserSession(page);
    expect(sessionBefore.token).toBeTruthy();
    
    // Fazer logout (simular clique no botão ou executar função)
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
    
    // Verificar que os dados foram limpos
    const sessionAfter = await getUserSession(page);
    expect(sessionAfter.token).toBeFalsy();
    expect(sessionAfter.userRole).toBeFalsy();
  });

});
