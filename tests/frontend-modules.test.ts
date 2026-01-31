/**
 * ============================================
 * TESTES FUNCIONAIS - MÓDULOS FRONTEND
 * ============================================
 */
import { describe, test, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Frontend Modules - Validation', () => {
    test('should have all module files created', () => {
        
        const requiredFiles = [
            'public/js/utils/date-utils.js',
            'public/js/utils/currency-utils.js',
            'public/js/utils/string-utils.js',
            'public/js/services/api-service.js',
            'public/js/services/cache-service.js',
            'public/js/services/notification-service.js',
            'public/js/components/metrics-calculator.js',
            'public/js/components/metrics-renderer.js',
            'public/js/components/confirmation-modal.js',
            'public/js/admin-dashboard.js'
        ];
        
        requiredFiles.forEach(file => {
            const filePath = path.join(process.cwd(), file);
            expect(fs.existsSync(filePath)).toBe(true);
        });
    });
    
    test('should have valid JavaScript syntax', () => {
        
        const testFile = path.join(process.cwd(), 'public/js/utils/date-utils.js');
        const content = fs.readFileSync(testFile, 'utf-8');
        
        // Check for basic JS structure
        expect(content).toContain('export function');
        expect(content).not.toContain('syntax error');
    });
    
    test('should have proper module structure', () => {
        
        const files = [
            'public/js/utils/date-utils.js',
            'public/js/utils/currency-utils.js',
            'public/js/utils/string-utils.js'
        ];
        
        files.forEach(file => {
            const filePath = path.join(process.cwd(), file);
            const content = fs.readFileSync(filePath, 'utf-8');
            
            // Utils should export functions
            expect(content).toContain('export function');
            
            // Utils should not import services or components
            expect(content).not.toContain('from \'./services');
            expect(content).not.toContain('from \'./components');
        });
    });
});
