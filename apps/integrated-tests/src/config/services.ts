/**
 * Service configuration for integration tests
 */

export const serviceConfig = {
  // Service ports 
  ports: {
    subscriptionServer: 14001,
  },
  
  // Service URLs 
  urls: {
    subscriptionServer: 'http://localhost:14001',
  },
  
  // Logic system configuration 
  logicSystem: {
    pollInterval: 500, // milliseconds between polls
  },
  
  // Bot configuration 
  bot: {
    token: 'test-bot-token', // Test bot token
  }
};