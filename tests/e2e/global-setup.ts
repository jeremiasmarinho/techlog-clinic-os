/**
 * Playwright Global Setup
 * Runs once before all E2E tests
 * - Creates isolated test database
 * - Seeds with test data
 * - Ensures server is using test database
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

async function globalSetup() {
    console.log('\n🚀 Starting E2E Test Setup...\n');
    
    const testDbPath = path.join(__dirname, '..', '..', 'clinic.test.db');
    
    // Remove old test database if exists
    if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
        console.log('✅ Removed old test database');
    }
    
    // Run test database setup script directly with ts-node
    console.log('🗄️  Creating test database...');
    execSync('npx ts-node scripts/setup-test-db.ts', { 
        stdio: 'inherit', 
        cwd: path.join(__dirname, '..', '..') 
    });
    
    // Set environment variable for test database
    process.env.TEST_MODE = 'true';
    process.env.TEST_DB_PATH = testDbPath;
    
    console.log('✅ Test database created and ready');
    console.log('🔒 Server will use test database during E2E tests\n');
}

export default globalSetup;
