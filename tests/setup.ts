// Test setup file
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.ACCESS_TOKEN = 'test-access-token';
process.env.ADMIN_USER = 'admin@test.com';
process.env.ADMIN_PASS = '$2b$10$test.hash.for.testing.purposes.only';

// Increase timeout for database operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn() as any,
  error: jest.fn() as any,
  warn: jest.fn() as any,
  info: jest.fn() as any,
  debug: jest.fn() as any,
} as Console;
