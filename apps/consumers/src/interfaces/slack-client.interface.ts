/**
 * Slack Client Interface
 * Defines the contract for Slack bot operations similar to TelegramClientInterface
 */

export interface SlackSendMessageOptions {
  parse?: 'full' | 'none';
  link_names?: boolean;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  mrkdwn?: boolean;
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
}