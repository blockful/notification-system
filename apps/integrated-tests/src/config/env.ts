/**
 * Test Environment Configuration
 * 
 * Define environment variables in process.env BEFORE importing applications.
 * Each app validates process.env on import using Zod schemas, so variables
 * must be set before any app modules are loaded.
 * 
 */
export function setupTestEnvironment(): void {
  process.env.NODE_ENV = 'development';
  process.env.PORT = '13002';                          // Dispatcher port
  process.env.SUBSCRIPTION_SERVER_URL = 'http://localhost:14001';
  process.env.TELEGRAM_CONSUMER_URL = 'http://localhost:14002';
  process.env.TELEGRAM_BOT_TOKEN = '7117895712:AAH96CfnDvvfLNl2nJbRKbNYPay4V936mWY';
  process.env.ANTICAPTURE_DATABASE_URL = 'sqlite:///tmp/test_integration.db';
  process.env.API_PORT = '14002';                      // Consumer API port
  process.env.SUBSCRIPTION_PORT = '14001';             // Subscription server port
  process.env.DATABASE_URL = 'sqlite:///tmp/test_integration.db';
  process.env.DISPATCHER_ENDPOINT = 'http://127.0.0.1:13002/messages';
  process.env.TRIGGER_INTERVAL = '5000';
  process.env.PROPOSAL_STATUS = 'active';
} 