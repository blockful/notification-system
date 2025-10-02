/**
 * Service configuration for integration tests
 */

// Generate random port to avoid conflicts in parallel tests
const randomPort = 14000 + Math.floor(Math.random() * 1000);

export const serviceConfig = {
  // Service ports 
  ports: {
    subscriptionServer: randomPort,
  },
  
  // Service URLs 
  urls: {
    subscriptionServer: `http://localhost:${randomPort}`,
  },
  
  // Logic system configuration 
  logicSystem: {
    pollInterval: 500, // milliseconds between polls
  },
  
  // Bot configuration
  bot: {
    token: 'test-bot-token', // Test bot token
  },

  // OAuth configuration for tests
  oauth: {
    slackClientId: 'test-client-id',
    slackClientSecret: 'test-client-secret',
    slackRedirectUri: 'http://localhost/oauth/callback',
    tokenEncryptionKey: 'e10981ff87b7483d85cdbf8b1ae0618236a37afe8cc082853183b6283c470e22'
  }
};