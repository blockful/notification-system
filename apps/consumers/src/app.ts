import { AxiosInstance } from 'axios';
import { TelegramBotService } from './services/bot/telegram-bot.service';
import { SlackBotService } from './services/bot/slack-bot.service';
import { SlackDAOService } from './services/dao/slack-dao.service';
import { SlackWalletService } from './services/wallet/slack-wallet.service';
import { TelegramDAOService } from './services/dao/telegram-dao.service';
import { TelegramWalletService } from './services/wallet/telegram-wallet.service';
import { TelegramSettingsService } from './services/settings/telegram-settings.service';
import { ExplorerService } from '@notification-system/messages';
import { EnsResolverService } from './services/ens-resolver.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { SubscriptionAPIService } from './services/subscription-api.service';
import { RabbitMQNotificationConsumerService } from './services/rabbitmq-notification-consumer.service';
import { TelegramClientInterface } from './interfaces/telegram-client.interface';
import { SlackClientInterface } from './interfaces/slack-client.interface';

export class App {
  private telegramBotService: TelegramBotService;
  private slackBotService: SlackBotService;
  private rabbitmqTelegramConsumerService?: RabbitMQNotificationConsumerService<TelegramBotService>;
  private rabbitmqSlackConsumerService?: RabbitMQNotificationConsumerService<SlackBotService>;
  private rabbitmqUrl: string;

  constructor(
    subscriptionServerUrl: string, 
    httpClient: AxiosInstance,
    rabbitmqUrl: string,
    ensResolver: EnsResolverService,
    telegramClient: TelegramClientInterface,
    slackClient: SlackClientInterface
  ) {
    const subscriptionApi = new SubscriptionAPIService(subscriptionServerUrl);
    const anticaptureClient = new AnticaptureClient(httpClient);
    const explorerService = new ExplorerService();

    // Telegram services
    const telegramDaoService = new TelegramDAOService(anticaptureClient, subscriptionApi);
    const telegramWalletService = new TelegramWalletService(subscriptionApi, ensResolver);
    const telegramSettingsService = new TelegramSettingsService(subscriptionApi);

    this.telegramBotService = new TelegramBotService(
      telegramClient,
      telegramDaoService,
      telegramWalletService,
      telegramSettingsService,
      explorerService,
      ensResolver
    );

    const slackDaoService = new SlackDAOService(anticaptureClient, subscriptionApi);
    const slackWalletService = new SlackWalletService(subscriptionApi, ensResolver);

    this.slackBotService = new SlackBotService(
      slackClient,
      ensResolver,
      slackDaoService,
      slackWalletService
    );
    this.rabbitmqUrl = rabbitmqUrl;
  }

  async start(): Promise<void> {
    this.rabbitmqTelegramConsumerService = await RabbitMQNotificationConsumerService.create(
      this.rabbitmqUrl,
      this.telegramBotService,
      'telegram'
    );
    console.log('✅ Telegram consumer connected to RabbitMQ');

    this.rabbitmqSlackConsumerService = await RabbitMQNotificationConsumerService.create(
      this.rabbitmqUrl,
      this.slackBotService,
      'slack'
    );
    console.log('✅ Slack consumer connected to RabbitMQ');
  
    this.telegramBotService.launch();
    this.slackBotService.launch();

    console.log('🚀 All bot services have been initialized');
  }

  async stop(): Promise<void> {
    if (this.rabbitmqTelegramConsumerService) {
      await this.rabbitmqTelegramConsumerService.stop();
    }
    if (this.rabbitmqSlackConsumerService) {
      await this.rabbitmqSlackConsumerService.stop();
    }
    this.telegramBotService.stop('SIGINT');
    this.slackBotService.stop('SIGINT');
  }
} 