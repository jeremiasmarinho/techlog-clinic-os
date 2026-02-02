/**
 * Playwright Global Setup
 *
 * NOTE: Database setup is now done in scripts/start-test-server.sh
 * which runs BEFORE the server starts.
 *
 * This file is kept for any additional global setup that needs to happen
 * after the server is ready.
 */

async function globalSetup() {
    console.log('\n🚀 E2E Tests Starting...\n');
    console.log('📝 Database is set up by start-test-server.sh\n');

    // Set environment variables for reference
    process.env.TEST_MODE = 'true';
    process.env.TEST_DB_PATH = '/tmp/database.test.sqlite';
}

export default globalSetup;
