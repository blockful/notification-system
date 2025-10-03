/**
 * Slack Bot Service
 * Handles notification delivery to Slack channels and users
 * Provides interactive commands and subscription management via Socket Mode
 * Similar to TelegramBotService but for Slack platform
 */

import { SlackClientInterface } from '../../interfaces/slack-client.interface';
import { NotificationPayload } from '../../interfaces/notification.interface';
import { BotServiceInterface } from '../../interfaces/bot-service.interface';
import { ExplorerService } from '../explorer.service';
import { EnsResolverService } from '../ens-resolver.service';
import { SlackDAOService } from '../dao/slack-dao.service';
import { SlackWalletService } from '../wallet/slack-wallet.service';
import { SlackCommandContext } from '../../interfaces/slack-context.interface';
import { slackMessages, replacePlaceholders } from '@notification-system/messages';

type CommandHandler = (context: SlackCommandContext, args: string[]) => Promise<void>;

export class SlackBotService implements BotServiceInterface {
  private slackClient: SlackClientInterface;
  private explorerService: ExplorerService;
  private ensResolver: EnsResolverService;
  private daoService?: SlackDAOService;
  private walletService?: SlackWalletService;
  private commandHandlers: Map<string, CommandHandler>;

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

    this.commandHandlers = this.createCommandRegistry();
    this.setupCommands();
  }

  /**
   * Setup slash commands and interactive handlers
   */
  private setupCommands(): void {
    this.slackClient.setupHandlers!((handlers) => {
      // App Home
      handlers.event('app_home_opened', async (ctx) => {
        try {
          await ctx.client.views.publish({
            user_id: ctx.event.user,
            view: { type: 'home', blocks: slackMessages.homePage.blocks }
          });
        } catch (error) {
          console.error('Error publishing App Home:', error);
        }
      });

      // Main command
      handlers.command('/anticapture', (ctx) => this.handleMainCommand(ctx));

      // DAO actions
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

      // Wallet actions
      handlers.action(/^wallet_toggle_(.+)$/, async (ctx) => {
        if (this.walletService) {
          await this.walletService.toggleWalletForRemoval(ctx, (ctx.body as any).actions[0].value);
        }
      });

      handlers.action('wallet_confirm_remove', async (ctx) => {
        if (this.walletService) {
          await this.walletService.confirmRemoval(ctx);
        }
      });
    });
  }

  /**
   * Create the command registry mapping commands to handlers
   */
  private createCommandRegistry(): Map<string, CommandHandler> {
    const registry = new Map<string, CommandHandler>();
    registry.set('subscribe', async (ctx, args) => this.handleDaoCommand(ctx, 'subscribe'));
    registry.set('unsubscribe', async (ctx, args) => this.handleDaoCommand(ctx, 'unsubscribe'));
    registry.set('list', async (ctx, args) => this.handleDaoList(ctx));
    registry.set('wallet', async (ctx, args) => this.handleWalletCommand(ctx, args));
    registry.set('help', async (ctx, args) => this.showHelp(ctx));
    
    return registry;
  }

  /**
   * Handle the main /anticapture command and route to subcommands
   */
  private async handleMainCommand(context: SlackCommandContext): Promise<void> {
    const text = context.body.text?.trim().toLowerCase();
    const args = text ? text.split(/\s+/) : [];
    const command = args[0] || 'help';
    const handler = this.commandHandlers.get(command) || this.commandHandlers.get('help')!;
    await handler(context, args.slice(1));
  }

  /**
   * Handle DAO subscribe/unsubscribe commands
   */
  private async handleDaoCommand(context: SlackCommandContext, action: 'subscribe' | 'unsubscribe'): Promise<void> {
    if (!this.daoService) {
      await this.respondWithError(context, 'DAO management is not available');
      return;
    }
    await this.daoService.initialize(context, action);
  }

  /**
   * Handle DAO list command
   */
  private async handleDaoList(context: SlackCommandContext): Promise<void> {
    if (!this.daoService) {
      await this.respondWithError(context, 'DAO management is not available');
      return;
    }
    await this.daoService.listSubscriptions(context);
  }

  /**
   * Handle wallet commands with subcommands
   */
  private async handleWalletCommand(context: SlackCommandContext, args: string[]): Promise<void> {
    if (!this.walletService) {
      await this.respondWithError(context, 'Wallet management is not available');
      return;
    }

    const subcommand = args[0] || 'list';
    const validSubcommands: Record<string, 'add' | 'remove' | 'list'> = {
      'add': 'add',
      'remove': 'remove',
      'list': 'list'
    };

    const action = validSubcommands[subcommand] || 'list';
    const walletAddress = args.slice(1).join(' ').trim();
    await this.walletService.initialize(context, action, walletAddress);
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
            text: `${slackMessages.header.title}\n${slackMessages.header.subtitle}`
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
              '• `/anticapture subscribe` - Subscribe to DAOs\n' +
              '• `/anticapture unsubscribe` - Unsubscribe from DAOs\n' +
              '• `/anticapture list` - List your subscriptions\n' +
              '• `/anticapture wallet add [address]` - Add a wallet address\n' +
              '• `/anticapture wallet remove` - Remove wallet addresses\n' +
              '• `/anticapture wallet list` - List your wallets\n' +
              '• `/anticapture help` - Show this help message'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: slackMessages.learnMore
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
        text: replacePlaceholders(slackMessages.error, { message }),
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

    const [workspaceId, userId] = String(payload.channelUserId).split(':');

    if (!userId || !workspaceId) {
      throw new Error('Invalid Slack channel format. Expected "workspace:user"');
    }
    if (!payload.bot_token) {
      throw new Error('Slack notification requires workspace OAuth token. No bot_token provided in notification payload.');
    }

    const sentMessage = await this.slackClient.sendMessage(
      userId,
      processedMessage,
      {
        mrkdwn: true,
        unfurl_links: false,
        token: payload.bot_token // Pass the workspace-specific token
      }
    );

    return sentMessage.ts;
  }
}