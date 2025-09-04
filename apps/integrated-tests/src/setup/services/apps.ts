import { App as ConsumerApp } from '@notification-system/consumer';
import { App as LogicSystemApp } from '@notification-system/logic-system';
import { App as DispatcherApp } from '@notification-system/dispatcher';
import { App as SubscriptionServerApp } from '@notification-system/subscription-server';
import { Knex } from 'knex';
import { RabbitMQTestSetup } from '../rabbitmq-setup';
import { serviceConfig, timeouts } from '../../config';
import { waitFor } from '../../helpers/utilities/wait-for';
import { MockEnsResolverService } from '../../mocks/ens-resolver-mock';
import { TestTelegramClient } from '@notification-system/consumer/dist/clients/test-telegram.client';
import { jest } from '@jest/globals';

/**
 * @notice Type definition for test applications container
 * @dev Contains references to all running test services and their configurations
 */
export type TestApps = {
  /** Consumer application instance */
  consumerApp: ConsumerApp;
  /** Logic system application instance */
  logicSystemApp: LogicSystemApp;
  /** Dispatcher application instance */
  dispatcherApp: DispatcherApp;
  /** Subscription server application instance */
  subscriptionServerApp: SubscriptionServerApp;
  /** RabbitMQ test setup instance */
  rabbitmqSetup: RabbitMQTestSetup;
  /** Mock sendMessage function for testing */
  mockSendMessage?: jest.Mock;
};

/**
 * @notice Configuration object for test application setup
 * @dev Defines server configurations and external service URLs for testing
 */
const TEST_CONFIG = {
  ports: {
    subscriptionServer: serviceConfig.ports.subscriptionServer,
  },
  urls: {
    subscriptionServer: `http://127.0.0.1:${serviceConfig.ports.subscriptionServer}`,
    mockGraphQL: 'http://mocked-endpoint.com/graphql',
  },
  telegram: {
    botToken: serviceConfig.bot.token,
  },
  logicSystem: {
    interval: serviceConfig.logicSystem.pollInterval,
    proposalState: 'ACTIVE',
  },
  timeouts: {
    appStartup: timeouts.notification.processing,
  },
} as const;

/**
 * @notice Sets up RabbitMQ connection for testing
 * @dev Creates RabbitMQ test setup and returns connection URL
 * @return Object containing setup instance and connection URL
 */
const setupRabbitMQ = async (): Promise<{ rabbitmqSetup: RabbitMQTestSetup; rabbitmqUrl: string }> => {
  const rabbitmqSetup = RabbitMQTestSetup.getInstance();
  const rabbitmqUrl = process.env.TEST_RABBITMQ_URL || await rabbitmqSetup.setup();
  return { rabbitmqSetup, rabbitmqUrl };
};

/**
 * @notice Creates and configures Telegram client for testing
 * @dev Returns TestTelegramClient configured for either real or mock mode
 * @return Object containing telegram client and mock send message function
 */
const createTelegramClient = () => {
  // Always create a mock function for test assertions
  const mockSendMessage = jest.fn<any>().mockResolvedValue({
    message_id: 123,
    date: Date.now(),
    chat: { id: 1, type: 'private' },
    text: 'test',
    from: { id: 123456789, is_bot: true, first_name: 'TestBot' }
  });
  
  let telegramClient;
  
  if (process.env.SEND_REAL_TELEGRAM) {
    // Use TestTelegramClient with real bot token
    const botToken = process.env.TELEGRAM_BOT_TOKEN || TEST_CONFIG.telegram.botToken;
    telegramClient = new TestTelegramClient(mockSendMessage);
  } else {
    // Use TestTelegramClient in mock-only mode
    telegramClient = new TestTelegramClient(mockSendMessage);
  }
  
  return { telegramClient, mockSendMessage };
};

/**
 * @notice Starts the subscription server application
 * @dev Initializes and starts the subscription server with given database
 * @param db Database connection instance
 * @return Started subscription server application instance
 */
const startSubscriptionServer = async (db: Knex): Promise<SubscriptionServerApp> => {
  const subscriptionServerApp = new SubscriptionServerApp(db, TEST_CONFIG.ports.subscriptionServer);
  await subscriptionServerApp.start();
  return subscriptionServerApp;
};

