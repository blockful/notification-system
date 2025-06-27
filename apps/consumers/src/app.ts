import { Telegraf } from 'telegraf';
import { session } from 'telegraf/session';
import { AxiosInstance } from 'axios';
import { BotController } from './controllers/bot.controller';
import { DAOService } from './services/dao.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { SubscriptionAPIService } from './services/subscription-api.service';
import { NotificationService } from './services/notification.service';
import { ContextWithSession } from './interfaces/bot.interface';
import { RabbitMQNotificationConsumerService } from './services/rabbitmq-notification-consumer.service';

export class App {
  private notificationService: NotificationService;
  private botController: BotController;
  private rabbitmqConsumerService?: RabbitMQNotificationConsumerService;
  private rabbitmqUrl: string;

  constructor(
    telegramBotToken: string, 
    subscriptionServerUrl: string, 
    httpClient: AxiosInstance,
    rabbitmqUrl: string
  ) {
    const subscriptionApi = new SubscriptionAPIService(subscriptionServerUrl);
    const anticaptureClient = new AnticaptureClient(httpClient);
    const daoService = new DAOService(anticaptureClient, subscriptionApi);
    const bot = new Telegraf<ContextWithSession>(telegramBotToken);
    bot.use(session());
    this.notificationService = new NotificationService(bot);
    this.botController = new BotController(bot, daoService);
    this.rabbitmqUrl = rabbitmqUrl;
  }

  async start(): Promise<void> {
    this.rabbitmqConsumerService = await RabbitMQNotificationConsumerService.create(
      this.rabbitmqUrl,
      this.notificationService
    );
    this.botController.launch();
    console.log('Telegram bot is running!');
  }

  async stop(): Promise<void> {
    if (this.rabbitmqConsumerService) {
      await this.rabbitmqConsumerService.stop();
    }
    this.botController.stop('SIGINT');
  }
} 