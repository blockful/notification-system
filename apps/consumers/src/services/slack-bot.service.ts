/**
 * Slack Bot Service
 * Handles notification delivery to Slack channels and users
 * Provides interactive commands and subscription management via Socket Mode
 * Similar to TelegramBotService but for Slack platform
 */

import { SlackClientInterface } from '../interfaces/slack-client.interface';
import { NotificationPayload } from '../interfaces/notification.interface';
import { BotServiceInterface } from '../interfaces/bot-service.interface';
import { ExplorerService } from './explorer.service';
import { EnsResolverService } from './ens-resolver.service';
import { SlackDAOService } from './slack-dao.service';
import { SlackWalletService } from './wallet/slack-wallet.service';
import { SlackCommandContext } from '../interfaces/slack-context.interface';

export class SlackBotService implements BotServiceInterface {
  private slackClient: SlackClientInterface;
  private explorerService: ExplorerService;
  private ensResolver: EnsResolverService;
  private daoService?: SlackDAOService;
  private walletService?: SlackWalletService;

  constructor(
    slackClient: SlackClientInterface,
    explorerService: ExplorerService,
    ensResolver: EnsResolverService,
    daoService?: SlackDAOService,
    walletService?: SlackWalletService
  ) {
    this.slackClient = slackClient;
    this.explorerService = explorerService;
    this.ensResolver = ensResolver;
    this.daoService = daoService;
    this.walletService = walletService;

    // Setup command handlers if Socket Mode is available
    if (this.slackClient.setupHandlers) {
      this.setupCommands();
    }
  }

  /**
   * Setup slash commands and interactive handlers
   */
  private setupCommands(): void {
    this.slackClient.setupHandlers!((handlers) => {
      // Main slash command: /dao-notify
      handlers.command('/dao-notify', async (ctx) => {
        await this.handleMainCommand(ctx);
      });

      // DAO action handlers
      handlers.action(/^dao_toggle_(subscribe|unsubscribe)_(.+)$/, async (ctx) => {
        const match = (ctx.body as any).actions[0].action_id.match(/^dao_toggle_(subscribe|unsubscribe)_(.+)$/);
        if (match && this.daoService) {
          await this.daoService.toggle(ctx, match[2]);
        }
      });

      handlers.action(/^dao_confirm_(subscribe|unsubscribe)$/, async (ctx) => {
        const match = (ctx.body as any).actions[0].action_id.match(/^dao_confirm_(subscribe|unsubscribe)$/);
        if (match && this.daoService) {
          await this.daoService.confirm(ctx, match[1] as 'subscribe' | 'unsubscribe');
        }
      });

      // Wallet action handlers
      handlers.action(/^wallet_toggle_(.+)$/, async (ctx) => {
        const match = (ctx.body as any).actions[0].value;
        if (match && this.walletService) {
          await this.walletService.toggleWalletForRemoval(ctx, match);
        }
      });

      handlers.action('wallet_confirm_remove', async (ctx) => {
        if (this.walletService) {
          await this.walletService.confirmRemoval(ctx);
        }
      });

      // Modal submission handler for wallet addition
      handlers.view('wallet_add_modal', async (ctx) => {
        if (this.walletService) {
          await this.walletService.processWalletAddition(ctx);
        }
      });
    });
  }

  /**
   * Handle the main /dao-notify command and route to subcommands
   */
  private async handleMainCommand(context: SlackCommandContext): Promise<void> {
    const text = context.body.text?.trim().toLowerCase();
    const args = text ? text.split(/\s+/) : [];
    const subcommand = args[0];
    const param = args[1];

    // Route to appropriate handler
    switch (subcommand) {
      case 'subscribe':
        if (this.daoService) {
          await this.daoService.initialize(context, 'subscribe');
        } else {
          await this.respondWithError(context, 'DAO management is not available');
        }
        break;

      case 'unsubscribe':
        if (this.daoService) {
          await this.daoService.initialize(context, 'unsubscribe');
        } else {
          await this.respondWithError(context, 'DAO management is not available');
        }
        break;

      case 'list':
        if (this.daoService) {
          await this.daoService.listSubscriptions(context);
        } else {
          await this.respondWithError(context, 'DAO management is not available');
        }
        break;

      case 'wallet':
        if (!this.walletService) {
          await this.respondWithError(context, 'Wallet management is not available');
          break;
        }

        // Handle wallet subcommands
        switch (param) {
          case 'add':
            await this.walletService.initialize(context, 'add');
            break;
          case 'remove':
            await this.walletService.initialize(context, 'remove');
            break;
          case 'list':
          default:
            await this.walletService.initialize(context, 'list');
            break;
        }
        break;

      case 'help':
      default:
        await this.showHelp(context);
        break;
    }
  }

  /**
   * Show help message
   */
  private async showHelp(context: SlackCommandContext): Promise<void> {
    await context.ack();
    if (context.respond) {
      await context.respond({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*🔔 Anticapture Notification System*\n_Spotting the "oh no" before it hits your treasury_'
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Available Commands:*\n' +
              '• `/dao-notify subscribe` - Subscribe to DAOs\n' +
              '• `/dao-notify unsubscribe` - Unsubscribe from DAOs\n' +
              '• `/dao-notify list` - List your subscriptions\n' +
              '• `/dao-notify wallet add` - Add a wallet address\n' +
              '• `/dao-notify wallet remove` - Remove wallet addresses\n' +
              '• `/dao-notify wallet list` - List your wallets\n' +
              '• `/dao-notify help` - Show this help message'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: 'Learn more at <https://anticapture.ai|anticapture.ai>'
            }
          ]
        }
      ],
      response_type: 'ephemeral'
      });
    }
  }

  /**
   * Respond with an error message
   */
  private async respondWithError(context: SlackCommandContext, message: string): Promise<void> {
    await context.ack();
    if (context.respond) {
      await context.respond({
        text: `❌ ${message}`,
        response_type: 'ephemeral'
      });
    }
  }

  /**
   * Launch the Slack bot if Socket Mode is configured
   */
  async launch(): Promise<void> {
    if (this.slackClient.launch) {
      await this.slackClient.launch();
    }
  }

  /**
   * Stop the Slack bot
   */
  stop(signal?: string): void {
    if (this.slackClient.stop) {
      this.slackClient.stop(signal);
    }
  }

  /**
   * Send a notification to a specific Slack user or channel
   * @param payload Notification payload containing user information and message
   * @returns Message timestamp of the sent notification
   * @throws Error if sending fails
   */
  public async sendNotification(payload: NotificationPayload): Promise<string> {
    let processedMessage = payload.message;

    // Process transaction link placeholder
    if (processedMessage.includes('{{txLink}}')) {
      const txUrl = payload.metadata?.transaction
        ? this.explorerService.getTransactionLink(payload.metadata.transaction.chainId, payload.metadata.transaction.hash)
        : null;

      processedMessage = txUrl
        ? processedMessage.replace('{{txLink}}', `<${txUrl}|Transaction details>`)
        : processedMessage.replace('\n\n{{txLink}}', '');
    }

    // Process ENS names if addresses are provided in metadata
    if (payload.metadata?.addresses) {
      for (const [placeholder, address] of Object.entries(payload.metadata.addresses)) {
        const displayName = await this.ensResolver.resolveDisplayName(address);
        processedMessage = processedMessage.replace(`{{${placeholder}}}`, displayName);
      }
    }

    const sentMessage = await this.slackClient.sendMessage(
      String(payload.channelUserId),
      processedMessage,
      {
        mrkdwn: true,
        unfurl_links: false
      }
    );

    return sentMessage.ts;
  }
}