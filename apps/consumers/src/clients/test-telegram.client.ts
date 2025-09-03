/**
 * Test Telegram Client Implementation
 * Test implementation that captures messages for validation
 */

import { Message } from 'telegraf/types';
import { 
  TelegramClient, 
  SendMessageOptions, 
  HandlerRegistration 
} from '../interfaces/telegram-client.interface';

export interface CapturedMessage {
  chatId: string | number;
  text: string;
  options?: SendMessageOptions;
  timestamp: Date;
}

export class TestTelegramClient implements TelegramClient {
  private messages: CapturedMessage[] = [];
  private running: boolean = false;
  private handlers: {
    commands: Map<string | RegExp, Function>;
    hears: Map<string | RegExp, Function>;
    actions: Map<string | RegExp, Function>;
    events: Map<string, Function>;
  } = {
    commands: new Map(),
    hears: new Map(),
    actions: new Map(),
    events: new Map()
  };

  /**
   * Optional spy function to be called when sendMessage is invoked
   * This allows tests to use Jest mocks if needed
   */
  private sendMessageSpy?: any;

  constructor(sendMessageSpy?: any) {
    this.sendMessageSpy = sendMessageSpy;
  }

  async sendMessage(
    chatId: string | number,
    text: string,
    options?: SendMessageOptions
  ): Promise<Message.TextMessage> {
    const message: CapturedMessage = {
      chatId,
      text,
      options,
      timestamp: new Date()
    };

    this.messages.push(message);

    // Call spy if provided (for compatibility with existing tests)
    if (this.sendMessageSpy) {
      this.sendMessageSpy(chatId, text, options);
    }

    // Return mock message object
    return {
      message_id: Math.floor(Math.random() * 1000000),
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

  setupHandlers(registration: (handlers: HandlerRegistration) => void): void {
    const handlers: HandlerRegistration = {
      command: (command, handler) => {
        this.handlers.commands.set(command, handler);
      },
      hears: (text, handler) => {
        this.handlers.hears.set(text, handler);
      },
      action: (action, handler) => {
        this.handlers.actions.set(action, handler);
      },
      on: (event, handler) => {
        this.handlers.events.set(event, handler);
      },
      use: (_middleware) => {
        // No-op for test client
      }
    };

    registration(handlers);
  }

  async launch(): Promise<void> {
    this.running = true;
    console.log('🤖 Test bot ready (not polling)');
  }

  stop(_signal?: string): void {
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get all captured messages
   * @returns Array of captured messages
   */
  getCapturedMessages(): CapturedMessage[] {
    return [...this.messages];
  }

  /**
   * Clear captured messages
   */
  clearCapturedMessages(): void {
    this.messages = [];
  }

  /**
   * Get messages sent to a specific chat
   * @param chatId The chat ID to filter by
   * @returns Array of messages sent to that chat
   */
  getMessagesForChat(chatId: string | number): CapturedMessage[] {
    return this.messages.filter(m => m.chatId === chatId);
  }

  /**
   * Get the last message sent
   * @returns The last captured message or undefined
   */
  getLastMessage(): CapturedMessage | undefined {
    return this.messages[this.messages.length - 1];
  }

  /**
   * Wait for a message to be sent (useful in tests)
   * @param predicate Function to test each message
   * @param timeout Maximum time to wait in milliseconds
   * @returns Promise that resolves with the matching message
   */
  async waitForMessage(
    predicate: (message: CapturedMessage) => boolean,
    timeout: number = 5000
  ): Promise<CapturedMessage> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const message = this.messages.find(predicate);
      if (message) {
        return message;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`No message matching predicate found within ${timeout}ms`);
  }
}