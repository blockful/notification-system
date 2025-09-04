/**
 * Real Telegram Client Implementation
 * Production implementation using Telegraf library
 */

import { Telegraf, Context } from 'telegraf';
import { session } from 'telegraf/session';
import { Message } from 'telegraf/types';
import { 
  TelegramClientInterface, 
  SendMessageOptions, 
  HandlerRegistration 
} from '../interfaces/telegram-client.interface';
import { ContextWithSession } from '../interfaces/bot.interface';

export class TelegramClient implements TelegramClientInterface {
  private bot: Telegraf<ContextWithSession>;
  private running: boolean = false;
  private sendOnlyMode: boolean;

  constructor(token: string, options?: { sendOnlyMode?: boolean }) {
    this.bot = new Telegraf<ContextWithSession>(token);
    this.bot.use(session());
    this.sendOnlyMode = options?.sendOnlyMode || false;
  }

  async sendMessage(
    chatId: string | number,
    text: string,
    options?: SendMessageOptions
  ): Promise<Message.TextMessage> {
    return this.bot.telegram.sendMessage(chatId, text, options);
  }

  setupHandlers(registration: (handlers: HandlerRegistration) => void): void {
    const handlers: HandlerRegistration = {
      command: (command, handler) => {
        this.bot.command(command, handler as any);
      },
      hears: (text, handler) => {
        this.bot.hears(text, handler as any);
      },
      action: (action, handler) => {
        this.bot.action(action, handler as any);
      },
      on: (event, handler) => {
        this.bot.on(event as any, handler as any);
      },
      use: (middleware) => {
        this.bot.use(middleware);
      }
    };

    registration(handlers);
  }

  async launch(): Promise<void> {
    if (this.sendOnlyMode) {
      // In send-only mode, don't start polling/webhook
      this.running = true;
      console.log('🤖 Bot ready for sending messages (send-only mode)');
      return;
    }
    
    await this.bot.launch();
    this.running = true;
    console.log('🤖 Bot is running...');
  }

  stop(signal?: string): void {
    if (this.running) {
      // Only call bot.stop() if we actually launched it (not in send-only mode)
      if (!this.sendOnlyMode) {
        this.bot.stop(signal || 'SIGINT');
      }
      this.running = false;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get the underlying Telegraf instance
   * @dev Only for advanced use cases where direct access is needed
   */
  getBotInstance(): Telegraf<ContextWithSession> {
    return this.bot;
  }
}