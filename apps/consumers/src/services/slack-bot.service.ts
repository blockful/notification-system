/**
 * Slack Bot Service
 * Handles notification delivery to Slack channels and users
 * Similar to TelegramBotService but for Slack platform
 */

import { SlackClientInterface } from '../interfaces/slack-client.interface';
import { NotificationPayload } from '../interfaces/notification.interface';
import { BotServiceInterface } from '../interfaces/bot-service.interface';
import { ExplorerService } from './explorer.service';
import { EnsResolverService } from './ens-resolver.service';

export class SlackBotService implements BotServiceInterface {
  private slackClient: SlackClientInterface;
  private explorerService: ExplorerService;
  private ensResolver: EnsResolverService;

  constructor(
    slackClient: SlackClientInterface,
    explorerService: ExplorerService,
    ensResolver: EnsResolverService
  ) {
    this.slackClient = slackClient;
    this.explorerService = explorerService;
    this.ensResolver = ensResolver;
  }

  /**
   * Send a notification to a specific Slack user or channel
   * @param payload Notification payload containing user information and message
   * @returns Message timestamp of the sent notification
   * @throws Error if sending fails
   */
  public async sendNotification(payload: NotificationPayload): Promise<string> {
    let processedMessage = payload.message;

    // Process transaction link placeholder
    if (processedMessage.includes('{{txLink}}')) {
      const txUrl = payload.metadata?.transaction
        ? this.explorerService.getTransactionLink(payload.metadata.transaction.chainId, payload.metadata.transaction.hash)
        : null;

      processedMessage = txUrl
        ? processedMessage.replace('{{txLink}}', `<${txUrl}|Transaction details>`)
        : processedMessage.replace('\n\n{{txLink}}', '');
    }

    // Process ENS names if addresses are provided in metadata
    if (payload.metadata?.addresses) {
      for (const [placeholder, address] of Object.entries(payload.metadata.addresses)) {
        const displayName = await this.ensResolver.resolveDisplayName(address);
        processedMessage = processedMessage.replace(`{{${placeholder}}}`, displayName);
      }
    }

    const sentMessage = await this.slackClient.sendMessage(
      String(payload.channelUserId),
      processedMessage,
      {
        mrkdwn: true,
        unfurl_links: false
      }
    );

    return sentMessage.ts;
  }
}