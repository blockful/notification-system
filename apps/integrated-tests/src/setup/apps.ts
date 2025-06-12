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
 * Starts all test applications with proper configuration
 */
export const startTestApps = async (db: Knex, mockHttpClient: any): Promise<TestApps> => {
  // Start subscription server
  const subscriptionServerApp = new SubscriptionServerApp(db, 14001);
  await subscriptionServerApp.start();
  
  // Start dispatcher
  const dispatcherApp = new DispatcherApp(
    13002, 
    'http://127.0.0.1:14001', 
    'http://127.0.0.1:14002'
  );
  await dispatcherApp.start();
  
  // Start consumer
  const consumerApp = new ConsumerApp(
    'http://mocked-endpoint.com/graphql',
    '7117895712:AAH96CfnDvvfLNl2nJbRKbNYPay4V936mWY',
    'http://127.0.0.1:14001',
    14002,
    mockHttpClient
  );
  await consumerApp.start();
  
  // Start logic system
  const logicSystemApp = new LogicSystemApp(
    'http://mocked-endpoint.com/graphql',
    'http://127.0.0.1:13002/messages',
    5000,
    'active',
    mockHttpClient,
    axios.create() as any
  );
  logicSystemApp.start();
  
  // Wait for apps to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));
  
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