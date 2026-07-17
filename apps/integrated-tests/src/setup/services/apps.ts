import { App as ConsumerApp } from '@notification-system/consumer';
import { App as LogicSystemApp } from '@notification-system/logic-system';
import { App as DispatcherApp } from '@notification-system/dispatcher';
import { App as SubscriptionServerApp } from '@notification-system/subscription-server';
import { DaoController, NotificationController } from '@notification-system/subscription-server/dist/controllers';
import { UserAddressController } from '@notification-system/subscription-server/dist/controllers/user-address.controller';
import { SlackOAuthController } from '@notification-system/subscription-server/dist/controllers/slack-oauth.controller';
import { SettingsController } from '@notification-system/subscription-server/dist/controllers/settings.controller';
import { KnexUserRepository, KnexPreferenceRepository, KnexNotificationRepository, KnexUserAddressRepository } from '@notification-system/subscription-server/dist/repositories/knex.repository';
import { SubscriptionService, NotificationService } from '@notification-system/subscription-server/dist/services';
import { DaoHandler } from '@notification-system/subscription-server/dist/handlers/dao.handlers';
import { SettingsHandler } from '@notification-system/subscription-server/dist/handlers/settings.handler';
import { WorkspaceService } from '@notification-system/subscription-server/dist/services/workspace.service';
import { SettingsService } from '@notification-system/subscription-server/dist/services/settings.service';
import { UserNotificationPreferencesRepository } from '@notification-system/subscription-server/dist/repositories/user-notification-preferences.repository';
import { Knex } from 'knex';
import { RabbitMQTestSetup } from '../rabbitmq-setup';
import { serviceConfig, timeouts } from '../../config';
import { env } from '../../config/env';
import { waitFor } from '../../helpers/utilities/wait-for';
import type { IEnsResolver } from '@notification-system/consumer/dist/services/ens-resolver.service';
import { SimpleTelegramClient } from '../../test-clients/simple-telegram.client';
import { SimpleSlackClient } from '../../test-clients/simple-slack.client';
import { MOCK_ANTICAPTURE_URL } from '../msw-server';

class SimpleEnsResolver implements IEnsResolver {
  private readonly ensNames: Record<string, string> = {
    '0xd8da6bf26964af9d7eed9e03e53415d37aa96045': 'vitalik.eth',
    '0x225f137127d9067788314bc7fcc1f36746a3c3b5': 'nick.eth',
    '0x983110309620d911731ac0932219af06091b6744': 'brantly.eth',
    '0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5': 'firefish.eth',
    '0x59a7abcf26ae2990ecbca902a2ea43536a4f56d9': 'theblackbelt.eth',
  };

  async resolveToAddress(_ensName: string): Promise<string | null> {
    return null;
  }

  async resolveDisplayName(address: string): Promise<string> {
    return this.ensNames[address.toLowerCase()] ?? address;
  }
}

/**
 * @notice Type definition for test applications container
 * @dev Contains references to all running test services and their configurations
 */
export type TestApps = {
  consumerApp: ConsumerApp;
  logicSystemApp: LogicSystemApp;
  dispatcherApp: DispatcherApp;
  subscriptionServerApp: SubscriptionServerApp;
  rabbitmqSetup: RabbitMQTestSetup;
  telegramClient: SimpleTelegramClient;
  slackClient: SimpleSlackClient;
};

/**
 * @notice Configuration object for test application setup
 * @dev Defines server configurations and external service URLs for testing
 */
