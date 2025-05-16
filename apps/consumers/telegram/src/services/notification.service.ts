/**
 * Notification Service
 * Handles sending notifications to Telegram users
 */

import { Telegraf } from 'telegraf';
import { NotificationPayload } from '../interfaces/notification.interface';
import { DatabaseService } from '../repositories/db';

export class NotificationService {
  private bot: Telegraf;
  private dbService: DatabaseService;

  constructor(bot: Telegraf, dbService: DatabaseService) {
    this.bot = bot;
    this.dbService = dbService;
  }

  /**
   * Send a notification to a specific Telegram user
   * @param payload Notification payload containing user information and message
   * @returns Message ID of the sent notification
   * @throws Error if user not found or sending fails
   */
  public async sendNotification(payload: NotificationPayload): Promise<string> {
    const chatId = payload.channelUserId;
    const userExists = await this.dbService.userExists(chatId);
    if (!userExists) {
      throw new Error(`User with chat ID ${chatId} not found`);
    }
    const sentMessage = await this.bot.telegram.sendMessage(
      chatId, 
      payload.message, 
      { parse_mode: 'HTML' }
    );
    return `${sentMessage.message_id}`;
  }
} 