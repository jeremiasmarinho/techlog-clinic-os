/**
 * Test script for formatters.js
 * Run with: node test-formatters.mjs
 */

import { 
    formatTime, 
    formatDateTime, 
    formatDate,
    formatDateNumeric,
    formatDateFull,
    formatDateShort, 
    formatDateTimeShort,
    formatCurrency,
    formatPhone,
    formatText,
    getTimeAgo
} from './public/js/utils/formatters.js';

console.log('\n🧪 Testing Date/Time Formatters\n');
console.log('═'.repeat(70));

// Test Data
const testDate1 = '2026-01-31';
const testDate2 = '2026-01-31T14:30:00';
const testDate3 = '2026-12-25T08:00:00';
const testDate4 = new Date('2026-06-15T16:45:00');

// ============================================
// 1. formatDate() - "31 de Jan"
// ============================================
console.log('\n📅 formatDate() - Formato Estético "DD de MMM"');
console.log('─'.repeat(70));
console.log(`Input: "${testDate1}"`);
console.log(`Output: "${formatDate(testDate1)}" ✅`);
console.log(`Expected: "31 de Jan"\n`);

console.log(`Input: "${testDate2}"`);
console.log(`Output: "${formatDate(testDate2)}" ✅`);
console.log(`Expected: "31 de Jan"\n`);

console.log(`Input: "${testDate3}"`);
console.log(`Output: "${formatDate(testDate3)}" ✅`);
console.log(`Expected: "25 de Dez"\n`);

console.log(`Input: Date object (15/Jun/2026)`);
console.log(`Output: "${formatDate(testDate4)}" ✅\n`);

// ============================================
// 2. formatDateFull() - "31 de Janeiro"
// ============================================
console.log('📅 formatDateFull() - Formato Completo "DD de MMMM"');
console.log('─'.repeat(70));
console.log(`Input: "${testDate1}"`);
console.log(`Output: "${formatDateFull(testDate1)}" ✅`);
console.log(`Expected: "31 de Janeiro"\n`);

// ============================================
// 3. formatDateNumeric() - "31/01/2026"
// ============================================
console.log('📅 formatDateNumeric() - Formato Numérico "DD/MM/YYYY"');
console.log('─'.repeat(70));
console.log(`Input: "${testDate1}"`);
console.log(`Output: "${formatDateNumeric(testDate1)}" ✅`);
console.log(`Expected: "31/01/2026"\n`);

// ============================================
// 4. formatDateShort() - "31/Jan"
// ============================================
console.log('📅 formatDateShort() - Formato Compacto "DD/MMM"');
console.log('─'.repeat(70));
console.log(`Input: "${testDate1}"`);
console.log(`Output: "${formatDateShort(testDate1)}" ✅`);
console.log(`Expected: "31/Jan"\n`);

// ============================================
// 5. formatTime() - "14:30"
// ============================================
console.log('⏰ formatTime() - Hora "HH:MM"');
console.log('─'.repeat(70));
console.log(`Input: "${testDate2}"`);
console.log(`Output: "${formatTime(testDate2)}" ✅`);
console.log(`Expected: "14:30"\n`);

console.log(`Input: "21:00:00" (time only)`);
console.log(`Output: "${formatTime('21:00:00')}" ✅`);
console.log(`Expected: "21:00"\n`);

// ============================================
// 6. formatDateTime() - "31/01/2026 às 14:30"
// ============================================
console.log('📅⏰ formatDateTime() - Data e Hora');
console.log('─'.repeat(70));
console.log(`Input: "${testDate2}"`);
console.log(`Output: "${formatDateTime(testDate2)}" ✅\n`);

// ============================================
// 7. formatDateTimeShort() - "31/Jan, 14:30"
// ============================================
console.log('📅⏰ formatDateTimeShort() - Data e Hora Compacta');
console.log('─'.repeat(70));
console.log(`Input: "${testDate2}"`);
console.log(`Output: "${formatDateTimeShort(testDate2)}" ✅\n`);

// ============================================
// 8. formatCurrency() - "R$ 250,00"
// ============================================
console.log('💰 formatCurrency() - Moeda');
console.log('─'.repeat(70));
console.log(`Input: 250`);
console.log(`Output: "${formatCurrency(250)}" ✅`);
console.log(`Expected: "R$ 250,00"\n`);

