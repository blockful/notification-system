import { WebClient } from '@slack/web-api';
import {
  SlackClientInterface,
  SlackSendMessageOptions,
  SlackMessage
} from '@notification-system/consumer/src/interfaces/slack-client.interface';
import { env } from '../config/env';

export type SlackCall = readonly [channel: string, text: string, options?: SlackSendMessageOptions];

export class SimpleSlackClient implements SlackClientInterface {
  private capturedCalls: SlackCall[] = [];
  private readonly isRealMode: boolean;

  constructor(private readonly realBotToken?: string) {
    this.isRealMode = !!realBotToken;
  }

  async sendMessage(
    channel: string,
    text: string,
    options?: SlackSendMessageOptions
  ): Promise<SlackMessage> {
    const slackText = this.convertMarkdownToSlackFormat(text);
    this.capturedCalls.push([channel, slackText, options]);

    const token = options?.token || this.realBotToken;

    if (this.isRealMode && token) {
      const realChannel = env.SLACK_TEST_CHANNEL_ID || channel;
      const realClient = new WebClient(token);

      const result = await realClient.chat.postMessage({
        channel: realChannel,
        text: slackText,
        blocks: options?.blocks,
        parse: options?.parse || 'none',
        link_names: options?.link_names ?? true,
        unfurl_links: options?.unfurl_links ?? false,
        unfurl_media: options?.unfurl_media ?? false,
        mrkdwn: options?.mrkdwn ?? true
      });

      if (!result.ok) {
        console.error('[SimpleSlackClient] Slack API returned ok=false:', result);
      }

      return {
        ts: result.ts as string,
        channel: result.channel as string,
        text: slackText
      };
    }

    return {
      ts: `${Date.now()}.000000`,
      channel,
      text: slackText
    };
  }

  async getMessageHistory(channel: string, limit: number = 10, token?: string): Promise<any[]> {
    const finalToken = token || this.realBotToken;

    if (this.isRealMode && finalToken) {
      const realClient = new WebClient(finalToken);
      const result = await realClient.conversations.history({
        channel,
        limit,
        inclusive: true
      });
      return result.messages || [];
    }

    return this.capturedCalls
      .filter(([ch]) => ch === channel)
      .map(([ch, text]) => ({
        text,
        channel: ch,
        ts: `${Date.now()}.000000`,
        type: 'message'
      }));
  }

  setupHandlers(): void {
    // No-op: tests don't exercise interactive handlers.
  }

  getCapturedCalls(): readonly SlackCall[] {
    return this.capturedCalls;
  }

  clearCapturedCalls(): void {
    this.capturedCalls = [];
  }

  private convertMarkdownToSlackFormat(text: string): string {
    return text
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>')
      .replace(/\*\*([^*]+)\*\*/g, '*$1*')
      .replace(/__(.*?)__/g, '_$1_');
  }
}
