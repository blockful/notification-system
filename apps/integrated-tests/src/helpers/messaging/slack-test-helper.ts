/**
 * Slack Test Helper
 * Utilities for waiting for and asserting Slack messages in integration tests
 * Similar to TelegramTestHelper but adapted for Slack's API structure
 */

import { jest } from '@jest/globals';
import { waitFor, waitForCondition } from '../utilities/wait-for';
import { timeouts } from '../../config';
import { SlackTestClient } from '../../test-clients/slack-test.client';

/**
 * Represents a mock call to Slack sendMessage
 * Tuple structure: [channel, text, options?]
 */
type MockCall = [channel: string, text: string, options?: Record<string, any>];

/**
 * Represents a Slack message in test context
 */
export interface SlackTestMessage {
  channel: string;
  text: string;
  ts?: string;
  [key: string]: any;
}

/**
 * Test helper for Slack message assertions and waiting
 * Provides async waiting and filtering capabilities for integration tests
 */
export class SlackTestHelper {
  private slackClient?: SlackTestClient;

  /**
   * Creates a new Slack test helper
   * @param mockSendMessage Jest mock of the Slack sendMessage function
   * @param slackClient Optional SlackTestClient for real mode history access
   */
  constructor(
    private mockSendMessage: jest.Mock,
    slackClient?: SlackTestClient
  ) {
    this.slackClient = slackClient;
  }

  /**
   * Waits for a message matching the given predicate
   * @param predicate Function to test each message
   * @param options Configuration for timeout and error messaging
   * @return Promise that resolves with the matching message
   */
  async waitForMessage(
    predicate: (message: SlackTestMessage) => boolean,
    options?: { timeout?: number; errorMessage?: string; useHistory?: boolean }
  ): Promise<SlackTestMessage> {
    const startCount = this.mockSendMessage.mock.calls.length;

    // If using history mode and we have a real client, poll conversations.history
    if (options?.useHistory && this.slackClient) {
      return this.waitForMessageInHistory(predicate, options);
    }

    return waitFor(
      () => {
        const calls = this.getNewCalls(startCount);
        const messages = this.toMessages(calls);
        return messages.find(msg => predicate(msg)) as SlackTestMessage;
      },
      {
        timeout: options?.timeout || timeouts.wait.default,
        errorMessage: options?.errorMessage || 'Slack message not received'
      }
    );
  }

  /**
   * Waits for a message in Slack's conversation history (real mode)
   * @param predicate Function to test each message
   * @param options Configuration options
   * @return Promise that resolves with the matching message
   */
  private async waitForMessageInHistory(
    predicate: (message: SlackTestMessage) => boolean,
    options?: { timeout?: number; errorMessage?: string; channel?: string }
  ): Promise<SlackTestMessage> {
    if (!this.slackClient) {
      throw new Error('SlackTestClient required for history mode');
    }

    // Get channel from first mock call if not provided
    const channel = options?.channel || this.getChannelFromMocks();
    if (!channel) {
      throw new Error('No channel specified or found in mock calls');
    }

    return waitFor(
      async () => {
        const history = await this.slackClient!.getMessageHistory(channel, 20);
        const messages = history.map(msg => ({
          channel,
          text: msg.text || '',
          ts: msg.ts,
          ...msg
        }));
        return messages.find(msg => predicate(msg)) as SlackTestMessage;
      },
      {
        timeout: options?.timeout || timeouts.wait.default,
        errorMessage: options?.errorMessage || 'Slack message not found in history'
      }
    );
  }

  /**
   * Waits for a specific number of messages with optional filtering
   * @param expectedCount Number of messages to wait for
   * @param options Filtering and timeout options
   * @return Promise that resolves with the matching messages
   */
  async waitForMessageCount(
    expectedCount: number,
    options?: {
      timeout?: number;
      toChannel?: string;
      containing?: string;
    }
  ): Promise<SlackTestMessage[]> {
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

    return this.toMessages(filteredCalls.slice(0, expectedCount));
  }

  /**
   * Waits for a message sent to a specific channel
   * @param channel Target channel ID to wait for
   * @param options Configuration for timeout and text filtering
   * @return Promise that resolves with the channel's message
   */
  async waitForChannelMessage(
    channel: string,
    options?: { timeout?: number; containing?: string }
  ): Promise<SlackTestMessage> {
    return this.waitForMessage(
      (msg) => {
        const matchesChannel = msg.channel === channel;
        const matchesText = !options?.containing || msg.text.includes(options.containing);
        return matchesChannel && matchesText;
      },
      {
        timeout: options?.timeout,
        errorMessage: `No message received for channel ${channel}`
      }
    );
  }

  /**
   * Waits and ensures no messages are sent during the duration
   * @param duration Time in milliseconds to wait
   * @param options Filtering options to check specific channels
   */
  async waitForNoMessages(
    duration: number = timeouts.wait.short,
    options?: { toChannel?: string }
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
   * Gets all messages sent during the test
   * @return Array of all Slack messages sent via the mock
   */
  getAllMessages(): SlackTestMessage[] {
    return this.toMessages(this.mockSendMessage.mock.calls as MockCall[]);
  }

  /**
   * Gets the total number of messages sent
   * @return Total count of messages sent via the mock
   */
  getCallCount(): number {
    return this.mockSendMessage.mock.calls.length;
  }

  /**
   * Filters mock calls based on channel and text content
   * @param calls Array of mock call data
   * @param options Filtering criteria
   * @return Filtered array of calls
   */
  private filterCalls(
    calls: MockCall[],
    options?: { toChannel?: string; containing?: string }
  ): MockCall[] {
    let filteredCalls = calls;

    if (options?.toChannel) {
      filteredCalls = filteredCalls.filter(
        ([channel]) => channel === options.toChannel
      );
    }

    if (options?.containing) {
      filteredCalls = filteredCalls.filter(
        ([, text]) => text.includes(options.containing!)
      );
    }

    return filteredCalls;
  }

  /**
   * Gets new mock calls since a given count
   * @param sinceCount Starting count to slice from
   * @return Array of new mock calls
   */
  private getNewCalls(sinceCount: number): MockCall[] {
    return this.mockSendMessage.mock.calls.slice(sinceCount) as MockCall[];
  }

  /**
   * Converts mock calls to SlackTestMessage objects
   * @param calls Array of mock call data
   * @return Array of SlackTestMessage objects
   */
  private toMessages(calls: MockCall[]): SlackTestMessage[] {
    return calls.map(([channel, text, options = {}]) => ({
      channel,
      text,
      ts: `${Date.now()}.000000`,
      ...options
    }));
  }

  /**
   * Gets the channel from the first mock call
   * @return Channel ID or undefined
   */
  private getChannelFromMocks(): string | undefined {
    const firstCall = this.mockSendMessage.mock.calls[0];
    return firstCall ? firstCall[0] : undefined;
  }
}