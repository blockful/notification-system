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
    if (notifications.length === 0) {
      return [];
    }
    const existingNotifications = await this.notificationRepository.exists(notifications);
    const existingSet = new Set(
      existingNotifications.map(notification => 
        `${notification.user_id}-${notification.dao_id}-${notification.proposal_id}`
      )
    );
    
    // Filter out notifications that already exist
    return notifications.filter(notification => {
      const key = `${notification.user_id}-${notification.dao_id}-${notification.proposal_id}`;
      return !existingSet.has(key);
    });
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