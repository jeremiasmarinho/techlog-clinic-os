/**
 * Playwright Global Teardown
 * Runs once after all E2E tests
 * - Keeps test database for inspection
 * - Logs test results location
 */

import * as path from 'path';

async function globalTeardown() {
    console.log('\n✨ E2E Tests Complete!\n');

    const testDbPath = process.env.TEST_DB_PATH || path.join('/tmp', 'database.test.sqlite');

    console.log('📊 Test database preserved at:', testDbPath);
    console.log(`   Use SQLite to inspect: sqlite3 ${testDbPath}`);
    console.log('\n📁 Test results available at:');
    console.log('   - HTML Report: playwright-report/index.html');
    console.log('   - JSON Results: test-results/results.json\n');

    // Clean up environment variables
    delete process.env.TEST_MODE;
    delete process.env.TEST_DB_PATH;
}

export default globalTeardown;
