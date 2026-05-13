import { Telegraf } from 'telegraf';
import { Message } from 'telegraf/types';
import {
  TelegramClientInterface,
  SendMessageOptions,
  HandlerRegistration
} from '@notification-system/consumer/dist/interfaces/telegram-client.interface';

export type TelegramCall = readonly [chatId: string | number, text: string, options?: SendMessageOptions];

export class SimpleTelegramClient implements TelegramClientInterface {
  private capturedCalls: TelegramCall[] = [];
  private running = false;
  private readonly realBot?: Telegraf;

  constructor(botToken?: string) {
    if (botToken) {
      this.realBot = new Telegraf(botToken);
    }
  }

  async sendMessage(
    chatId: string | number,
    text: string,
    options?: SendMessageOptions
  ): Promise<Message.TextMessage> {
    this.capturedCalls.push([chatId, text, options]);

    if (this.realBot) {
      try {
        return await this.realBot.telegram.sendMessage(chatId, text, options);
      } catch (error) {
        console.error('Failed to send real Telegram message:', error);
      }
    }

    return {
      message_id: Math.floor(Math.random() * 1_000_000),
      date: Math.floor(Date.now() / 1000),
      chat: {
        id: typeof chatId === 'string' ? parseInt(chatId) : chatId,
        type: 'private'
      },
      text,
      from: {
        id: 123456789,
        is_bot: true,
        first_name: 'TestBot'
      }
    } as Message.TextMessage;
  }

  setupHandlers(_registration: (handlers: HandlerRegistration) => void): void {
    // No-op: tests don't exercise interactive handlers.
  }

  async launch(): Promise<void> {
    this.running = true;
  }

  stop(_signal?: string): void {
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  getCapturedCalls(): readonly TelegramCall[] {
    return this.capturedCalls;
  }

  clearCapturedCalls(): void {
    this.capturedCalls = [];
  }
}
