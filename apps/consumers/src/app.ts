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
import { createLogger, wrapWithTracing } from '@anticapture/observability';

const logger = createLogger('consumers');

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
    anticaptureBaseURL: string,
    rabbitmqUrl: string,
    ensResolver: EnsResolverService,
    telegramClient: TelegramClientInterface,
    slackClient: SlackClientInterface,
    webhookPort: number,
    anticaptureHeaders?: Record<string, string>
  ) {
    const subscriptionApi = wrapWithTracing(new SubscriptionAPIService(subscriptionServerUrl, logger));
    const anticaptureClient = wrapWithTracing(new AnticaptureClient({
      baseURL: anticaptureBaseURL,
      defaultHeaders: anticaptureHeaders,
    }));
    const explorerService = new ExplorerService();

    // Telegram services
    const telegramDaoService = wrapWithTracing(new TelegramDAOService(anticaptureClient, subscriptionApi, logger));
    const telegramWalletService = wrapWithTracing(new TelegramWalletService(subscriptionApi, ensResolver, logger));
    const telegramSettingsService = wrapWithTracing(new TelegramSettingsService(subscriptionApi, logger));

    this.telegramBotService = wrapWithTracing(new TelegramBotService(
      telegramClient,
      telegramDaoService,
      telegramWalletService,
      telegramSettingsService,
      explorerService,
      ensResolver
    ));

    const slackDaoService = wrapWithTracing(new SlackDAOService(anticaptureClient, subscriptionApi, logger));
    const slackWalletService = wrapWithTracing(new SlackWalletService(subscriptionApi, ensResolver, logger));
    const slackSettingsService = wrapWithTracing(new SlackSettingsService(subscriptionApi, logger));

    this.slackBotService = wrapWithTracing(new SlackBotService(
      slackClient,
      ensResolver,
      slackDaoService,
      slackWalletService,
      slackSettingsService,
      logger,
    ));

    this.webhookService = wrapWithTracing(new WebhookService(anticaptureClient, subscriptionApi, logger));

    const webhookController = new WebhookController(this.webhookService);
    this.webhookServer = new WebhookServer(webhookController, logger);

    this.rabbitmqUrl = rabbitmqUrl;
    this.webhookPort = webhookPort;
  }

  async start(): Promise<void> {
    this.rabbitmqTelegramConsumerService = await RabbitMQNotificationConsumerService.create(
      this.rabbitmqUrl,
      this.telegramBotService,
      'telegram',
      logger,
    );
    logger.info('telegram consumer connected to RabbitMQ');

    this.rabbitmqSlackConsumerService = await RabbitMQNotificationConsumerService.create(
      this.rabbitmqUrl,
      this.slackBotService,
      'slack',
      logger,
    );
    logger.info('slack consumer connected to RabbitMQ');

    this.rabbitmqWebhookConsumerService = await RabbitMQNotificationConsumerService.create(
      this.rabbitmqUrl,
      this.webhookService,
      'webhook',
      logger,
    );
    logger.info('webhook consumer connected to RabbitMQ');

    await this.webhookServer.start(this.webhookPort);

    this.telegramBotService.launch();
    this.slackBotService.launch();

    logger.info('all bot services initialized');
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