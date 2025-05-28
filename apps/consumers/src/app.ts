import { Telegraf } from 'telegraf';
import { Knex } from 'knex';
import { BotController } from './controllers/bot.controller';
import { DAOService } from './services/dao.service';
import { DatabaseService } from './repositories/db';
import { SubscriptionAPIService } from './services/subscription-api.service';
import { NotificationService } from './services/notification.service';
import { startServer, startListening } from './server';
import { FastifyTypedInstance } from './interfaces/fastify.interface';

export class App {
  private notificationService: NotificationService;
  private botController: BotController;
  private server?: FastifyTypedInstance;
  private port: number;

  constructor(daosDb: Knex, usersDb: Knex, telegramBotToken: string, subscriptionServerUrl: string, port: number) {
    this.port = port;
    const subscriptionApi = new SubscriptionAPIService(subscriptionServerUrl);
    const dbService = new DatabaseService(daosDb, usersDb);
    const daoService = new DAOService(dbService, subscriptionApi);
    const bot = new Telegraf(telegramBotToken);
    
    this.notificationService = new NotificationService(bot, subscriptionApi, dbService);
    this.botController = new BotController(telegramBotToken, daoService);
  }

  async start(): Promise<void> {
    this.server = await startServer(this.notificationService);
    await startListening(this.server, this.port);
    this.botController.launch();
    console.log('Telegram bot and API server are now running!');
  }

  async stop(): Promise<void> {
    if (!this.server) {
      console.log('Server is not running');
      return;
    }
    await this.server.close();
    this.botController.stop('SIGINT');
  }
}

// Library exports for external consumption
export { setupDatabaseConnection } from './config/db.config'; 