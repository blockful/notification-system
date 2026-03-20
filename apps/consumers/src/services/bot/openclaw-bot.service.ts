/**
 * OpenClaw Bot Service
 * Handles notification delivery to an OpenClaw agent (e.g., CRA for governance voting).
 * Implements BotServiceInterface following the same pattern as Telegram and Slack services.
 *
 * Unlike Telegram/Slack, this service is notification-only — no interactive commands.
 */

import { NotificationPayload } from '../../interfaces/notification.interface';
import { BotServiceInterface } from '../../interfaces/bot-service.interface';
import { OpenClawClientInterface } from '../../interfaces/openclaw-client.interface';

export class OpenClawBotService implements BotServiceInterface {
  constructor(private readonly openclawClient: OpenClawClientInterface) {}

  /**
   * Send a notification to the OpenClaw agent
   * Forwards the notification message along with structured metadata
   * that the receiving agent can parse for analysis.
   */
  async sendNotification(payload: NotificationPayload): Promise<string> {
    const metadata: Record<string, any> = {
      channel: payload.channel,
      userId: payload.userId,
    };

    // Forward structured metadata when available
    if (payload.metadata?.triggerType) metadata.triggerType = payload.metadata.triggerType;
    if (payload.metadata?.addresses) metadata.addresses = payload.metadata.addresses;
    if (payload.metadata?.transaction) metadata.transaction = payload.metadata.transaction;
    if (payload.metadata?.buttons) metadata.buttons = payload.metadata.buttons;

    const responseId = await this.openclawClient.sendMessage(
      payload.message,
      metadata
    );

    console.log(
      `[OpenClaw] Notification delivered for user ${payload.userId}: ${responseId}`
    );
    return responseId;
  }
}
