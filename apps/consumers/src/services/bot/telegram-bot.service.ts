/**
 * Telegram Bot Service
 * Handles all Telegram bot functionality including commands, notifications, and user interactions.
 * Consolidates both interactive commands and notification sending capabilities.
 */

import { Markup } from 'telegraf';
import { telegramMessages, uiMessages, ExplorerService, appendUtmParams } from '@notification-system/messages';
import { TelegramDAOService } from '../dao/telegram-dao.service';
import { TelegramWalletService } from '../wallet/telegram-wallet.service';
import { EnsResolverService } from '../ens-resolver.service';
import { MatchedContext } from '../../interfaces/bot.interface';
import { NotificationPayload } from '../../interfaces/notification.interface';
import { TelegramClientInterface } from '../../interfaces/telegram-client.interface';
import { BotServiceInterface } from '../../interfaces/bot-service.interface';

export class TelegramBotService implements BotServiceInterface {
  private telegramClient: TelegramClientInterface;
  private daoService: TelegramDAOService;
  private walletService: TelegramWalletService;
  private explorerService: ExplorerService;
  private ensResolver: EnsResolverService;

  constructor(
    telegramClient: TelegramClientInterface,
    daoService: TelegramDAOService,
    walletService: TelegramWalletService,
    explorerService: ExplorerService,
    ensResolver: EnsResolverService
  ) {
    this.telegramClient = telegramClient;
    this.daoService = daoService;
    this.walletService = walletService;
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
      [uiMessages.buttons.learnMore]
    ])
    .resize()
    .persistent();
  }

  private setupCommands(): void {
    this.telegramClient.setupHandlers((handlers) => {
      handlers.command(/^start$/i, async (ctx) => {
        await ctx.reply(uiMessages.welcome, this.createPersistentKeyboard());
      });

      handlers.command(/^learn_more$/i, async (ctx) => {
        await ctx.reply(uiMessages.help, {
          parse_mode: 'HTML',
          ...this.createPersistentKeyboard()
        });
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
        await ctx.reply(uiMessages.help, {
          parse_mode: 'HTML',
          ...this.createPersistentKeyboard()
        });
      });

      handlers.action(/^dao_toggle_(\w+)$/, async (ctx) => {
        const matchedCtx = ctx as MatchedContext;
        const daoName = matchedCtx.match[1];
        await this.daoService.toggle(ctx, daoName);
        await ctx.answerCbQuery();
      });

      handlers.action(/^dao_confirm$/, async (ctx) => {
        await this.daoService.confirm(ctx);
        await ctx.answerCbQuery();
      });

      // Wallet action handlers
      handlers.action(/^wallet_add$/, async (ctx) => {
        await this.walletService.addWallet(ctx);
        await ctx.answerCbQuery();
      });

      handlers.action(/^wallet_remove$/, async (ctx) => {
        await this.walletService.removeWallet(ctx);
        await ctx.answerCbQuery();
      });

      handlers.action(/^wallet_toggle_(.+)$/, async (ctx) => {
        const matchedCtx = ctx as MatchedContext;
        const address = matchedCtx.match[1];
        await this.walletService.toggleWalletForRemoval(ctx, address);
        await ctx.answerCbQuery();
      });

      handlers.action(/^wallet_confirm_remove$/, async (ctx) => {
        await this.walletService.confirmRemoval(ctx);
        await ctx.answerCbQuery();
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