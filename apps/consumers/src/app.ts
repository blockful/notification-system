import { Telegraf } from 'telegraf';
import { session } from 'telegraf/session';
import { AxiosInstance } from 'axios';
import { TelegramBotService } from './services/telegram-bot.service';
import { DAOService } from './services/dao.service';
import { WalletService } from './services/wallet.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { SubscriptionAPIService } from './services/subscription-api.service';
import { ContextWithSession } from './interfaces/bot.interface';
import { RabbitMQNotificationConsumerService } from './services/rabbitmq-notification-consumer.service';

export class App {
  private telegramBotService: TelegramBotService;
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
    const walletService = new WalletService(subscriptionApi);
    const bot = new Telegraf<ContextWithSession>(telegramBotToken);
    bot.use(session());
    this.telegramBotService = new TelegramBotService(bot, daoService, walletService);
    this.rabbitmqUrl = rabbitmqUrl;
  }

  async start(): Promise<void> {
    this.rabbitmqConsumerService = await RabbitMQNotificationConsumerService.create(
      this.rabbitmqUrl,
      this.telegramBotService
    );
    await this.telegramBotService.launch();
    console.log('Telegram bot is running!');
  }

  async stop(): Promise<void> {
    if (this.rabbitmqConsumerService) {
      await this.rabbitmqConsumerService.stop();
    }
    this.telegramBotService.stop('SIGINT');
  }
} 