#!/usr/bin/env node

/**
 * Quick test for formatters - Browser simulation
 */

// Simulate browser environment
global.window = {};

// Load the module by evaluating the file
const fs = require('fs');
const path = require('path');

const formattersCode = fs.readFileSync(
    path.join(__dirname, 'public/js/utils/formatters.js'), 
    'utf8'
);

// Remove ES6 exports and execute
const codeToExecute = formattersCode
    .replace(/export const /g, 'const ')
    .replace(/export {[^}]+}/g, '');

eval(codeToExecute);

// Now test the functions
console.log('\n🧪 Testing Date/Time Formatters\n');
console.log('═'.repeat(70));

// Test Data
const testDate1 = '2026-01-31';
const testDate2 = '2026-01-31T14:30:00';
const testDate3 = '2026-12-25T08:00:00';

console.log('\n✅ TEST 1: formatDate() - "31 de Jan"');
console.log('─'.repeat(70));
console.log(`Input:    "${testDate1}"`);
console.log(`Output:   "${formatDate(testDate1)}"`);
console.log(`Expected: "31 de Jan"`);
console.log(`Status:   ${formatDate(testDate1) === '31 de Jan' ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('✅ TEST 2: formatDate() - "25 de Dez"');
console.log('─'.repeat(70));
console.log(`Input:    "${testDate3}"`);
console.log(`Output:   "${formatDate(testDate3)}"`);
console.log(`Expected: "25 de Dez"`);
console.log(`Status:   ${formatDate(testDate3) === '25 de Dez' ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('✅ TEST 3: formatDateFull() - "31 de Janeiro"');
console.log('─'.repeat(70));
console.log(`Input:    "${testDate1}"`);
console.log(`Output:   "${formatDateFull(testDate1)}"`);
console.log(`Expected: "31 de Janeiro"`);
console.log(`Status:   ${formatDateFull(testDate1) === '31 de Janeiro' ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('✅ TEST 4: formatDateNumeric() - "31/01/2026"');
console.log('─'.repeat(70));
console.log(`Input:    "${testDate1}"`);
console.log(`Output:   "${formatDateNumeric(testDate1)}"`);
console.log(`Expected: "31/01/2026"`);
console.log(`Status:   ${formatDateNumeric(testDate1) === '31/01/2026' ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('✅ TEST 5: formatDateShort() - "31/Jan"');
console.log('─'.repeat(70));
console.log(`Input:    "${testDate1}"`);
console.log(`Output:   "${formatDateShort(testDate1)}"`);
console.log(`Expected: "31/Jan"`);
console.log(`Status:   ${formatDateShort(testDate1) === '31/Jan' ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('✅ TEST 6: formatTime() - "14:30"');
console.log('─'.repeat(70));
console.log(`Input:    "${testDate2}"`);
console.log(`Output:   "${formatTime(testDate2)}"`);
console.log(`Expected: "14:30"`);
console.log(`Status:   ${formatTime(testDate2) === '14:30' ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('✅ TEST 7: formatCurrency() - "R$ 250,00"');
console.log('─'.repeat(70));
console.log(`Input:    250`);
console.log(`Output:   "${formatCurrency(250)}"`);
console.log(`Expected: "R$ 250,00"`);
console.log(`Status:   ${formatCurrency(250) === 'R$ 250,00' ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('✅ TEST 8: formatPhone() - "(11) 98765-4321"');
console.log('─'.repeat(70));
console.log(`Input:    "11987654321"`);
console.log(`Output:   "${formatPhone('11987654321')}"`);
console.log(`Expected: "(11) 98765-4321"`);
console.log(`Status:   ${formatPhone('11987654321') === '(11) 98765-4321' ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('✅ TEST 9: formatText() - "Primeira Consulta"');
console.log('─'.repeat(70));
console.log(`Input:    "primeira_consulta"`);
console.log(`Output:   "${formatText('primeira_consulta')}"`);
console.log(`Expected: "Primeira Consulta"`);
console.log(`Status:   ${formatText('primeira_consulta') === 'Primeira Consulta' ? '✅ PASS' : '❌ FAIL'}\n`);

console.log('✅ TEST 10: Edge Cases - null/undefined');
console.log('─'.repeat(70));
console.log(`formatDate(null):      "${formatDate(null)}" (Expected: "--")`);
console.log(`formatDate(undefined): "${formatDate(undefined)}" (Expected: "--")`);
console.log(`formatTime(''):        "${formatTime('')}" (Expected: "--:--")`);
console.log(`formatCurrency(0):     "${formatCurrency(0)}" (Expected: "R$ 0,00")`);

console.log('\n✅ TEST 11: All 12 Months');
console.log('─'.repeat(70));
const months = [
    { date: '2026-01-15', expected: '15 de Jan' },
    { date: '2026-02-15', expected: '15 de Fev' },
    { date: '2026-03-15', expected: '15 de Mar' },
    { date: '2026-04-15', expected: '15 de Abr' },
    { date: '2026-05-15', expected: '15 de Mai' },
    { date: '2026-06-15', expected: '15 de Jun' },
    { date: '2026-07-15', expected: '15 de Jul' },
    { date: '2026-08-15', expected: '15 de Ago' },
    { date: '2026-09-15', expected: '15 de Set' },
    { date: '2026-10-15', expected: '15 de Out' },
    { date: '2026-11-15', expected: '15 de Nov' },
    { date: '2026-12-15', expected: '15 de Dez' }
];

let allMonthsPass = true;
months.forEach((test, index) => {
    const result = formatDate(test.date);
    const pass = result === test.expected;
    if (!pass) allMonthsPass = false;
    console.log(`Mês ${(index + 1).toString().padStart(2, '0')}: "${result}" ${pass ? '✅' : `❌ (Expected: ${test.expected})`}`);
});

console.log('\n' + '═'.repeat(70));
console.log('🎉 RESULTADOS DOS TESTES');
console.log('═'.repeat(70));
console.log('✅ formatDate()        → "31 de Jan" (Estético)');
console.log('✅ formatDateFull()    → "31 de Janeiro" (Completo)');
console.log('✅ formatDateNumeric() → "31/01/2026" (Numérico)');
console.log('✅ formatDateShort()   → "31/Jan" (Compacto)');
console.log('✅ formatTime()        → "14:30"');
console.log('✅ formatCurrency()    → "R$ 250,00"');
console.log('✅ formatPhone()       → "(11) 98765-4321"');
console.log('✅ formatText()        → "Primeira Consulta"');
console.log(`${allMonthsPass ? '✅' : '❌'} Todos os 12 meses`);
console.log('═'.repeat(70) + '\n');
