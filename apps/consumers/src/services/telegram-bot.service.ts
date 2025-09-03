/**
 * Telegram Bot Service
 * Handles all Telegram bot functionality including commands, notifications, and user interactions.
 * Consolidates both interactive commands and notification sending capabilities.
 */

import { Markup } from 'telegraf';
import { WELCOME_MESSAGE, HELP_MESSAGE, DAOS_BUTTON_TEXT, LEARN_MORE_BUTTON_TEXT, MY_WALLETS_BUTTON_TEXT } from '../messages';
import { DAOService } from '../services/dao.service';
import { WalletService } from '../services/wallet.service';
import { ExplorerService } from '../services/explorer.service';
import { EnsResolverService } from '../services/ens-resolver.service';
import { ContextWithSession, MatchedContext } from '../interfaces/bot.interface';
import { NotificationPayload } from '../interfaces/notification.interface';
import { TelegramClient } from '../interfaces/telegram-client.interface';

export class TelegramBotService {
  private telegramClient: TelegramClient;
  private daoService: DAOService;
  private walletService: WalletService;
  private explorerService: ExplorerService;
  private ensResolver: EnsResolverService;

  constructor(
    telegramClient: TelegramClient,
    daoService: DAOService, 
    walletService: WalletService,
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
      [DAOS_BUTTON_TEXT, MY_WALLETS_BUTTON_TEXT],
      [LEARN_MORE_BUTTON_TEXT]
    ])
    .resize()
    .persistent();
  }

  private setupCommands(): void {
    this.telegramClient.setupHandlers((handlers) => {
      handlers.command(/^start$/i, async (ctx) => {
        await ctx.reply(WELCOME_MESSAGE, this.createPersistentKeyboard());
      });

      handlers.command(/^learn_more$/i, async (ctx) => {
        await ctx.reply(HELP_MESSAGE, { 
          parse_mode: 'HTML',
          ...this.createPersistentKeyboard() 
        });
      });

      handlers.command(/^daos$/i, async (ctx) => {
        await this.daoService.initialize(ctx as ContextWithSession);
      });

      handlers.command(/^wallets$/i, async (ctx) => {
        await this.walletService.initialize(ctx);
      });

      handlers.hears(DAOS_BUTTON_TEXT, async (ctx) => {
        await this.daoService.initialize(ctx);
      });

      handlers.hears(MY_WALLETS_BUTTON_TEXT, async (ctx) => {
        await this.walletService.initialize(ctx);
      });

      handlers.hears(LEARN_MORE_BUTTON_TEXT, async (ctx) => {
        await ctx.reply(HELP_MESSAGE, { 
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
        
        await ctx.reply('Please use the buttons below or type /learn_more for more information.', 
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
    
    // Process transaction link if transaction metadata is provided
    if (payload.metadata?.transaction) {
      const { hash, chainId } = payload.metadata.transaction;
      const txUrl = this.explorerService.getTransactionLink(chainId, hash);
      const markdownLink = `[Transaction details](${txUrl})`;
      processedMessage = processedMessage.replace('{{txLink}}', markdownLink);
    }
    
    // Process ENS names if addresses are provided in metadata
    if (payload.metadata?.addresses) {
      for (const [placeholder, address] of Object.entries(payload.metadata.addresses)) {
        const displayName = await this.ensResolver.resolveDisplayName(address);
        processedMessage = processedMessage.replace(`{{${placeholder}}}`, displayName);
      }
    }
    
    const sentMessage = await this.telegramClient.sendMessage(
      payload.channelUserId, 
      processedMessage,
      { parse_mode: 'Markdown' }
    );
    return `${sentMessage.message_id}`;
  }
} 