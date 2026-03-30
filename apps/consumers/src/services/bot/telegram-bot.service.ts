/**
 * Telegram Bot Service
 * Handles all Telegram bot functionality including commands, notifications, and user interactions.
 * Consolidates both interactive commands and notification sending capabilities.
 */

import { Markup } from 'telegraf';
import { telegramMessages, uiMessages, ExplorerService, appendUtmParams } from '@notification-system/messages';
import { TelegramDAOService } from '../dao/telegram-dao.service';
import { TelegramWalletService } from '../wallet/telegram-wallet.service';
import { TelegramSettingsService } from '../settings/telegram-settings.service';
import { EnsResolverService } from '../ens-resolver.service';
import { ContextWithSession, MatchedContext } from '../../interfaces/bot.interface';
import { NotificationPayload } from '../../interfaces/notification.interface';
import { TelegramClientInterface } from '../../interfaces/telegram-client.interface';
import { BotServiceInterface } from '../../interfaces/bot-service.interface';

export class TelegramBotService implements BotServiceInterface {
  private telegramClient: TelegramClientInterface;
  private daoService: TelegramDAOService;
  private walletService: TelegramWalletService;
  private settingsService: TelegramSettingsService;
  private explorerService: ExplorerService;
  private ensResolver: EnsResolverService;

  constructor(
    telegramClient: TelegramClientInterface,
    daoService: TelegramDAOService,
    walletService: TelegramWalletService,
    settingsService: TelegramSettingsService,
    explorerService: ExplorerService,
    ensResolver: EnsResolverService
  ) {
    this.telegramClient = telegramClient;
    this.daoService = daoService;
    this.walletService = walletService;
    this.settingsService = settingsService;
    this.explorerService = explorerService;
    this.ensResolver = ensResolver;
    this.setupCommands();
  }

  /**
   * Creates the persistent keyboard with static buttons
   */
  private createPersistentKeyboard() {
    return Markup.keyboard([
      [uiMessages.buttons.daos, uiMessages.buttons.myWallets],
      [uiMessages.buttons.settings, uiMessages.buttons.learnMore]
    ])
    .resize()
    .persistent();
  }

  private setupCommands(): void {
    this.telegramClient.setupHandlers((handlers) => {
      handlers.command(/^start$/i, async (ctx) => {
        await this.replyStartFlow(ctx);
      });

      handlers.command(/^learn_more$/i, async (ctx) => {
        await this.replyLearnMore(ctx);
      });

      handlers.command(/^daos$/i, async (ctx) => {
        await this.daoService.initialize(ctx);
      });

      handlers.command(/^wallets$/i, async (ctx) => {
        await this.walletService.initialize(ctx);
      });

      handlers.hears(uiMessages.buttons.daos, async (ctx) => {
        await this.daoService.initialize(ctx);
      });

      handlers.hears(uiMessages.buttons.myWallets, async (ctx) => {
        await this.walletService.initialize(ctx);
      });

      handlers.hears(uiMessages.buttons.learnMore, async (ctx) => {
        await this.replyLearnMore(ctx);
      });

      handlers.command(/^settings$/i, async (ctx) => {
        await this.settingsService.initialize(ctx);
      });

      handlers.hears(uiMessages.buttons.settings, async (ctx) => {
        await this.settingsService.initialize(ctx);
      });

      handlers.action(/^start$/, async (ctx) => {
        await ctx.answerCbQuery();
        if (ctx.session) ctx.session.fromStart = true;
        await this.daoService.initialize(ctx);
      });

      handlers.action(/^dao_toggle_(\w+)$/, async (ctx) => {
        await ctx.answerCbQuery();
        const matchedCtx = ctx as MatchedContext;
        const daoName = matchedCtx.match[1];
        await this.daoService.toggle(ctx, daoName);
      });

      handlers.action(/^dao_confirm$/, async (ctx) => {
        await ctx.answerCbQuery();
        await this.daoService.confirm(ctx);
        await this.triggerWalletFlowIfFromStart(ctx);
      });

      handlers.action(/^dao_select_all$/, async (ctx) => {
        await ctx.answerCbQuery();
        await this.daoService.selectAll(ctx);
      });

      handlers.action(/^dao_unselect_all$/, async (ctx) => {
        await ctx.answerCbQuery();
        await this.daoService.unselectAll(ctx);
      });

      // Wallet action handlers
      handlers.action(/^wallet_add$/, async (ctx) => {
        await ctx.answerCbQuery();
        await this.walletService.addWallet(ctx);
      });

      handlers.action(/^wallet_remove$/, async (ctx) => {
        await ctx.answerCbQuery();
        await this.walletService.removeWallet(ctx);
      });

      handlers.action(/^wallet_toggle_(.+)$/, async (ctx) => {
        await ctx.answerCbQuery();
        const matchedCtx = ctx as MatchedContext;
        const address = matchedCtx.match[1];
        await this.walletService.toggleWalletForRemoval(ctx, address);
      });

      handlers.action(/^wallet_confirm_remove$/, async (ctx) => {
        await ctx.answerCbQuery();
        await this.walletService.confirmRemoval(ctx);
      });

      handlers.action(/^learn_more_start$/, async (ctx) => {
        await ctx.answerCbQuery();
        await this.replyStartFlow(ctx);
      });

      handlers.action(/^learn_more_daos$/, async (ctx) => {
        await ctx.answerCbQuery();
        await this.daoService.initialize(ctx);
      });

      handlers.action(/^learn_more_wallets$/, async (ctx) => {
        await ctx.answerCbQuery();
        await this.walletService.initialize(ctx);
      });

      handlers.action(/^settings_toggle_(.+)$/, async (ctx) => {
        await ctx.answerCbQuery();
        const matchedCtx = ctx as MatchedContext;
        await this.settingsService.toggle(ctx, matchedCtx.match[1]);
      });

      handlers.action(/^settings_confirm$/, async (ctx) => {
        await ctx.answerCbQuery();
        await this.settingsService.confirm(ctx);
      });

      handlers.action(/^learn_more_settings$/, async (ctx) => {
        await ctx.answerCbQuery();
        await this.settingsService.initialize(ctx);
      });

      handlers.on('message', async (ctx, next) => {
        if (ctx.message && 'text' in ctx.message && !ctx.message.text.startsWith('/')) {
        if (ctx.session?.awaitingWalletInput) {
          await this.walletService.processWalletInput(ctx, ctx.message.text);
          return;
        }
        
        await ctx.reply(telegramMessages.bot.unknownCommand, 
          this.createPersistentKeyboard());
      }
      return next();
      });
    });
  }

