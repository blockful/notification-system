/**
 * Centralized timeout configurations for tests
 * All timeout values in milliseconds
 */

export const timeouts = {
  // Test execution timeouts 
  test: {
    short: 30000,         // 30 seconds
  },
  
  // Waiting for conditions 
  wait: {
    default: 5000,        // 5 seconds
    short: 1000,          // 1 second
    long: 10000,          // 10 seconds
    veryLong: 30000,      // 30 seconds
  },
  
  // RabbitMQ specific 
  rabbitmq: {
    containerStartup: 150000,  // 2.5 minutes
  },
  
  // Notification delays 
  notification: {
    processing: 2000,     // 2 seconds
    delivery: 3000,       // 3 seconds
  }
};