import { App as ConsumerApp } from '@notification-system/consumer';
import { App as LogicSystemApp } from '@notification-system/logic-system';
import { App as DispatcherApp } from '@notification-system/dispatcher';
import { App as SubscriptionServerApp } from '@notification-system/subscription-server';
import { Knex } from 'knex';
import axios from 'axios';

export type TestApps = {
  consumerApp: ConsumerApp;
  logicSystemApp: LogicSystemApp;
  dispatcherApp: DispatcherApp;
  subscriptionServerApp: SubscriptionServerApp;
};

/**
 * Configuration for test applications
 */
const TEST_CONFIG = {
  ports: {
    subscriptionServer: 14001,
    consumer: 14002,
    dispatcher: 13002,
  },
  urls: {
    subscriptionServer: 'http://127.0.0.1:14001',
    consumer: 'http://127.0.0.1:14002',
    dispatcher: 'http://127.0.0.1:13002/messages',
    mockGraphQL: 'http://mocked-endpoint.com/graphql',
  },
  telegram: {
    botToken: '7117895712:AAH96CfnDvvfLNl2nJbRKbNYPay4V936mWY',
  },
  logicSystem: {
    interval: 5000,
    proposalState: 'pending',
  },
  timeouts: {
    appStartup: 2000,
  },
} as const;

/**
 * Starts all test applications with proper configuration
 */
export const startTestApps = async (db: Knex, mockHttpClient: any): Promise<TestApps> => {
  // Start subscription server
  const subscriptionServerApp = new SubscriptionServerApp(db, TEST_CONFIG.ports.subscriptionServer);
  await subscriptionServerApp.start();
  
  // Start dispatcher
  const dispatcherApp = new DispatcherApp(
    TEST_CONFIG.ports.dispatcher, 
    TEST_CONFIG.urls.subscriptionServer, 
    TEST_CONFIG.urls.consumer
  );
  await dispatcherApp.start();
  
  // Start consumer
  const consumerApp = new ConsumerApp(
    TEST_CONFIG.telegram.botToken,
    TEST_CONFIG.urls.subscriptionServer,
    TEST_CONFIG.ports.consumer,
    mockHttpClient
  );
  await consumerApp.start();
  
  // Start logic system
  const logicSystemApp = new LogicSystemApp(
    TEST_CONFIG.logicSystem.interval,
    TEST_CONFIG.logicSystem.proposalState,
    mockHttpClient,
    axios.create({ baseURL: TEST_CONFIG.urls.dispatcher }) as any
  );
  logicSystemApp.start();
  
  // Wait for apps to be ready
  await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.timeouts.appStartup));
  
  return {
    consumerApp,
    logicSystemApp,
    dispatcherApp,
    subscriptionServerApp
  };
};

/**
 * Stops all test applications gracefully
 */
export const stopTestApps = async (apps: TestApps) => {
  const { consumerApp, logicSystemApp, dispatcherApp, subscriptionServerApp } = apps;
  
  if (logicSystemApp) {
    await logicSystemApp.stop();
  }
  if (consumerApp) {
    await consumerApp.stop();
  }
  if (dispatcherApp) {
    await dispatcherApp.stop();
  }
  if (subscriptionServerApp) {
    await subscriptionServerApp.stop();
  }
};

export { TEST_CONFIG }; 