  private async replyStartFlow(ctx: ContextWithSession): Promise<void> {
    await ctx.reply(uiMessages.welcome, this.createPersistentKeyboard());
    await ctx.reply(uiMessages.welcomeDao, {
      reply_markup: {
        inline_keyboard: [
          [{ text: uiMessages.buttons.daos, callback_data: 'start' }]
        ]
      }
    });
  }

  private async replyLearnMore(ctx: ContextWithSession): Promise<void> {
    await ctx.reply(uiMessages.help, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: uiMessages.buttons.start, callback_data: 'learn_more_start' },
            { text: uiMessages.buttons.daos, callback_data: 'learn_more_daos' },
          ],
          [
            { text: uiMessages.buttons.wallets, callback_data: 'learn_more_wallets' },
            { text: uiMessages.buttons.settings, callback_data: 'learn_more_settings' },
          ]
        ]
      }
    });
  }

  private async triggerWalletFlowIfFromStart(ctx: ContextWithSession): Promise<void> {
    if (!ctx.session?.fromStart) return;
    const user = ctx.from?.id;
    if (user) {
      const userWallets = await this.walletService.getUserWalletsWithDisplayNames(user.toString(), 'telegram');
      if (!userWallets || userWallets.length === 0) {
        await this.walletService.initialize(ctx, true);
      }
    }
  }

  async launch(): Promise<void> {
    await this.telegramClient.launch();
  }

  public stop(signal: string): void {
    this.telegramClient.stop(signal);
  }

  /**
   * Send a notification to a specific Telegram user
   * @param payload Notification payload containing user information and message
   * @returns Message ID of the sent notification
   * @throws Error if sending fails
   */
  public async sendNotification(payload: NotificationPayload): Promise<string> {
    let processedMessage = payload.message;

    // Process ENS names if addresses are provided in metadata
    if (payload.metadata?.addresses) {
      for (const [placeholder, address] of Object.entries(payload.metadata.addresses)) {
        const displayName = await this.ensResolver.resolveDisplayName(address);
        const regex = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
        processedMessage = processedMessage.replace(regex, displayName);
      }
    }

    // Append UTM tracking params to button URLs
    const triggerType = payload.metadata?.triggerType;
    const buttons = payload.metadata?.buttons?.map(btn => ({
      text: btn.text,
      url: triggerType
        ? appendUtmParams(btn.url, { source: 'notification', medium: 'telegram', campaign: triggerType })
        : btn.url
    }));

    // Build inline keyboard if buttons are provided
    const replyMarkup = buttons ? {
      inline_keyboard: [[
        ...buttons.map(btn => ({ text: btn.text, url: btn.url }))
      ]]
    } : undefined;

    const sentMessage = await this.telegramClient.sendMessage(
      payload.channelUserId,
      processedMessage,
      {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: replyMarkup
      }
    );
    return `${sentMessage.message_id}`;
  }
} 