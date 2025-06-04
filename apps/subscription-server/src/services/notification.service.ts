/**
 * Notification service module
 * Handles the business logic for managing notification deduplication
 */

import { INotificationRepository, Notification } from '../interfaces';

/**
 * Service class for handling notification deduplication operations
 */
export class NotificationService {
  constructor(
    private notificationRepository: INotificationRepository
  ) {}

  /**
   * Filters subscribers to return only those who haven't received notification for the given proposal
   * 
   * @param notifications - Array of notifications
   * @returns Array of subscribers that should receive notifications
   */
  async getShouldSendNotifications(notifications: Notification[]): Promise<Notification[]> {
    const shouldSend: Notification[] = [];
    
    for (const notification of notifications) {
      const exists = await this.notificationRepository.exists(notification);
      
      if (!exists) {
        shouldSend.push(notification);
      }
    }
    
    return shouldSend;
  }

  /**
   * Marks notifications as sent by creating records in the notifications table
   * 
   * @param notifications - Array of notifications to mark as sent
   */
  async markNotificationsAsSent(notifications: Notification[]): Promise<void> {
    await this.notificationRepository.createMany(notifications);
  }
} 