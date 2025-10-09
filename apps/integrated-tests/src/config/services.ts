/**
 * Service configuration for integration tests
 */

import { env } from './env';

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
    tokenEncryptionKey: env.TOKEN_ENCRYPTION_KEY
  }
};