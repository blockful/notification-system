/**
 * Slack Client Implementation
 * Production implementation using @slack/web-api
 */

import { WebClient } from '@slack/web-api';
import {
  SlackClientInterface,
  SlackSendMessageOptions,
  SlackMessage
} from './interfaces/slack-client.interface';

export class SlackClient implements SlackClientInterface {
  private client: WebClient;

  constructor(token: string) {
    this.client = new WebClient(token);
  }

  async sendMessage(
    channel: string,
    text: string,
    options?: SlackSendMessageOptions
  ): Promise<SlackMessage> {
    // Convert markdown to Slack mrkdwn format
    const slackText = this.convertMarkdownToSlackFormat(text);

    const result = await this.client.chat.postMessage({
      channel,
      text: slackText,
      parse: options?.parse || 'none',
      link_names: options?.link_names ?? true,
      unfurl_links: options?.unfurl_links ?? false,
      unfurl_media: options?.unfurl_media ?? false,
      mrkdwn: options?.mrkdwn ?? true
    });

    if (!result.ok) {
      console.error(`Failed to send Slack message: ${result.error}`);
    }

    return {
      ts: result.ts as string,
      channel: result.channel as string,
      text: slackText
    };
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
}