import './instrumentation';

import Knex from 'knex';
import { App } from './app';
import { createLogger, wrapWithTracing } from '@anticapture/observability';

const logger = createLogger('subscription-server');
import { loadConfig } from './config';
import { DaoController, NotificationController } from './controllers';
import { UserAddressController } from './controllers/user-address.controller';
import { SlackOAuthController } from './controllers/slack-oauth.controller';
import { KnexUserRepository, KnexPreferenceRepository, KnexNotificationRepository, KnexUserAddressRepository } from './repositories/knex.repository';
import { SubscriptionService, NotificationService } from './services';
import { DaoHandler } from './handlers/dao.handlers';
import { WorkspaceService } from './services/workspace.service';
import { UserNotificationPreferencesRepository } from './repositories/user-notification-preferences.repository';
import { SettingsService } from './services/settings.service';
import { SettingsHandler } from './handlers/settings.handler';
import { SettingsController } from './controllers/settings.controller';

const config = loadConfig();

const db = Knex({
  client: 'pg',
  connection: config.databaseUrl,
});

// Repository instances
const userRepository = wrapWithTracing(new KnexUserRepository(db, config.tokenEncryptionKey, logger));
const preferenceRepository = wrapWithTracing(new KnexPreferenceRepository(db));
const notificationRepository = wrapWithTracing(new KnexNotificationRepository(db));
const userAddressRepository = wrapWithTracing(new KnexUserAddressRepository(db));
const notificationPrefsRepository = wrapWithTracing(new UserNotificationPreferencesRepository(db));

// Service instances
const workspaceService = wrapWithTracing(new WorkspaceService(db, config.tokenEncryptionKey));
const subscriptionService = wrapWithTracing(new SubscriptionService(userRepository, preferenceRepository, userAddressRepository, notificationPrefsRepository));
const notificationService = wrapWithTracing(new NotificationService(notificationRepository));
const settingsService = wrapWithTracing(new SettingsService(notificationPrefsRepository));

// Handler instances
const daoHandler = wrapWithTracing(new DaoHandler(subscriptionService));
const settingsHandler = wrapWithTracing(new SettingsHandler(settingsService, userRepository));

// Controller instances
const daoController = new DaoController(daoHandler);
const settingsController = new SettingsController(settingsHandler);
const notificationController = new NotificationController(notificationService);
const userAddressController = new UserAddressController(subscriptionService);
const slackOAuthController = new SlackOAuthController(
  workspaceService,
  config.slackClientId,
  config.slackClientSecret,
  config.slackRedirectUri,
  logger,
);

const app = new App(
  db,
  config.port,
  daoController,
  notificationController,
  userAddressController,
  slackOAuthController,
  settingsController
);

(async () => {
  try {
    await app.start();
  } catch (err) {
    logger.error({ err }, 'subscription-server failed to start');
    process.exit(1);
  }
})();