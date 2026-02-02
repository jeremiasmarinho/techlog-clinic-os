#!/bin/bash
# Start server for E2E tests with correct environment variables

export PORT=3001
export NODE_ENV=test
export TEST_DB_PATH=/tmp/database.test.sqlite
export TEST_MODE=true

# Setup test database BEFORE starting server
echo "🔧 Setting up test database first..."
npx ts-node scripts/setup-test-db.ts

echo "🔧 Starting test server with:"
echo "   PORT=$PORT"
echo "   NODE_ENV=$NODE_ENV"
echo "   TEST_DB_PATH=$TEST_DB_PATH"

exec node dist/server.js
