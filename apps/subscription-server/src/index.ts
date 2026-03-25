import Knex from 'knex';
import { App } from './app';
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
const userRepository = new KnexUserRepository(db, config.tokenEncryptionKey);
const preferenceRepository = new KnexPreferenceRepository(db);
const notificationRepository = new KnexNotificationRepository(db);
const userAddressRepository = new KnexUserAddressRepository(db);
const notificationPrefsRepository = new UserNotificationPreferencesRepository(db);

// Service instances
const workspaceService = new WorkspaceService(db, config.tokenEncryptionKey);
const subscriptionService = new SubscriptionService(userRepository, preferenceRepository, userAddressRepository, notificationPrefsRepository);
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
  config.slackClientId,
  config.slackClientSecret,
  config.slackRedirectUri
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
  await app.start();
})();