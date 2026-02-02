import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'child_process';
import * as path from 'path';

/**
 * Playwright E2E Testing Configuration
 * Tests critical user flows: Public Scheduling, Login, and Admin Kanban
 * Uses isolated test database to prevent production data corruption
 */
export default defineConfig({
    testDir: './tests/e2e',

    /* Maximum time one test can run for */
    timeout: 30 * 1000,

    /* Global setup: Create test database before all tests */
    globalSetup: require.resolve('./tests/e2e/global-setup.ts'),

    /* Global teardown: Optional cleanup after all tests */
    globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),

    /* Run tests in files in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Opt out of parallel tests on CI */
    workers: process.env.CI ? 1 : undefined,

    /* Reporter to use */
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['list'],
        ['json', { outputFile: 'test-results/results.json' }],
    ],

    /* Shared settings for all the projects below */
    use: {
        /* Base URL to use in actions like `await page.goto('/')` */
        baseURL: 'http://localhost:3001',

        /* Collect trace when retrying the failed test */
        trace: 'on-first-retry',

        /* Screenshot on failure */
        screenshot: 'only-on-failure',

        /* Video on failure */
        video: 'retain-on-failure',

        /* Maximum time each action can take */
        actionTimeout: 10 * 1000,

        /* Headless by default, set to false for debugging */
        headless: true,
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },

        // Uncomment to test on other browsers
        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] },
        // },

        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        // },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'bash scripts/start-test-server.sh',
        url: 'http://localhost:3001',
        reuseExistingServer: !process.env.CI, // Use existing server in development
        timeout: 120 * 1000,
        stdout: 'pipe',
        stderr: 'pipe',
    },
});

// NOTE: O globalSetup roda ANTES do webServer
