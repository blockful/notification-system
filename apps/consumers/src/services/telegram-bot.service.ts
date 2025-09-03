/**
 * Telegram Bot Service
 * Handles all Telegram bot functionality including commands, notifications, and user interactions.
 * Consolidates both interactive commands and notification sending capabilities.
 */

import { Telegraf, Markup } from 'telegraf';
import { WELCOME_MESSAGE, HELP_MESSAGE, DAOS_BUTTON_TEXT, LEARN_MORE_BUTTON_TEXT, MY_WALLETS_BUTTON_TEXT } from '../messages';
import { DAOService } from '../services/dao.service';
import { WalletService } from '../services/wallet.service';
import { ExplorerService } from '../services/explorer.service';
import { EnsResolverService } from '../services/ens-resolver.service';
import { ContextWithSession } from '../interfaces/bot.interface';
import { NotificationPayload } from '../interfaces/notification.interface';

export class TelegramBotService {
  private bot: Telegraf<ContextWithSession>;
  private daoService: DAOService;
  private walletService: WalletService;
  private explorerService: ExplorerService;
  private ensResolver: EnsResolverService;
  private originalSendMessage?: typeof this.bot.telegram.sendMessage;
  private isRunning: boolean = false;

  constructor(
    bot: Telegraf<ContextWithSession>, 
    daoService: DAOService, 
    walletService: WalletService,
    explorerService: ExplorerService,
    ensResolver: EnsResolverService
  ) {
    this.bot = bot;
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
    this.bot.command(/^start$/i, async (ctx) => {
      await ctx.reply(WELCOME_MESSAGE, this.createPersistentKeyboard());
    });

    this.bot.command(/^learn_more$/i, async (ctx) => {
      await ctx.reply(HELP_MESSAGE, { 
        parse_mode: 'HTML',
        ...this.createPersistentKeyboard() 
      });
    });

    this.bot.command(/^daos$/i, async (ctx) => {
      await this.daoService.initialize(ctx);
    });

    this.bot.command(/^wallets$/i, async (ctx) => {
      await this.walletService.initialize(ctx);
    });

    this.bot.hears(DAOS_BUTTON_TEXT, async (ctx) => {
      await this.daoService.initialize(ctx);
    });

    this.bot.hears(MY_WALLETS_BUTTON_TEXT, async (ctx) => {
      await this.walletService.initialize(ctx);
    });

    this.bot.hears(LEARN_MORE_BUTTON_TEXT, async (ctx) => {
      await ctx.reply(HELP_MESSAGE, { 
        parse_mode: 'HTML',
        ...this.createPersistentKeyboard() 
      });
    });

    this.bot.action(/^dao_toggle_(\w+)$/, async (ctx) => {
      const daoName = ctx.match[1];
      await this.daoService.toggle(ctx, daoName);
      await ctx.answerCbQuery();
    });

    this.bot.action(/^dao_confirm$/, async (ctx) => {
      await this.daoService.confirm(ctx);
      await ctx.answerCbQuery();
    });

    // Wallet action handlers
    this.bot.action(/^wallet_add$/, async (ctx) => {
      await this.walletService.addWallet(ctx);
      await ctx.answerCbQuery();
    });

    this.bot.action(/^wallet_remove$/, async (ctx) => {
      await this.walletService.removeWallet(ctx);
      await ctx.answerCbQuery();
    });

    this.bot.action(/^wallet_toggle_(.+)$/, async (ctx) => {
      const address = ctx.match[1];
      await this.walletService.toggleWalletForRemoval(ctx, address);
      await ctx.answerCbQuery();
    });

    this.bot.action(/^wallet_confirm_remove$/, async (ctx) => {
      await this.walletService.confirmRemoval(ctx);
      await ctx.answerCbQuery();
    });

    this.bot.on('message', async (ctx, next) => {
      if ('text' in ctx.message && !ctx.message.text.startsWith('/')) {
        if (ctx.session?.awaitingWalletInput) {
          await this.walletService.processWalletInput(ctx, ctx.message.text);
          return;
        }
        
        await ctx.reply('Please use the buttons below or type /learn_more for more information.', 
          this.createPersistentKeyboard());
      }
      return next();
    });
  }

  async launch(): Promise<void> {
    // Skip launch in test mode with real Telegram - we only need to send messages
    if (process.env.SEND_REAL_TELEGRAM && process.env.NODE_ENV === 'test') {
      console.log('🤖 Bot ready for sending messages (test mode - polling skipped)');
      return;
    }
    await this.bot.launch();
    this.isRunning = true;
    console.log('🤖 Bot is running...');
  }

  public stop(signal: string): void {
    // Only stop the bot if it was actually launched
    if (this.isRunning) {
      this.bot.stop(signal);
      this.isRunning = false;
    }
  }
  
  /**
   * Inject a spy function for testing purposes
   * @param spyFn Jest spy function to replace sendMessage
   * @dev Used in integration tests to capture real Telegram API calls
   */
  public injectSendMessageSpy(spyFn: any): void {
    // Store the original sendMessage if not already stored
    if (!this.originalSendMessage) {
      this.originalSendMessage = this.bot.telegram.sendMessage.bind(this.bot.telegram);
    }
    
    // Replace sendMessage with a spy that calls the original and captures the call
    this.bot.telegram.sendMessage = spyFn.mockImplementation(
      (chatId: string | number, text: string, options?: any) => {
        // Call the original sendMessage
        return this.originalSendMessage!(chatId, text, options);
      }
    );
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
    
    const sentMessage = await this.bot.telegram.sendMessage(
      payload.channelUserId, 
      processedMessage,
      { parse_mode: 'Markdown' }
    );
    return `${sentMessage.message_id}`;
  }
} 