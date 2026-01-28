/// <reference types="jest" />

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
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
