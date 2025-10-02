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

// Service instances
const workspaceService = new WorkspaceService(db, config.tokenEncryptionKey);
const subscriptionService = new SubscriptionService(userRepository, preferenceRepository, userAddressRepository, workspaceService);
const notificationService = new NotificationService(notificationRepository);

// Handler instances
const daoHandler = new DaoHandler(subscriptionService);

// Controller instances
const daoController = new DaoController(daoHandler);
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
  slackOAuthController
);

(async () => {
  await app.start();
})();