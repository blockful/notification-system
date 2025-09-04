import { AxiosInstance } from 'axios';
import { TelegramBotService } from './services/telegram-bot.service';
import { DAOService } from './services/dao.service';
import { WalletService } from './services/wallet.service';
import { ExplorerService } from './services/explorer.service';
import { EnsResolverService } from './services/ens-resolver.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { SubscriptionAPIService } from './services/subscription-api.service';
import { RabbitMQNotificationConsumerService } from './services/rabbitmq-notification-consumer.service';
import { TelegramClientInterface } from './interfaces/telegram-client.interface';

export class App {
  private telegramBotService: TelegramBotService;
  private rabbitmqConsumerService?: RabbitMQNotificationConsumerService;
  private rabbitmqUrl: string;

  constructor(
    subscriptionServerUrl: string, 
    httpClient: AxiosInstance,
    rabbitmqUrl: string,
    ensResolver: EnsResolverService,
    telegramClient: TelegramClientInterface
  ) {
    const subscriptionApi = new SubscriptionAPIService(subscriptionServerUrl);
    const anticaptureClient = new AnticaptureClient(httpClient);
    const daoService = new DAOService(anticaptureClient, subscriptionApi);
    const walletService = new WalletService(subscriptionApi, ensResolver);
    const explorerService = new ExplorerService();
    
    this.telegramBotService = new TelegramBotService(
      telegramClient,
      daoService, 
      walletService, 
      explorerService, 
      ensResolver
    );
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