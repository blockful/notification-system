import { INotificationClient } from "../../interfaces/notification-client.interface";

/**
 * Factory for creating notification clients
 * Allows for easy creation of different notification clients
 * based on the channel type
 */
export class NotificationClientFactory {
  private readonly clients: Map<string, INotificationClient>;

  /**
   * Creates a new notification client factory
   */
  constructor() {
    this.clients = new Map<string, INotificationClient>();
  }

  /**
   * Adds a notification client to the factory
   * @param channel Channel type (e.g., 'telegram')
   * @param client The notification client
   */
  addClient(channel: string, client: INotificationClient): void {
    this.clients.set(channel, client);
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