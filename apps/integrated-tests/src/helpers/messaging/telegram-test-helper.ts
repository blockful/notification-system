import { jest } from '@jest/globals';
import { waitFor, waitForCondition } from '../utilities/wait-for';
import { timeouts } from '../../config';

/**
 * @notice Represents a Telegram message in test context
 * @dev Structure matches Jest mock call format: [chatId, text, ...additionalOptions]
 */
export interface TelegramMessage {
  /// @notice Chat ID (user ID or group ID)
  chatId: string | number;
  /// @notice Message text content
  text: string;
  /// @notice Additional Telegram API options (parse_mode, reply_markup, etc.)
  [key: string]: any;
}

/**
 * @notice Test helper for Telegram message assertions and waiting
 * @dev Wraps Jest mock to provide async waiting and filtering capabilities for integration tests
 */
export class TelegramTestHelper {
  /**
   * @notice Creates a new Telegram test helper
   * @param mockSendMessage Jest mock of the Telegram sendMessage function
   */
  constructor(private mockSendMessage: jest.Mock) {}

  /**
   * @notice Waits for a message matching the given predicate
   * @param predicate Function to test each message
   * @param options Configuration for timeout and error messaging
   * @return Promise that resolves with the matching message
   */
  async waitForMessage(
    predicate: (message: TelegramMessage) => boolean,
    options?: { timeout?: number; errorMessage?: string }
  ): Promise<TelegramMessage> {
    const startCount = this.mockSendMessage.mock.calls.length;
    
    return waitFor(
      () => {
        const calls = this.getNewCalls(startCount);
        const message = calls.find(call => {
          const [chatId, text, ...rest] = call;
          const msg: TelegramMessage = { chatId, text, ...rest };
          return predicate(msg);
        });
        return message ? { 
          chatId: message[0], 
          text: message[1],
          ...message[2] 
        } : null;
      },
      {
        timeout: options?.timeout || timeouts.wait.default,
        errorMessage: options?.errorMessage || 'Telegram message not received'
      }
    );
  }

  /**
   * @notice Waits for a specific number of messages with optional filtering
   * @param expectedCount Number of messages to wait for
   * @param options Filtering and timeout options
   * @return Promise that resolves with the matching messages
   */
  async waitForMessageCount(
    expectedCount: number,
    options?: { 
      timeout?: number; 
      fromUser?: string;
      containing?: string;
    }
  ): Promise<TelegramMessage[]> {
    const startCount = this.mockSendMessage.mock.calls.length;
    
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
    
    return filteredCalls.slice(0, expectedCount).map(call => ({
      chatId: call[0],
      text: call[1],
      ...call[2]
    }));
  }

  /**
   * @notice Waits for a message sent to a specific user
   * @param userId Target user ID to wait for
   * @param options Configuration for timeout and text filtering
   * @return Promise that resolves with the user's message
   */
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

  /**
   * @notice Waits and ensures no messages are sent during the duration
   * @param duration Time in milliseconds to wait (default: 1000ms)
   * @param options Filtering options to check specific users
   * @dev Useful for negative testing - ensuring messages are NOT sent
   */
  async waitForNoMessages(
    duration: number = timeouts.wait.short,
    options?: { fromUser?: string }
  ): Promise<void> {
    const startCount = this.mockSendMessage.mock.calls.length;
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    const newCalls = this.getNewCalls(startCount);
    const filteredCalls = this.filterCalls(newCalls, options);
    
    if (filteredCalls.length > 0) {
      throw new Error(
        `Expected no messages but received ${filteredCalls.length} message(s)`
      );
    }
  }

  /**
   * @notice Gets all messages sent during the test
   * @return Array of all Telegram messages sent via the mock
   */
  getAllMessages(): TelegramMessage[] {
    return this.mockSendMessage.mock.calls.map(call => ({
      chatId: call[0] as string | number,
      text: call[1] as string,
      ...(call[2] || {})
    }));
  }

  /**
   * @notice Filters mock calls based on user and text content
   * @param calls Array of mock call data
   * @param options Filtering criteria
   * @return Filtered array of calls
   */
  private filterCalls(
    calls: any[], 
    options?: { fromUser?: string; containing?: string }
  ): any[] {
    let filteredCalls = calls;
    
    if (options?.fromUser) {
      filteredCalls = filteredCalls.filter(
        call => call[0].toString() === options.fromUser
      );
    }
    
    if (options?.containing) {
      filteredCalls = filteredCalls.filter(
        call => call[1].includes(options.containing!)
      );
    }
    
    return filteredCalls;
  }

  /**
   * @notice Gets new mock calls since a given count
   * @param sinceCount Starting count to slice from
   * @return Array of new mock calls
   */
  private getNewCalls(sinceCount: number): any[] {
    return this.mockSendMessage.mock.calls.slice(sinceCount);
  }

}