/**
 * @notice Starts the consumer application
 * @dev Initializes and starts the consumer with dependencies
 * @param mockHttpClient Mocked HTTP client
 * @param rabbitmqUrl RabbitMQ connection URL
 * @param telegramClient Telegram client instance
 * @return Started consumer application instance
 */
const startConsumer = async (
  mockHttpClient: any,
  rabbitmqUrl: string,
  telegramClient: any
): Promise<ConsumerApp> => {
  const mockEnsResolver = new MockEnsResolverService() as any;
  const consumerApp = new ConsumerApp(
    TEST_CONFIG.urls.subscriptionServer,
    mockHttpClient,
    rabbitmqUrl,
    mockEnsResolver,
    telegramClient
  );
  await consumerApp.start();
  return consumerApp;
};

/**
 * @notice Starts the dispatcher application
 * @dev Initializes and starts the dispatcher with dependencies
 * @param rabbitmqUrl RabbitMQ connection URL
 * @param mockHttpClient Mocked HTTP client
 * @return Started dispatcher application instance
 */
const startDispatcher = async (
  rabbitmqUrl: string,
  mockHttpClient: any
): Promise<DispatcherApp> => {
  const dispatcherApp = new DispatcherApp(
    TEST_CONFIG.urls.subscriptionServer, 
    rabbitmqUrl,
    TEST_CONFIG.urls.mockGraphQL,
    mockHttpClient
  );
  await dispatcherApp.start();
  return dispatcherApp;
};

/**
 * @notice Starts the logic system application
 * @dev Initializes and starts the logic system with dependencies
 * @param mockHttpClient Mocked HTTP client
 * @param rabbitmqUrl RabbitMQ connection URL
 * @return Started logic system application instance
 */
const startLogicSystem = async (
  mockHttpClient: any,
  rabbitmqUrl: string
): Promise<LogicSystemApp> => {
  const oneYearAgo = Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000).toString();
  const logicSystemApp = new LogicSystemApp(
    TEST_CONFIG.logicSystem.interval,
    TEST_CONFIG.logicSystem.proposalState,
    mockHttpClient,
    rabbitmqUrl,
    oneYearAgo
  );
  await logicSystemApp.start();
  return logicSystemApp;
};

/**
 * @notice Waits for all applications to be ready
 * @dev Verifies that all applications have started successfully
 * @param apps Object containing all application instances
 */
const waitForAppsReady = async (apps: Omit<TestApps, 'rabbitmqSetup' | 'mockSendMessage'>) => {
  await waitFor(
    async () => {
      return apps.consumerApp && apps.logicSystemApp && apps.dispatcherApp && apps.subscriptionServerApp;
    },
    {
      timeout: TEST_CONFIG.timeouts.appStartup,
      interval: 100,
      errorMessage: 'Apps failed to start within timeout period'
    }
  );
};

/**
 * @notice Starts all test applications required for integration tests  
 * @dev Sets up RabbitMQ, database, and starts all microservices
 * @param db Database connection instance
 * @param mockHttpClient Mocked HTTP client for external API calls
 * @return Promise resolving to TestApps object containing service references
 */
export const startTestApps = async (db: Knex, mockHttpClient: any): Promise<TestApps> => {
  // Setup infrastructure
  const { rabbitmqSetup, rabbitmqUrl } = await setupRabbitMQ();
  const { telegramClient, mockSendMessage } = createTelegramClient();
  
  // Start all services
  const subscriptionServerApp = await startSubscriptionServer(db);
  const consumerApp = await startConsumer(mockHttpClient, rabbitmqUrl, telegramClient);
  const dispatcherApp = await startDispatcher(rabbitmqUrl, mockHttpClient);
  const logicSystemApp = await startLogicSystem(mockHttpClient, rabbitmqUrl);
  
  // Wait for all apps to be ready
  await waitForAppsReady({
    consumerApp,
    logicSystemApp,
    dispatcherApp,
    subscriptionServerApp
  });
  
  return {
    consumerApp,
    logicSystemApp,
    dispatcherApp,
    subscriptionServerApp,
    rabbitmqSetup,
    mockSendMessage
  };
};

/**
 * @notice Gracefully stops all test applications
 * @dev Closes all server connections and cleans up resources
 * @param apps The TestApps object containing service references to stop
 * @return Promise that resolves when all services are stopped
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