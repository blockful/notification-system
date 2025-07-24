/**
 * Service configuration for integration tests
 */

export const serviceConfig = {
  // Service ports (only used ones)
  ports: {
    subscriptionServer: 14001,
  },
  
  // Service URLs (only used ones)
  urls: {
    subscriptionServer: 'http://localhost:14001',
  },
  
  // Logic system configuration (only used ones)
  logicSystem: {
    pollInterval: 500, // milliseconds between polls
  },
  
  // Bot configuration (only used ones)
  bot: {
    token: 'test-bot-token', // Test bot token
  }
};