const TEST_CONFIG = {
  ports: {
    subscriptionServer: serviceConfig.ports.subscriptionServer,
    dispatcher: serviceConfig.ports.dispatcher,
    logicSystem: serviceConfig.ports.logicSystem,
  },
  urls: {
    subscriptionServer: `http://127.0.0.1:${serviceConfig.ports.subscriptionServer}`,
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
  const rabbitmqUrl = env.TEST_RABBITMQ_URL || await rabbitmqSetup.setup();
  return { rabbitmqSetup, rabbitmqUrl };
};

const createTelegramClient = (): SimpleTelegramClient => {
  const botToken = env.SEND_REAL_TELEGRAM
    ? (env.TELEGRAM_BOT_TOKEN || TEST_CONFIG.telegram.botToken)
    : undefined;
  return new SimpleTelegramClient(botToken);
};

const createSlackClient = (): SimpleSlackClient => {
  const botToken = env.SEND_REAL_SLACK ? env.SLACK_BOT_TOKEN : undefined;
  return new SimpleSlackClient(botToken);
};

/**
 * @notice Starts the subscription server application
 * @dev Initializes and starts the subscription server with given database
 * @param db Database connection instance
 * @return Started subscription server application instance
 */
const startSubscriptionServer = async (db: Knex): Promise<SubscriptionServerApp> => {
  // Repository instances
  const userRepository = new KnexUserRepository(db, serviceConfig.oauth.tokenEncryptionKey);
  const preferenceRepository = new KnexPreferenceRepository(db);
  const notificationRepository = new KnexNotificationRepository(db);
  const userAddressRepository = new KnexUserAddressRepository(db);
  const notificationPrefsRepository = new UserNotificationPreferencesRepository(db);

  // Service instances
  const workspaceService = new WorkspaceService(db, serviceConfig.oauth.tokenEncryptionKey);
  const subscriptionService = new SubscriptionService(userRepository, preferenceRepository, userAddressRepository, notificationPrefsRepository, serviceConfig.oauth.tokenEncryptionKey);
  const notificationService = new NotificationService(notificationRepository);
  const settingsService = new SettingsService(notificationPrefsRepository);

  // Handler instances
  const daoHandler = new DaoHandler(subscriptionService);
  const settingsHandler = new SettingsHandler(settingsService, userRepository);

  // Controller instances
  const daoController = new DaoController(daoHandler);
  const settingsController = new SettingsController(settingsHandler);
  const notificationController = new NotificationController(notificationService);
  const userAddressController = new UserAddressController(subscriptionService);
  const slackOAuthController = new SlackOAuthController(
    workspaceService,
    serviceConfig.oauth.slackClientId,
    serviceConfig.oauth.slackClientSecret,
    serviceConfig.oauth.slackRedirectUri
  );

  const subscriptionServerApp = new SubscriptionServerApp(
    db,
    TEST_CONFIG.ports.subscriptionServer,
    daoController,
    notificationController,
    userAddressController,
    slackOAuthController,
    settingsController
  );
  await subscriptionServerApp.start();
  return subscriptionServerApp;
};

const startConsumer = async (
  rabbitmqUrl: string,
  telegramClient: SimpleTelegramClient,
  slackClient: SimpleSlackClient
): Promise<ConsumerApp> => {
  const ensResolver = new SimpleEnsResolver();
  const consumerApp = new ConsumerApp(
    TEST_CONFIG.urls.subscriptionServer,
    MOCK_ANTICAPTURE_URL,
    rabbitmqUrl,
    ensResolver,
    telegramClient,
    slackClient,
    3003
  );
  await consumerApp.start();
  return consumerApp;
};

const startDispatcher = async (
  rabbitmqUrl: string,
): Promise<DispatcherApp> => {
  const dispatcherApp = new DispatcherApp(
    TEST_CONFIG.urls.subscriptionServer,
    rabbitmqUrl,
    MOCK_ANTICAPTURE_URL,
    TEST_CONFIG.ports.dispatcher,
  );
  await dispatcherApp.start();
  return dispatcherApp;
};

const startLogicSystem = async (
  rabbitmqUrl: string
): Promise<LogicSystemApp> => {
  const oneYearAgo = Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000).toString();
  const logicSystemApp = new LogicSystemApp(
    TEST_CONFIG.logicSystem.interval,
    'ACTIVE',
    MOCK_ANTICAPTURE_URL,
    rabbitmqUrl,
    TEST_CONFIG.ports.logicSystem,
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
const waitForAppsReady = async (apps: Omit<TestApps, 'rabbitmqSetup' | 'telegramClient' | 'slackClient'>) => {
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
 * @return Promise resolving to TestApps object containing service references
 */
export const startTestApps = async (db: Knex): Promise<TestApps> => {
  const { rabbitmqSetup, rabbitmqUrl } = await setupRabbitMQ();
  const telegramClient = createTelegramClient();
  const slackClient = createSlackClient();

  const subscriptionServerApp = await startSubscriptionServer(db);
  const consumerApp = await startConsumer(rabbitmqUrl, telegramClient, slackClient);
  const dispatcherApp = await startDispatcher(rabbitmqUrl);
  const logicSystemApp = await startLogicSystem(rabbitmqUrl);

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
    telegramClient,
    slackClient
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