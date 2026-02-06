/**
 * ============================================
 * TESTES FUNCIONAIS - MÓDULOS FRONTEND (TypeScript)
 * Valida que todos os arquivos .ts existem e seguem padrões
 * ============================================
 */
import { describe, test, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Frontend TypeScript Modules - Validation', () => {
    const baseDir = process.cwd();

    const allTsFiles = [
        // Types
        'public/js/types/models.ts',
        // Utils
        'public/js/utils/string-utils.ts',
        'public/js/utils/currency-utils.ts',
        'public/js/utils/date-utils.ts',
        'public/js/utils/formatters.ts',
        'public/js/utils/masks.ts',
        'public/js/utils/clinic-config.ts',
        // Services
        'public/js/services/api-service.ts',
        'public/js/services/cache-service.ts',
        'public/js/services/notification-service.ts',
        'public/js/services/clinic-service.ts',
        'public/js/services/appointments-service.ts',
        // Components
        'public/js/components/clinic-header.ts',
        'public/js/components/sidebar.ts',
        'public/js/components/confirmation-modal.ts',
        'public/js/components/dashboard-kpi.ts',
        'public/js/components/kanban-column.ts',
        'public/js/components/lead-card.ts',
        'public/js/components/patient-row.ts',
        'public/js/components/metrics-calculator.ts',
        'public/js/components/metrics-renderer.ts',
        'public/js/components/date-range-picker.ts',
        // CRM Modules
        'public/js/crm/modules/dashboard-api.ts',
        'public/js/crm/modules/dashboard-charts.ts',
        'public/js/crm/modules/dashboard-reports.ts',
        'public/js/crm/modules/kanban-api.ts',
        'public/js/crm/modules/kanban-card.ts',
        'public/js/crm/modules/kanban-drag-drop.ts',
        'public/js/crm/modules/kanban-utils.ts',
        'public/js/crm/modules/patients-api.ts',
        'public/js/crm/modules/patients-filter.ts',
        'public/js/crm/modules/patients-render.ts',
        'public/js/crm/modules/patients-utils.ts',
        // CRM Pages
        'public/js/crm/api.ts',
        'public/js/crm/auth.ts',
        'public/js/crm/login.ts',
        'public/js/crm/admin.ts',
        'public/js/crm/agenda.ts',
        'public/js/crm/agenda-slots.ts',
        'public/js/crm/calendar.ts',
        'public/js/crm/dashboard.ts',
        'public/js/crm/dialogs.ts',
        'public/js/crm/kanban.ts',
        'public/js/crm/patients.ts',
        'public/js/crm/settings.ts',
        'public/js/crm/whatsapp-templates.ts',
        // Root pages
        'public/js/admin-dashboard.ts',
        'public/js/kanban.ts',
        'public/js/theme-manager.ts',
        // SaaS
        'public/js/saas/admin.ts',
        'public/js/saas/clinics.ts',
        // Site
        'public/js/site/main.ts',
        'public/js/site/agendar.ts',
        // Chat
        'public/js/chat/widget.ts',
    ];

    test('todos os 53 arquivos .ts do frontend devem existir', () => {
        const missing: string[] = [];

        allTsFiles.forEach((file) => {
            const filePath = path.join(baseDir, file);
            if (!fs.existsSync(filePath)) {
                missing.push(file);
            }
        });

        expect(missing).toEqual([]);
        expect(allTsFiles.length).toBe(54);
    });

    test('arquivos de utils devem exportar funções', () => {
        const utilFiles = [
            'public/js/utils/string-utils.ts',
            'public/js/utils/currency-utils.ts',
            'public/js/utils/date-utils.ts',
            'public/js/utils/formatters.ts',
        ];

        utilFiles.forEach((file) => {
            const filePath = path.join(baseDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            expect(content).toMatch(/export\s+(function|const)/);
        });
    });

    test('arquivos de utils não devem importar services ou components', () => {
        const utilFiles = [
            'public/js/utils/string-utils.ts',
            'public/js/utils/date-utils.ts',
            'public/js/utils/formatters.ts',
        ];

        utilFiles.forEach((file) => {
            const filePath = path.join(baseDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            expect(content).not.toContain("from '../services");
            expect(content).not.toContain("from '../components");
        });
    });

    test('arquivos .ts devem ter tipagem TypeScript', () => {
        const filesToCheck = [
            'public/js/utils/string-utils.ts',
            'public/js/services/cache-service.ts',
            'public/js/components/metrics-calculator.ts',
        ];

        filesToCheck.forEach((file) => {
            const filePath = path.join(baseDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            // Deve conter anotações de tipo TS (: string, : number, etc)
            expect(content).toMatch(
                /:\s*(string|number|boolean|void|null|undefined|Promise|Record|HTMLElement)/
            );
        });
    });

    test('build do frontend deve ter sido executado (public/dist/ existe)', () => {
        const distDir = path.join(baseDir, 'public/dist');
        expect(fs.existsSync(distDir)).toBe(true);

        // Deve ter arquivos compilados
        const files = fs.readdirSync(distDir, { recursive: true }) as string[];
        const jsFiles = files.filter((f) => String(f).endsWith('.js'));
        expect(jsFiles.length).toBeGreaterThan(0);
    });
});
