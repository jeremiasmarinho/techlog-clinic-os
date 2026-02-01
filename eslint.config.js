const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
    {
        ignores: [
            'node_modules/',
            'dist/',
            'coverage/',
            'playwright-report/',
            '*.d.ts',
            'public/',
            'scripts/**/*.ts', // Exclude all scripts
            'tests/**/*.ts', // Exclude all tests (they have separate linting)
        ],
    },
    {
        files: ['src/**/*.ts'], // Only lint src/ directory
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                project: './tsconfig.json',
            },
            globals: {
                node: true,
                es6: true,
                jest: true,
            },
        },
        plugins: {
            '@typescript-eslint': typescriptEslint,
        },
        rules: {
            // Desabilitar regras muito restritivas para facilitar migração gradual
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-floating-promises': 'warn',
            '@typescript-eslint/no-misused-promises': 'warn',
            '@typescript-eslint/no-unsafe-assignment': 'warn',
            '@typescript-eslint/no-unsafe-member-access': 'warn',
            '@typescript-eslint/no-unsafe-call': 'warn',
            '@typescript-eslint/no-unsafe-return': 'warn',
            '@typescript-eslint/no-unsafe-argument': 'warn',
            '@typescript-eslint/restrict-template-expressions': 'warn',

            // Boas práticas mantidas
            'no-console': 'off', // Permitir console.log em backend
            'prefer-const': 'error',
            'no-var': 'error',
        },
    },
];
