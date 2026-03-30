import { AxiosInstance } from 'axios';
import { TelegramBotService } from './services/bot/telegram-bot.service';
import { SlackBotService } from './services/bot/slack-bot.service';
import { WebhookService } from './services/webhook/webhook.service';
import { WebhookController } from './services/webhook/webhook.controller';
import { WebhookServer } from './services/webhook/webhook-server';
import { SlackDAOService } from './services/dao/slack-dao.service';
import { SlackWalletService } from './services/wallet/slack-wallet.service';
import { SlackSettingsService } from './services/settings/slack-settings.service';
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
  private webhookService: WebhookService;
  private webhookServer: WebhookServer;
  private rabbitmqTelegramConsumerService?: RabbitMQNotificationConsumerService<TelegramBotService>;
  private rabbitmqSlackConsumerService?: RabbitMQNotificationConsumerService<SlackBotService>;
  private rabbitmqWebhookConsumerService?: RabbitMQNotificationConsumerService<WebhookService>;
  private rabbitmqUrl: string;
  private webhookPort: number;

  constructor(
    subscriptionServerUrl: string,
    httpClient: AxiosInstance,
    rabbitmqUrl: string,
    ensResolver: EnsResolverService,
    telegramClient: TelegramClientInterface,
    slackClient: SlackClientInterface,
    webhookPort: number
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
    const slackSettingsService = new SlackSettingsService(subscriptionApi);

    this.slackBotService = new SlackBotService(
      slackClient,
      ensResolver,
      slackDaoService,
      slackWalletService,
      slackSettingsService
    );

    this.webhookService = new WebhookService(anticaptureClient, subscriptionApi);

    const webhookController = new WebhookController(this.webhookService);
    this.webhookServer = new WebhookServer(webhookController);

    this.rabbitmqUrl = rabbitmqUrl;
    this.webhookPort = webhookPort;
  }

  async start(): Promise<void> {
    this.rabbitmqTelegramConsumerService = await RabbitMQNotificationConsumerService.create(
      this.rabbitmqUrl,
      this.telegramBotService,
      'telegram'
    );
    console.log('Telegram consumer connected to RabbitMQ');

    this.rabbitmqSlackConsumerService = await RabbitMQNotificationConsumerService.create(
      this.rabbitmqUrl,
      this.slackBotService,
      'slack'
    );
    console.log('Slack consumer connected to RabbitMQ');

    this.rabbitmqWebhookConsumerService = await RabbitMQNotificationConsumerService.create(
      this.rabbitmqUrl,
      this.webhookService,
      'webhook'
    );
    console.log('Webhook consumer connected to RabbitMQ');

    await this.webhookServer.start(this.webhookPort);

    this.telegramBotService.launch();
    this.slackBotService.launch();

    console.log('All bot services have been initialized');
  }

  async stop(): Promise<void> {
    if (this.rabbitmqTelegramConsumerService) {
      await this.rabbitmqTelegramConsumerService.stop();
    }
    if (this.rabbitmqSlackConsumerService) {
      await this.rabbitmqSlackConsumerService.stop();
    }
    if (this.rabbitmqWebhookConsumerService) {
      await this.rabbitmqWebhookConsumerService.stop();
    }
    await this.webhookServer.stop();
    this.telegramBotService.stop('SIGINT');
    this.slackBotService.stop('SIGINT');
  }
} 