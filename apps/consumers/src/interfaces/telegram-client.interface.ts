/**
 * Interface for Telegram client operations
 * Abstracts the Telegram API to allow for testing and different implementations
 */

import { Message } from 'telegraf/types';
import { Context } from 'telegraf';

export interface SendMessageOptions {
  parse_mode?: 'Markdown' | 'HTML' | 'MarkdownV2';
  reply_markup?: any;
  [key: string]: any;
}

export interface HandlerRegistration {
  command(command: string | RegExp, handler: (ctx: Context) => Promise<void>): void;
  hears(text: string | RegExp, handler: (ctx: Context) => Promise<void>): void;
  action(action: string | RegExp, handler: (ctx: Context) => Promise<void>): void;
  on(event: string, handler: (ctx: Context, next: () => Promise<void>) => Promise<void>): void;
  use(middleware: any): void;
}

export interface TelegramClient {
  /**
   * Send a message to a specific chat
   * @param chatId The chat identifier
   * @param text The message text
   * @param options Additional options for the message
   * @returns The sent message
   */
  sendMessage(
    chatId: string | number,
    text: string,
    options?: SendMessageOptions
  ): Promise<Message.TextMessage>;

  /**
   * Setup handlers for bot commands and interactions
   * @param registration Handler registration callback
   */
  setupHandlers(registration: (handlers: HandlerRegistration) => void): void;

  /**
   * Launch the bot (start polling or webhook)
   * @returns Promise that resolves when bot is running
   */
  launch(): Promise<void>;

  /**
   * Stop the bot
   * @param signal The signal that triggered the stop
   */
  stop(signal?: string): void;

  /**
   * Check if the bot is running
   * @returns true if bot is active
   */
  isRunning(): boolean;
}