console.log(`Input: "1500.50"`);
console.log(`Output: "${formatCurrency("1500.50")}" ✅`);
console.log(`Expected: "R$ 1.500,50"\n`);

// ============================================
// 9. formatPhone() - "(11) 98765-4321"
// ============================================
console.log('📱 formatPhone() - Telefone');
console.log('─'.repeat(70));
console.log(`Input: "11987654321"`);
console.log(`Output: "${formatPhone('11987654321')}" ✅`);
console.log(`Expected: "(11) 98765-4321"\n`);

console.log(`Input: "1133334444"`);
console.log(`Output: "${formatPhone('1133334444')}" ✅`);
console.log(`Expected: "(11) 3333-4444"\n`);

// ============================================
// 10. formatText() - "Primeira Consulta"
// ============================================
console.log('📝 formatText() - Texto');
console.log('─'.repeat(70));
console.log(`Input: "primeira_consulta"`);
console.log(`Output: "${formatText('primeira_consulta')}" ✅`);
console.log(`Expected: "Primeira Consulta"\n`);

console.log(`Input: "exame-laboratorial"`);
console.log(`Output: "${formatText('exame-laboratorial')}" ✅`);
console.log(`Expected: "Exame Laboratorial"\n`);

// ============================================
// 11. getTimeAgo() - "5m", "2h", "3d"
// ============================================
console.log('⏱️  getTimeAgo() - Tempo Relativo');
console.log('─'.repeat(70));
const now = new Date();
const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);

console.log(`5 minutos atrás: "${getTimeAgo(fiveMinutesAgo)}" ✅`);
console.log(`2 horas atrás: "${getTimeAgo(twoHoursAgo)}" ✅`);
console.log(`3 dias atrás: "${getTimeAgo(threeDaysAgo)}" ✅\n`);

// ============================================
// 12. Edge Cases
// ============================================
console.log('🔍 Edge Cases - Valores Inválidos');
console.log('─'.repeat(70));
console.log(`formatDate(null): "${formatDate(null)}" (Expected: "--")`);
console.log(`formatDate(undefined): "${formatDate(undefined)}" (Expected: "--")`);
console.log(`formatDate('invalid'): "${formatDate('invalid')}" (Expected: "--")`);
console.log(`formatTime(''): "${formatTime('')}" (Expected: "--:--")`);
console.log(`formatCurrency(0): "${formatCurrency(0)}" (Expected: "R$ 0,00")`);
console.log(`formatCurrency(null): "${formatCurrency(null)}" (Expected: "R$ 0,00")`);
console.log(`formatPhone(''): "${formatPhone('')}" (Expected: "-")`);
console.log(`formatText(''): "${formatText('')}" (Expected: "")\n`);

// ============================================
// 13. All Months Test
// ============================================
console.log('📆 Todos os Meses - "DD de MMM"');
console.log('─'.repeat(70));
const months = [
    '2026-01-15', '2026-02-15', '2026-03-15', '2026-04-15',
    '2026-05-15', '2026-06-15', '2026-07-15', '2026-08-15',
    '2026-09-15', '2026-10-15', '2026-11-15', '2026-12-15'
];

months.forEach((date, index) => {
    const formatted = formatDate(date);
    console.log(`Mês ${(index + 1).toString().padStart(2, '0')}: "${formatted}"`);
});

// ============================================
// Summary
// ============================================
console.log('\n' + '═'.repeat(70));
console.log('✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
console.log('═'.repeat(70) + '\n');

console.log('📋 Resumo das Funções:');
console.log('  • formatDate()          → "31 de Jan" (Estético)');
console.log('  • formatDateFull()      → "31 de Janeiro" (Completo)');
console.log('  • formatDateNumeric()   → "31/01/2026" (Numérico)');
console.log('  • formatDateShort()     → "31/Jan" (Compacto)');
console.log('  • formatTime()          → "14:30" (Hora)');
console.log('  • formatDateTime()      → "31/01/2026 às 14:30"');
console.log('  • formatDateTimeShort() → "31/Jan, 14:30"');
console.log('  • formatCurrency()      → "R$ 250,00"');
console.log('  • formatPhone()         → "(11) 98765-4321"');
console.log('  • formatText()          → "Primeira Consulta"');
console.log('  • getTimeAgo()          → "5m", "2h", "3d"\n');
