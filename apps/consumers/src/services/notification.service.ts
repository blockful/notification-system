/**
 * Notification Service
 * Handles sending notifications to Telegram users
 */

import { Telegraf } from 'telegraf';
import { NotificationPayload } from '../interfaces/notification.interface';

export class NotificationService {
  private bot: Telegraf;

  constructor(bot: Telegraf) {
    this.bot = bot;
  }

  /**
   * Send a notification to a specific Telegram user
   * @param payload Notification payload containing user information and message
   * @returns Message ID of the sent notification
   * @throws Error if sending fails
   */
  public async sendNotification(payload: NotificationPayload): Promise<string> {
    const sentMessage = await this.bot.telegram.sendMessage(
      payload.channelUserId, 
      payload.message
    );
    return `${sentMessage.message_id}`;
  }
} 