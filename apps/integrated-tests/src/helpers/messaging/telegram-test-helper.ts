import { waitFor, waitForCondition } from '../utilities/wait-for';
import { timeouts } from '../../config';
import { SimpleTelegramClient, TelegramCall } from '../../test-clients/simple-telegram.client';

export interface TelegramMessage {
  chatId: string | number;
  text: string;
  [key: string]: any;
}

export class TelegramTestHelper {
  constructor(private client: SimpleTelegramClient) {}

  async waitForMessage(
    predicate: (message: TelegramMessage) => boolean,
    options?: { timeout?: number; errorMessage?: string }
  ): Promise<TelegramMessage> {
    const startCount = this.client.getCapturedCalls().length;

    return waitFor(
      () => {
        const calls = this.getNewCalls(startCount);
        const messages = this.toMessages(calls);
        return messages.find(msg => predicate(msg)) as TelegramMessage;
      },
      {
        timeout: options?.timeout || timeouts.wait.default,
        errorMessage: options?.errorMessage || 'Telegram message not received'
      }
    );
  }

  async waitForMessageCount(
    expectedCount: number,
    options?: {
      timeout?: number;
      fromUser?: string;
      containing?: string;
    }
  ): Promise<TelegramMessage[]> {
    const startCount = this.client.getCapturedCalls().length;

    await waitForCondition(
      () => {
        const calls = this.getNewCalls(startCount);
        const filteredCalls = this.filterCalls(calls, options);
        return filteredCalls.length >= expectedCount;
      },
      `Expected ${expectedCount} messages but got less`,
      { timeout: options?.timeout || timeouts.wait.default }
    );

    const calls = this.getNewCalls(startCount);
    const filteredCalls = this.filterCalls(calls, options);

    return this.toMessages(filteredCalls.slice(0, expectedCount));
  }

  async waitForUserMessage(
    userId: string,
    options?: { timeout?: number; containing?: string }
  ): Promise<TelegramMessage> {
    return this.waitForMessage(
      (msg) => {
        const matchesUser = msg.chatId.toString() === userId;
        const matchesText = !options?.containing || msg.text.includes(options.containing);
        return matchesUser && matchesText;
      },
      {
        timeout: options?.timeout,
        errorMessage: `No message received for user ${userId}`
      }
    );
  }

  async waitForNoMessages(
    duration: number = timeouts.wait.short,
    options?: { fromUser?: string }
  ): Promise<void> {
    const startCount = this.client.getCapturedCalls().length;

    await new Promise(resolve => setTimeout(resolve, duration));

    const newCalls = this.getNewCalls(startCount);
    const filteredCalls = this.filterCalls(newCalls, options);

    if (filteredCalls.length > 0) {
      throw new Error(
        `Expected no messages but received ${filteredCalls.length} message(s)`
      );
    }
  }

  getAllMessages(): TelegramMessage[] {
    return this.toMessages(this.client.getCapturedCalls());
  }

  getCallCount(): number {
    return this.client.getCapturedCalls().length;
  }

  private filterCalls(
    calls: readonly TelegramCall[],
    options?: { fromUser?: string; containing?: string }
  ): readonly TelegramCall[] {
    let filteredCalls: readonly TelegramCall[] = calls;

    if (options?.fromUser) {
      filteredCalls = filteredCalls.filter(
        ([chatId]) => chatId.toString() === options.fromUser
      );
    }

    if (options?.containing) {
      filteredCalls = filteredCalls.filter(
        ([, text]) => text.includes(options.containing!)
      );
    }

    return filteredCalls;
  }

  private getNewCalls(sinceCount: number): readonly TelegramCall[] {
    return this.client.getCapturedCalls().slice(sinceCount);
  }

  private toMessages(calls: readonly TelegramCall[]): TelegramMessage[] {
    return calls.map(([chatId, text, options = {}]) => ({
      chatId,
      text,
      ...options
    }));
  }
}
