/**
 * Centralized timeout configurations for tests
 * All timeout values in milliseconds
 */

export const timeouts = {
  // Test execution timeouts (only used ones)
  test: {
    short: 30000,         // 30 seconds
  },
  
  // Waiting for conditions (only used ones)
  wait: {
    default: 5000,        // 5 seconds
    short: 1000,          // 1 second
    long: 10000,          // 10 seconds
    veryLong: 30000,      // 30 seconds
  },
  
  // RabbitMQ specific (only used ones)
  rabbitmq: {
    containerStartup: 150000,  // 2.5 minutes
  },
  
  // Notification delays (only used ones)
  notification: {
    processing: 2000,     // 2 seconds
    delivery: 3000,       // 3 seconds
  }
};