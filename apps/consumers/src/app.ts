import { AxiosInstance } from 'axios';
import { TelegramBotService } from './services/telegram-bot.service';
import { SlackBotService } from './services/slack-bot.service';
import { DAOService } from './services/dao.service';
import { WalletService } from './services/wallet.service';
import { ExplorerService } from './services/explorer.service';
import { EnsResolverService } from './services/ens-resolver.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { SubscriptionAPIService } from './services/subscription-api.service';
import { RabbitMQNotificationConsumerService } from './services/rabbitmq-notification-consumer.service';
import { RabbitMQSlackConsumerService } from './services/rabbitmq-slack-consumer.service';
import { TelegramClientInterface } from './interfaces/telegram-client.interface';
import { SlackClientInterface } from './interfaces/slack-client.interface';

export class App {
  private telegramBotService: TelegramBotService;
  private slackBotService: SlackBotService;
  private rabbitmqTelegramConsumerService?: RabbitMQNotificationConsumerService;
  private rabbitmqSlackConsumerService?: RabbitMQSlackConsumerService;
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
    this.slackBotService = new SlackBotService(
      slackClient,
      explorerService,
      ensResolver
    );
    this.rabbitmqUrl = rabbitmqUrl;
  }

  async start(): Promise<void> {
    // Start Telegram consumer
    this.rabbitmqTelegramConsumerService = await RabbitMQNotificationConsumerService.create(
      this.rabbitmqUrl,
      this.telegramBotService
    );
    await this.telegramBotService.launch();
    console.log('✅ Telegram bot is running!');

    // Start Slack consumer
    this.rabbitmqSlackConsumerService = await RabbitMQSlackConsumerService.create(
      this.rabbitmqUrl,
      this.slackBotService
    );
    console.log('✅ Slack bot is running!');
  }

  async stop(): Promise<void> {
    if (this.rabbitmqTelegramConsumerService) {
      await this.rabbitmqTelegramConsumerService.stop();
    }
    if (this.rabbitmqSlackConsumerService) {
      await this.rabbitmqSlackConsumerService.stop();
    }
    this.telegramBotService.stop('SIGINT');
  }
} 