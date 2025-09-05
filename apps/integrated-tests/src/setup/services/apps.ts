import { App as ConsumerApp } from '@notification-system/consumer';
import { App as LogicSystemApp } from '@notification-system/logic-system';
import { App as DispatcherApp } from '@notification-system/dispatcher';
import { App as SubscriptionServerApp } from '@notification-system/subscription-server';
import { Knex } from 'knex';
import { RabbitMQTestSetup } from '../rabbitmq-setup';
import { serviceConfig, timeouts } from '../../config';
import { waitFor } from '../../helpers/utilities/wait-for';
import { MockEnsResolverService } from '../../mocks/ens-resolver-mock';

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
 * @notice Starts all test applications required for integration tests  
 * @dev Sets up RabbitMQ, database, and starts all microservices
 * @param db Database connection instance
 * @param mockHttpClient Mocked HTTP client for external API calls
 * @return Promise resolving to TestApps object containing service references
 */
export const startTestApps = async (db: Knex, mockHttpClient: any): Promise<TestApps> => {
  const rabbitmqSetup = new RabbitMQTestSetup();
  const rabbitmqUrl = process.env.TEST_RABBITMQ_URL || await rabbitmqSetup.setup();
  
  const subscriptionServerApp = new SubscriptionServerApp(db, TEST_CONFIG.ports.subscriptionServer);
  await subscriptionServerApp.start();
  
  // Create mock ENS resolver for tests
  const mockEnsResolver = new MockEnsResolverService() as any;
  
  const consumerApp = new ConsumerApp(
    TEST_CONFIG.telegram.botToken,
    TEST_CONFIG.urls.subscriptionServer,
    mockHttpClient,
    rabbitmqUrl,
    mockEnsResolver
  );
  await consumerApp.start();
  
  const dispatcherApp = new DispatcherApp(
    TEST_CONFIG.urls.subscriptionServer, 
    rabbitmqUrl,
    TEST_CONFIG.urls.mockGraphQL,
    mockHttpClient
  );
  await dispatcherApp.start();
  
  const oneYearAgo = Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000).toString();
  const logicSystemApp = new LogicSystemApp(
    TEST_CONFIG.logicSystem.interval,
    TEST_CONFIG.logicSystem.proposalState,
    mockHttpClient,
    rabbitmqUrl,
    oneYearAgo
  );
  await logicSystemApp.start();
  
  // Wait for apps to be ready
  await waitFor(
    async () => {
      // Check if all apps are ready by verifying they have started successfully
      return consumerApp && logicSystemApp && dispatcherApp && subscriptionServerApp;
    },
    {
      timeout: TEST_CONFIG.timeouts.appStartup,
      interval: 100,
      errorMessage: 'Apps failed to start within timeout period'
    }
  );
  
  return {
    consumerApp,
    logicSystemApp,
    dispatcherApp,
    subscriptionServerApp,
    rabbitmqSetup
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