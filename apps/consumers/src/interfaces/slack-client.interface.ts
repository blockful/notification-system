/**
 * Slack Client Interface
 * Defines the contract for Slack bot operations similar to TelegramClientInterface
 */

import { SlackHandlerRegistration } from './slack-context.interface';

export interface SlackSendMessageOptions {
  parse?: 'full' | 'none';
  link_names?: boolean;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  mrkdwn?: boolean;
  blocks?: any[];
  attachments?: any[];
  token?: string; // Optional token for multi-workspace support
}

export interface SlackMessage {
  ts: string;
  channel: string;
  text: string;
}

export interface SlackClientInterface {
  /**
   * Send a message to a Slack channel or user
   * @param channel Channel ID or user ID (e.g., 'C1234567890' or 'U1234567890')
   * @param text Message text (supports Slack markdown)
   * @param options Optional message formatting options
   * @returns Promise with sent message details
   */
  sendMessage(
    channel: string,
    text: string,
    options?: SlackSendMessageOptions
  ): Promise<SlackMessage>;

  /**
   * Setup handlers for Slack commands and interactions
   * @param registration Handler registration callback
   */
  setupHandlers?(registration: (handlers: SlackHandlerRegistration) => void): void;

  /**
   * Launch the Slack bot (start Socket Mode or webhook listener)
   * @returns Promise that resolves when bot is running
   */
  launch?(): Promise<void>;

  /**
   * Stop the Slack bot
   * @param signal The signal that triggered the stop
   */
  stop?(signal?: string): void;

  /**
   * Check if the bot is running
   * @returns true if bot is active
   */
  isRunning?(): boolean;

  /**
   * Convert Telegram markdown to Slack mrkdwn format
   * @param text Text with Telegram markdown formatting
   * @returns Text with Slack mrkdwn formatting
   */
  convertMarkdownToSlackFormat(text: string): string;
}