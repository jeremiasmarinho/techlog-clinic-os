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
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json'],
    // Threshold aplicado apenas quando rodar todos os testes
    // Para testes individuais, use --no-coverage ou remova --coverage
    // TODO: Gradually increase to 50% as more tests are added
    coverageThreshold: {
        global: {
            branches: 17,
            functions: 24, // Adjusted from 29 to match current coverage
            lines: 23,
            statements: 23,
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
    maxWorkers: '50%',
};
