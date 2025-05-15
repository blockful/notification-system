import { INotificationClient } from "../../interfaces/notification-client.interface";
import { TelegramNotificationClient } from "./telegram-notification.service";

/**
 * Factory for creating notification clients
 * Allows for easy creation of different notification clients
 * based on the channel type
 */
export class NotificationClientFactory {
  private readonly clients: Map<string, INotificationClient>;

  /**
   * Creates a new notification client factory
   * @param telegramBaseUrl Base URL for Telegram consumer API
   */
  constructor(telegramBaseUrl: string) {
    this.clients = new Map<string, INotificationClient>();
    
    // Initialize available notification clients
    this.clients.set('telegram', new TelegramNotificationClient(telegramBaseUrl));
  }

  /**
   * Gets a notification client for the specified channel
   * @param channel Channel type (e.g., 'telegram')
   * @returns A notification client for the specified channel
   * @throws Error if channel is not supported
   */
  getClient(channel: string): INotificationClient {
    const client = this.clients.get(channel);
    
    if (!client) {
      throw new Error(`Notification client for channel '${channel}' not found`);
    }
    
    return client;
  }
  
  /**
   * Checks if the factory supports a specific channel
   * @param channel Channel to check
   * @returns True if channel is supported, false otherwise
   */
  supportsChannel(channel: string): boolean {
    return this.clients.has(channel);
  }
} 