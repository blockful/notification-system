/**
 * Notification Service
 * Handles sending notifications to Telegram users
 */

import { Telegraf } from 'telegraf';
import { NotificationPayload } from '../interfaces/notification.interface';
import { SubscriptionAPIService } from './subscription-api.service';
import { DatabaseService } from '../repositories/db';

export class NotificationService {
  private bot: Telegraf;
  private subscriptionApi: SubscriptionAPIService;
  private dbService: DatabaseService;

  constructor(bot: Telegraf, subscriptionApi: SubscriptionAPIService, dbService: DatabaseService) {
    this.bot = bot;
    this.subscriptionApi = subscriptionApi;
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
    
    // Get all DAOs and check if the user is subscribed to any of them
    const daos = await this.dbService.getDAOs();
    const userExists = await this.subscriptionApi.userExists(chatId, daos);
    
    if (!userExists) {
      throw new Error(`User with chat ID ${chatId} not found`);
    }
    
    const sentMessage = await this.bot.telegram.sendMessage(
      chatId, 
      payload.message
    );
    return `${sentMessage.message_id}`;
  }
} 