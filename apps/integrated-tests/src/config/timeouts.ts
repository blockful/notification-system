/**
 * Centralized timeout configurations for tests
 * All timeout values in milliseconds
 */

export const timeouts = {
  // Test execution timeouts
  test: {
    default: 120000,      // 2 minutes
    long: 300000,         // 5 minutes
    short: 30000,         // 30 seconds
  },
  
  // Waiting for conditions
  wait: {
    default: 5000,        // 5 seconds
    short: 1000,          // 1 second
    long: 10000,          // 10 seconds
    veryLong: 30000,      // 30 seconds
  },
  
  // Service startup/shutdown
  service: {
    startup: 30000,       // 30 seconds
    shutdown: 10000,      // 10 seconds
  },
  
  // RabbitMQ specific
  rabbitmq: {
    containerStartup: 150000,  // 2.5 minutes
    connectionRetry: 1000,     // 1 second
    maxConnectionRetries: 30,  // 30 retries
  },
  
  // Database operations
  database: {
    migration: 30000,     // 30 seconds
    cleanup: 5000,        // 5 seconds
    query: 5000,          // 5 seconds
  },
  
  // Notification delays
  notification: {
    processing: 2000,     // 2 seconds
    delivery: 3000,       // 3 seconds
  }
};