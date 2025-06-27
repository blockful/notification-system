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

export interface ConsumerAppConfig {
  telegramBotToken: string;
  subscriptionServerUrl: string;
  httpClient: AxiosInstance;
  rabbitmqUrl: string;
}

export class App {
  private notificationService: NotificationService;
  private botController: BotController;
  private rabbitmqConsumerService?: RabbitMQNotificationConsumerService;
  private rabbitmqUrl: string;

  private constructor(
    notificationService: NotificationService,
    botController: BotController,
    rabbitmqUrl: string
  ) {
    this.notificationService = notificationService;
    this.botController = botController;
    this.rabbitmqUrl = rabbitmqUrl;
  }

  static create(config: ConsumerAppConfig): App {
    const subscriptionApi = new SubscriptionAPIService(config.subscriptionServerUrl);
    const anticaptureClient = new AnticaptureClient(config.httpClient);
    const daoService = new DAOService(anticaptureClient, subscriptionApi);
    const bot = new Telegraf<ContextWithSession>(config.telegramBotToken);
    bot.use(session());
    const notificationService = new NotificationService(bot);
    const botController = new BotController(bot, daoService);
    
    return new App(notificationService, botController, config.rabbitmqUrl);
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