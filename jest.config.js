/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    testPathIgnorePatterns: ['<rootDir>/tests/e2e/', '<rootDir>/node_modules/'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/server.ts',
        '!src/**/*.interface.ts',
        '!src/**/*.type.ts',
        '!src/**/*.backup.ts',
        '!src/**/*.refactored.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json'],
    // Threshold aplicado apenas quando rodar todos os testes
    // Para testes individuais, use --no-coverage ou remova --coverage
    // TODO: Gradually increase to 50% as more tests are added
    // NOTE: Adjusted after refactoring and cleanup
    coverageThreshold: {
        global: {
            branches: 12,
            functions: 19,
            lines: 18,
            statements: 18,
        },
    },
    moduleFileExtensions: ['ts', 'js', 'json'],
    verbose: true,
    testTimeout: 15000,
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    globals: {
        'ts-jest': {
            isolatedModules: true,
            tsconfig: {
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
            },
        },
    },
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    // Run tests sequentially to avoid SQLite database lock issues
    maxWorkers: 1,
};
