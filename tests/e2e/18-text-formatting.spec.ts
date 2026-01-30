/**
 * E2E Test: Text Formatting in Patient Table
 * 
 * Validates that Type and Status columns display properly formatted text:
 * - Removes underscores/hyphens
 * - Capitalizes words
 * - Examples: 'primeira_consulta' → 'Primeira Consulta', 'em_atendimento' → 'Em Atendimento'
 */

import { test, expect, Page } from '@playwright/test';
import { CREDENTIALS, loginAsAdmin } from './helpers';

test.describe('Patient Table Text Formatting', () => {
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            if (msg.type() === 'log' || msg.type() === 'warning') {
                console.log(`console: ${msg.type()} ${msg.text()}`);
            }
        });
        
        await loginAsAdmin(page);
    });

    test.afterEach(async () => {
        await page.close();
    });

    test('Tipo e Status devem ser formatados sem underscores', async () => {
        // Navigate to patients page
        await page.goto('http://localhost:3001/patients.html');
        
        // Wait for patients to load
        await page.waitForSelector('#patientsTableBody tr', { timeout: 10000 });
        
        // Get all patient rows
        const rows = await page.$$('#patientsTableBody tr');
        
        console.log(`\n📝 Testing ${rows.length} patient rows for text formatting...\n`);
        
        let underscoreViolations = 0;
        let capitalCaseViolations = 0;
        let totalTypeValidations = 0;
        let totalStatusValidations = 0;
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            // Extract patient data from row
            const nameCell = await row.$('td:nth-child(1)');
            const typeCell = await row.$('td:nth-child(3)');
            const statusCell = await row.$('td:nth-child(4)');
            
            if (!nameCell || !typeCell || !statusCell) continue;
            
            const name = await nameCell.textContent();
            const typeText = await typeCell.textContent();
            const statusHTML = await statusCell.innerHTML();
            
            // Extract status from first badge
            const statusMatch = statusHTML.match(/rounded-full[^>]*>\s*([^<]+)\s*</);
            const statusText = statusMatch ? statusMatch[1].trim() : '';
            
            // VALIDATION 1: No underscores in Type or Status
            totalTypeValidations++;
            totalStatusValidations++;
            
            if (typeText && typeText.includes('_')) {
                underscoreViolations++;
                console.log(`❌ UNDERSCORE in TYPE: "${typeText}" (Patient: ${name?.trim()})`);
            }
            
            if (statusText && statusText.includes('_')) {
                underscoreViolations++;
                console.log(`❌ UNDERSCORE in STATUS: "${statusText}" (Patient: ${name?.trim()})`);
            }
            
            // VALIDATION 2: First letter of each word should be capitalized
            const typeWords = typeText ? typeText.split(' ') : [];
            const statusWords = statusText ? statusText.split(' ') : [];
            
            for (const word of typeWords) {
                if (word.length > 0 && word[0] !== word[0].toUpperCase() && word !== '📋') {
                    capitalCaseViolations++;
                    console.log(`❌ NOT CAPITALIZED in TYPE: "${word}" in "${typeText}" (Patient: ${name?.trim()})`);
                }
            }
            
            for (const word of statusWords) {
                if (word.length > 0 && word[0] !== word[0].toUpperCase()) {
                    capitalCaseViolations++;
                    console.log(`❌ NOT CAPITALIZED in STATUS: "${word}" in "${statusText}" (Patient: ${name?.trim()})`);
                }
            }
            
            // Log valid formatting
            if (!typeText.includes('_') && !statusText.includes('_')) {
                console.log(`✅ VALID: Patient "${name?.trim()}" → Type: "${typeText}", Status: "${statusText}"`);
            }
        }
        
        console.log(`\n📊 Text Formatting Summary:`);
        console.log(`   Type Validations: ${totalTypeValidations}`);
        console.log(`   Status Validations: ${totalStatusValidations}`);
        console.log(`   Underscore Violations: ${underscoreViolations}`);
        console.log(`   Capitalization Violations: ${capitalCaseViolations}`);
        console.log(`   Total Violations: ${underscoreViolations + capitalCaseViolations}\n`);
        
        // Test should pass only if NO violations found
        expect(underscoreViolations).toBe(0);
        expect(capitalCaseViolations).toBe(0);
    });

    test('Tipos complexos devem mostrar especialidade com ícone', async () => {
        await page.goto('http://localhost:3001/patients.html');
        await page.waitForSelector('#patientsTableBody tr', { timeout: 10000 });
        
        const rows = await page.$$('#patientsTableBody tr');
        
        console.log(`\n🔍 Testing ${rows.length} rows for complex consultation types...\n`);
        
        let complexTypesFound = 0;
        
        for (const row of rows) {
            const typeCell = await row.$('td:nth-child(3)');
            if (!typeCell) continue;
            
            const typeText = await typeCell.textContent();
            
            // Check if it's a detailed consultation type with icon
            if (typeText && typeText.includes('📋')) {
                complexTypesFound++;
                
                const nameCell = await row.$('td:nth-child(1)');
                const name = nameCell ? await nameCell.textContent() : 'Unknown';
                
                console.log(`✅ Complex Type Found: "${typeText}" (Patient: ${name?.trim()})`);
                
                // Should NOT contain full "Consulta - X - Y - Z" format
                expect(typeText).not.toContain(' - ');
            }
        }
        
        console.log(`\n📋 Complex Types Summary:`);
        console.log(`   Total Complex Types: ${complexTypesFound}\n`);
        
        // Test passes regardless of how many complex types exist
        expect(true).toBe(true);
    });

    test('Status com múltiplas palavras devem estar formatados', async () => {
        await page.goto('http://localhost:3001/patients.html');
        await page.waitForSelector('#patientsTableBody tr', { timeout: 10000 });
        
        const rows = await page.$$('#patientsTableBody tr');
        
        console.log(`\n🎯 Testing ${rows.length} rows for multi-word status formatting...\n`);
        
        const multiWordStatuses = [];
        
        for (const row of rows) {
            const statusCell = await row.$('td:nth-child(4)');
            if (!statusCell) continue;
            
            const statusHTML = await statusCell.innerHTML();
            const statusMatch = statusHTML.match(/rounded-full[^>]*>\s*([^<]+)\s*</);
            const statusText = statusMatch ? statusMatch[1].trim() : '';
            
            if (statusText && statusText.includes(' ')) {
                const nameCell = await row.$('td:nth-child(1)');
                const name = nameCell ? await nameCell.textContent() : 'Unknown';
                
                multiWordStatuses.push({ name: name?.trim(), status: statusText });
                
                // Should be "Em Atendimento", not "em_atendimento" or "em atendimento"
                if (statusText.toLowerCase() === 'em atendimento') {
                    const isCorrectlyFormatted = statusText === 'Em Atendimento';
                    console.log(`${isCorrectlyFormatted ? '✅' : '❌'} Status: "${statusText}" (Patient: ${name?.trim()})`);
                    
                    expect(isCorrectlyFormatted).toBe(true);
                }
            }
        }
        
        console.log(`\n📝 Multi-Word Status Summary:`);
        console.log(`   Total Multi-Word Statuses: ${multiWordStatuses.length}\n`);
        
        multiWordStatuses.forEach(item => {
            console.log(`   - ${item.name}: "${item.status}"`);
        });
    });

    test('Formato de telefone deve estar correto', async () => {
        await page.goto('http://localhost:3001/patients.html');
        await page.waitForSelector('#patientsTableBody tr', { timeout: 10000 });
        
        const rows = await page.$$('#patientsTableBody tr');
        
        console.log(`\n📞 Testing ${rows.length} rows for phone formatting...\n`);
        
        let validPhones = 0;
        let invalidPhones = 0;
        
        for (const row of rows) {
            const phoneCell = await row.$('td:nth-child(2)');
            if (!phoneCell) continue;
            
            const phoneText = await phoneCell.textContent();
            const phone = phoneText?.trim();
            
            if (!phone || phone === '-') continue;
            
            // Expected format: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
            const phonePattern = /^\(\d{2}\) \d{4,5}-\d{4}$/;
            
            const nameCell = await row.$('td:nth-child(1)');
            const name = nameCell ? await nameCell.textContent() : 'Unknown';
            
            if (phonePattern.test(phone)) {
                validPhones++;
                console.log(`✅ Valid Phone: "${phone}" (Patient: ${name?.trim()})`);
            } else {
                invalidPhones++;
                console.log(`❌ Invalid Phone: "${phone}" (Patient: ${name?.trim()})`);
            }
        }
        
        console.log(`\n📊 Phone Formatting Summary:`);
        console.log(`   Valid Phones: ${validPhones}`);
        console.log(`   Invalid Phones: ${invalidPhones}\n`);
        
        expect(invalidPhones).toBe(0);
    });
});
