/**
 * Test environment configuration
 * Centralizes all environment variables used in tests
 */

export const testEnvironment = {
  // RabbitMQ configuration
  rabbitmq: {
    url: process.env.TEST_RABBITMQ_URL || '',
    defaultTimeout: 150000,
  },
  
  // Database configuration
  database: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    name: process.env.TEST_DB_NAME || 'test_db',
    user: process.env.TEST_DB_USER || 'test_user',
    password: process.env.TEST_DB_PASSWORD || 'test_password',
  },
  
  // Test execution configuration
  test: {
    globalTimeout: 120000,
    defaultWaitTimeout: 5000,
    cleanupTimeout: 30000,
  },
  
  // Service URLs
  services: {
    subscriptionServer: process.env.TEST_SUBSCRIPTION_SERVER_URL || 'http://localhost:3000',
    logicSystem: process.env.TEST_LOGIC_SYSTEM_URL || 'http://localhost:3001',
  }
};