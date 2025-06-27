import { App as ConsumerApp } from '@notification-system/consumer';
import { App as LogicSystemApp } from '@notification-system/logic-system';
import { App as DispatcherApp } from '@notification-system/dispatcher';
import { App as SubscriptionServerApp } from '@notification-system/subscription-server';
import { Knex } from 'knex';
import { RabbitMQTestSetup } from './rabbitmq-setup';

export type TestApps = {
  consumerApp: ConsumerApp;
  logicSystemApp: LogicSystemApp;
  dispatcherApp: DispatcherApp;
  subscriptionServerApp: SubscriptionServerApp;
  rabbitmqSetup: RabbitMQTestSetup;
};

/**
 * Configuration for test applications
 */
const TEST_CONFIG = {
  ports: {
    subscriptionServer: 14001,
  },
  urls: {
    subscriptionServer: 'http://127.0.0.1:14001',
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
  const rabbitmqSetup = new RabbitMQTestSetup();
  const rabbitmqUrl = await rabbitmqSetup.setup();
  
  const subscriptionServerApp = SubscriptionServerApp.create({
    db,
    port: TEST_CONFIG.ports.subscriptionServer
  });
  await subscriptionServerApp.start();
  
  // Start consumer
  const consumerApp = ConsumerApp.create({
    telegramBotToken: TEST_CONFIG.telegram.botToken,
    subscriptionServerUrl: TEST_CONFIG.urls.subscriptionServer,
    httpClient: mockHttpClient,
    rabbitmqUrl
  });
  await consumerApp.start();
  
  // Start dispatcher
  const dispatcherApp = await DispatcherApp.create({
    subscriptionServerUrl: TEST_CONFIG.urls.subscriptionServer,
    rabbitmqUrl
  });
  await dispatcherApp.start();
  
  // Start logic system
  const logicSystemApp = await LogicSystemApp.create({
    triggerInterval: TEST_CONFIG.logicSystem.interval,
    proposalStatus: TEST_CONFIG.logicSystem.proposalState,
    anticaptureHttpClient: mockHttpClient,
    rabbitmqUrl
  });
  await logicSystemApp.start();
  
  // Wait for apps to be ready
  await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.timeouts.appStartup));
  
  return {
    consumerApp,
    logicSystemApp,
    dispatcherApp,
    subscriptionServerApp,
    rabbitmqSetup
  };
};

/**
 * Stops all test applications gracefully
 */
export const stopTestApps = async (apps: TestApps) => {
  const { consumerApp, logicSystemApp, dispatcherApp, subscriptionServerApp, rabbitmqSetup } = apps;
  
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
  if (rabbitmqSetup) {
    await rabbitmqSetup.cleanup();
  }
};

export { TEST_CONFIG }; 