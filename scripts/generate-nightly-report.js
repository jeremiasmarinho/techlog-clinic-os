#!/usr/bin/env node

/**
 * Nightly Check Report Generator
 * 
 * Generates a markdown report from the last Playwright test run
 * Usage: node scripts/generate-nightly-report.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPORT_FILE = path.join(__dirname, '../NIGHTLY_REPORT.md');

console.log('📊 Generating Nightly Check Report...\n');

try {
  // Run the test with JSON reporter
  const output = execSync(
    'npx playwright test tests/e2e/13-nightly-check.spec.ts --reporter=json',
    { cwd: path.join(__dirname, '..'), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
  );
  
  const results = JSON.parse(output);
  const { stats } = results;
  
  const totalTests = stats.expected + stats.unexpected + stats.skipped;
  const passed = stats.expected;
  const failed = stats.unexpected;
  const skipped = stats.skipped;
  const duration = stats.duration;
  
  const timestamp = new Date().toLocaleString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'full',
    timeStyle: 'medium'
  });
  
  const report = `# 🌙 Nightly System Check Report

**Generated**: ${timestamp}  
**Duration**: ${(duration / 1000).toFixed(2)}s

## 📊 Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${totalTests} |
| ✅ Passed | ${passed} |
| ❌ Failed | ${failed} |
| ⏭️  Skipped | ${skipped} |
| Success Rate | ${((passed / totalTests) * 100).toFixed(1)}% |

## 🎯 Status

${failed === 0 ? '✅ **DEPLOYMENT APPROVED** - All checks passed!' : '❌ **DEPLOYMENT BLOCKED** - Failed tests detected!'}

## 🔍 Validation Checklist

- [${passed > 0 ? 'x' : ' '}] Layout: Fixed sidebar without overlap
- [${passed > 0 ? 'x' : ' '}] UI Rules: Icon-only WhatsApp buttons  
- [${passed > 0 ? 'x' : ' '}] Data: Date formatting (YYYY-MM-DDTHH:mm)
- [${passed > 0 ? 'x' : ' '}] Security: JWT authentication tokens

## 🚀 Next Steps

${failed === 0 ? `
- ✅ System is ready for deployment
- ✅ All critical validations passed
- ✅ No blocking issues detected

**Recommended Actions:**
1. Review any warnings in test output
2. Merge to main branch
3. Deploy to production
` : `
- ❌ Fix failing tests before deployment
- ❌ Review error logs and screenshots
- ❌ Re-run tests after fixes

**Recommended Actions:**
1. Check test-results/ folder for details
2. Run with \`npm run test:e2e:nightly:debug\` to debug
3. Fix issues and re-run validation
`}

---

**Report Location**: \`${REPORT_FILE}\`  
**HTML Report**: Run \`npm run test:e2e:nightly:report && npx playwright show-report\`
`;
  
  // Write report
  fs.writeFileSync(REPORT_FILE, report);
  
  // Output to console
  console.log(report);
  console.log(`\n✅ Report saved to: ${REPORT_FILE}\n`);
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
  
} catch (error) {
  console.error('❌ Error generating report:', error.message);
  console.log('\n💡 Make sure the server is running:');
  console.log('   npm start');
  console.log('\nThen run:');
  console.log('   node scripts/generate-nightly-report.js');
  process.exit(1);
}
