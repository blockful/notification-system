/**
 * Slack Test Client
 * Provides both mock and real Slack client for integration testing
 * Similar to TelegramTestClient but for Slack platform
 */

import { WebClient } from '@slack/web-api';
import {
  SlackClientInterface,
  SlackSendMessageOptions,
  SlackMessage
} from '@notification-system/consumer/src/interfaces/slack-client.interface';
import { jest } from '@jest/globals';

/**
 * Test implementation of Slack client that can operate in mock or real mode
 * Used for integration testing with controllable behavior
 */
export class SlackTestClient implements SlackClientInterface {
  private realClient?: WebClient;
  private mockSendMessage: jest.Mock;
  private isRealMode: boolean;

  /**
   * Creates a new Slack test client
   * @param mockSendMessage Jest mock function for assertions
   * @param botToken Optional bot token for real Slack API calls
   */
  constructor(mockSendMessage: jest.Mock, botToken?: string) {
    this.mockSendMessage = mockSendMessage;
    this.isRealMode = !!botToken;

    if (botToken) {
      this.realClient = new WebClient(botToken);
    }
  }

  /**
   * Sends a message to Slack channel or user
   * @param channel Channel ID or user ID to send to
   * @param text Message text with Telegram markdown
   * @param options Additional Slack message options
   * @returns Promise resolving to sent message details
   */
  async sendMessage(
    channel: string,
    text: string,
    options?: SlackSendMessageOptions
  ): Promise<SlackMessage> {
    // Convert markdown to Slack mrkdwn format
    const slackText = this.convertMarkdownToSlackFormat(text);

    // Always call the mock for test assertions
    this.mockSendMessage(channel, slackText, options);

    if (this.isRealMode && this.realClient) {
      // Send real message to Slack
      const result = await this.realClient.chat.postMessage({
        channel,
        text: slackText,
        parse: options?.parse || 'none',
        link_names: options?.link_names ?? true,
        unfurl_links: options?.unfurl_links ?? false,
        unfurl_media: options?.unfurl_media ?? false,
        mrkdwn: options?.mrkdwn ?? true
      });

      return {
        ts: result.ts as string, // ts is Slack's unique message identifier format combining Unix timestamp + microseconds for guaranteed uniqueness
        channel: result.channel as string,
        text: slackText
      };
    } else {
      // Return mock response
      const ts = `${Date.now()}.000000`; // ts is Slack's unique message identifier format combining Unix timestamp + microseconds for guaranteed uniqueness
      return {
        ts, 
        channel,
        text: slackText
      };
    }
  }

  /**
   * Gets message history from a Slack channel (for real mode validation)
   * @param channel Channel ID to fetch history from
   * @param limit Number of messages to fetch
   * @returns Array of messages from the channel
   */
  async getMessageHistory(channel: string, limit: number = 10): Promise<any[]> {
    if (!this.isRealMode || !this.realClient) {
      // In mock mode, return mock calls as history
      return this.mockSendMessage.mock.calls
        .filter(([ch]) => ch === channel)
        .map(([ch, text, opts]) => ({
          text,
          channel: ch,
          ts: `${Date.now()}.000000`, // ts is Slack's unique message identifier format combining Unix timestamp + microseconds for guaranteed uniqueness
          type: 'message'
        }));
    }

    const result = await this.realClient.conversations.history({
      channel,
      limit,
      inclusive: true
    });

    return result.messages || [];
  }

  /**
   * Convert Telegram markdown to Slack mrkdwn format
   * @param text Text with Telegram markdown formatting
   * @returns Text with Slack mrkdwn formatting
   */
  private convertMarkdownToSlackFormat(text: string): string {
    return text
      // Convert [text](url) links to <url|text> format
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>')
      // Convert **bold** to *bold*
      .replace(/\*\*([^*]+)\*\*/g, '*$1*');
  }

  /**
   * Gets the mock function for test assertions
   * @returns The jest mock function
   */
  getMock(): jest.Mock {
    return this.mockSendMessage;
  }
}