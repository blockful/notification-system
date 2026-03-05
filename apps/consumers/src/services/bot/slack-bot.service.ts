/**
 * Slack Bot Service
 * Handles notification delivery to Slack channels and users
 * Provides interactive commands and subscription management via Socket Mode
 * Similar to TelegramBotService but for Slack platform
 */

import { SlackClientInterface } from '../../interfaces/slack-client.interface';
import { NotificationPayload } from '../../interfaces/notification.interface';
import { BotServiceInterface } from '../../interfaces/bot-service.interface';
import { slackMessages, convertMarkdownToSlack, appendUtmParams } from '@notification-system/messages';
import { EnsResolverService } from '../ens-resolver.service';
import { SlackDAOService } from '../dao/slack-dao.service';
import { SlackWalletService } from '../wallet/slack-wallet.service';
import { SlackCommandContext } from '../../interfaces/slack-context.interface';

export class SlackBotService implements BotServiceInterface {
  private slackClient: SlackClientInterface;
  private ensResolver: EnsResolverService;
  private daoService?: SlackDAOService;
  private walletService?: SlackWalletService;

  constructor(
    slackClient: SlackClientInterface,
    ensResolver: EnsResolverService,
    daoService?: SlackDAOService,
    walletService?: SlackWalletService
  ) {
    this.slackClient = slackClient;
    this.ensResolver = ensResolver;
    this.daoService = daoService;
    this.walletService = walletService;

    this.setupCommands();
  }

  /**
   * Setup slash commands and interactive handlers
   */
  private setupCommands(): void {
    this.slackClient.setupHandlers!((handlers) => {
      // App Home
      handlers.event('app_home_opened', (ctx) => this.handleAppHomeOpened(ctx));

      // Main command
      handlers.command('/anticapture', (ctx) => this.handleMainCommand(ctx));

      // Welcome message actions
      handlers.action('welcome_select_daos', async (ctx) => {
        if (this.daoService) {
          const channelId = ctx.body.channel?.id;
          const workspaceId = ctx.body.team?.id || ctx.body.user?.team_id;
          const fullUserId = `${workspaceId}:${channelId}`;
          const hasDaos = await this.daoService.hasSubscriptions(fullUserId);
          ctx.session.fromStart = !hasDaos;
          await this.daoService.initialize(ctx);
        }
      });

      handlers.action('welcome_setup_wallets', async (ctx) => {
        if (this.walletService) {
          await this.walletService.initialize(ctx);
        }
      });

      // DAO list actions
      handlers.action('dao_subscribe', async (ctx) => {
        if (this.daoService) {
          await this.daoService.initialize(ctx);
        }
      });

      handlers.action('dao_edit_subscriptions', async (ctx) => {
        if (this.daoService) {
          await this.daoService.initialize(ctx);
        }
      });

      handlers.action('dao_confirm_subscribe', async (ctx) => {
        if (this.daoService) {
          await this.daoService.confirm(ctx);

          // If from onboarding flow, trigger wallet setup
          if (ctx.session.fromStart && this.walletService) {
            await this.walletService.showOnboardingWallet(ctx);
            ctx.session.fromStart = false;
          }
        }
      });

      handlers.action('dao_checkboxes', async (ctx) => {
        await ctx.ack();
      });


      handlers.action('wallet_checkboxes', async (ctx) => {
        await ctx.ack();
      });

      // Wallet actions
      handlers.action('wallet_confirm_remove', async (ctx) => {
        if (this.walletService) {
          await this.walletService.confirmRemoval(ctx);
        }
      });

      handlers.action('wallet_add', async (ctx) => {
        if (this.walletService) {
          const firstAction = ctx.body.actions?.[0];
          ctx.session.fromStart = firstAction?.value === 'onboarding';
          await this.walletService.startAddWallet(ctx);
        }
      });

      handlers.action('wallet_remove', async (ctx) => {
        if (this.walletService) {
          await this.walletService.startRemoveWallet(ctx);
        }
      });

      // Modal submission handlers
      handlers.view('wallet_add_modal', async (ctx) => {
        if (this.walletService) {
          await this.walletService.processWalletSubmission(ctx);
        }
      });
    });
  }

  /**
   * Handle the main /anticapture command - shows welcome message
   */
  private async handleMainCommand(context: SlackCommandContext): Promise<void> {
    await context.ack();
    if (context.respond) {
      await context.respond({
        blocks: slackMessages.welcomeMessage.blocks,
        text: 'Anticapture Notification System - Manage your notification preferences',
        response_type: 'in_channel'
      });
    }
  }

  /**
   * Handle App Home opened event
   */
  private async handleAppHomeOpened(ctx: any): Promise<void> {
    try {
      const event = ctx.event as any;

      // If user opened the Home tab, publish the home page
      if (event.tab === 'home') {
        await ctx.client.views.publish({
          user_id: event.user,
          view: { type: 'home', blocks: slackMessages.homePage.blocks }
        });
      }

      // If user opened the Messages tab, send welcome message only if chat is empty
      if (event.tab === 'messages') {
        // Check if there are any messages in the conversation
        const history = await ctx.client.conversations.history({
          channel: event.channel,
          limit: 1
        });

        // Only send welcome message if there are no messages yet
        if (!history.messages || history.messages.length === 0) {
          await ctx.client.chat.postMessage({
            channel: event.user,
            blocks: slackMessages.welcomeMessage.blocks,
            text: 'Anticapture Notification System - Manage your notification preferences'
          });
        }
      }
    } catch (error) {
      console.error('Error handling app_home_opened:', error);
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

    // Convert Telegram markdown to Slack mrkdwn
    processedMessage = convertMarkdownToSlack(processedMessage);

    // Process ENS names if addresses are provided in metadata
    if (payload.metadata?.addresses) {
      for (const [placeholder, address] of Object.entries(payload.metadata.addresses)) {
        const displayName = await this.ensResolver.resolveDisplayName(address);
        const regex = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
        processedMessage = processedMessage.replace(regex, displayName);
      }
    }

    const [workspaceId, userId] = String(payload.channelUserId).split(':');

    if (!userId || !workspaceId) {
      throw new Error('Invalid Slack channel format. Expected "workspace:user"');
    }
    if (!payload.bot_token) {
      throw new Error('Slack notification requires workspace OAuth token. No bot_token provided in notification payload.');
    }

    // Append UTM tracking params to button URLs
    const triggerType = payload.metadata?.triggerType;
    const buttons = payload.metadata?.buttons?.map(btn => ({
      text: btn.text,
      url: triggerType
        ? appendUtmParams(btn.url, { source: 'notification', medium: 'slack', campaign: triggerType })
        : btn.url
    }));

    // Build message options with buttons if provided
    const messageOptions = buttons ? {
      blocks: [
        {
          type: 'section' as const,
          text: { type: 'mrkdwn' as const, text: processedMessage }
        },
        {
          type: 'actions' as const,
          elements: buttons.map(btn => ({
            type: 'button' as const,
            text: { type: 'plain_text' as const, text: btn.text },
            url: btn.url
          }))
        }
      ],
      text: processedMessage, // Fallback text
      mrkdwn: true,
      unfurl_links: false,
      token: payload.bot_token
    } : {
      mrkdwn: true,
      unfurl_links: false,
      token: payload.bot_token
    };

    const sentMessage = await this.slackClient.sendMessage(
      userId,
      processedMessage,
      messageOptions
    );

    return sentMessage.ts;
  }
}