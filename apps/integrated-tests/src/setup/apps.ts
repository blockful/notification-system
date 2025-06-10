import { App as ConsumerApp } from '@notification-system/consumer';
import { App as LogicSystemApp } from '@notification-system/logic-system';
import { App as DispatcherApp } from '@notification-system/dispatcher';
import { App as SubscriptionServerApp } from '@notification-system/subscription-server';
import { Knex } from 'knex';
import axios from 'axios';

export interface TestApps {
  consumerApp: ConsumerApp;
  logicSystemApp: LogicSystemApp;
  dispatcherApp: DispatcherApp;
  subscriptionServerApp: SubscriptionServerApp;
}

export interface AppConfig {
  subscriptionServerPort: number;
  dispatcherPort: number;
  consumerPort: number;
  graphqlEndpoint: string;
  telegramToken: string;
}

export const defaultAppConfig: AppConfig = {
  subscriptionServerPort: 14001,
  dispatcherPort: 13002,
  consumerPort: 14002,
  graphqlEndpoint: 'http://mocked-endpoint.com/graphql',
  telegramToken: '7117895712:AAH96CfnDvvfLNl2nJbRKbNYPay4V936mWY'
};

/**
 * Starts all test applications with proper configuration
 */
export const startTestApps = async (
  db: Knex,
  mockHttpClient: any,
  config: AppConfig = defaultAppConfig
): Promise<TestApps> => {
  // Start subscription server
  const subscriptionServerApp = new SubscriptionServerApp(db, config.subscriptionServerPort);
  await subscriptionServerApp.start();
  
  // Start dispatcher
  const dispatcherApp = new DispatcherApp(
    config.dispatcherPort, 
    `http://127.0.0.1:${config.subscriptionServerPort}`, 
    `http://127.0.0.1:${config.consumerPort}`
  );
  await dispatcherApp.start();
  
  // Start consumer
  const consumerApp = new ConsumerApp(
    config.graphqlEndpoint,
    config.telegramToken,
    `http://127.0.0.1:${config.subscriptionServerPort}`,
    config.consumerPort,
    mockHttpClient
  );
  await consumerApp.start();
  
  // Start logic system
  const logicSystemApp = new LogicSystemApp(
    config.graphqlEndpoint,
    `http://127.0.0.1:${config.dispatcherPort}/messages`,
    5000,
    'active',
    mockHttpClient,
    axios.create() as any
  );
  logicSystemApp.start();
  
  // Wait for apps to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));
  
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
export const stopTestApps = async (apps: TestApps): Promise<void> => {
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