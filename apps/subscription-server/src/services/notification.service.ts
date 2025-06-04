/**
 * Notification service module
 * Handles the business logic for managing notification deduplication
 */

import { INotificationRepository, NotificationCheckItem } from '../interfaces';

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
   * @param notifications - Array of notification check items
   * @returns Array of subscribers that should receive notifications
   */
  async getShouldSendNotifications(notifications: NotificationCheckItem[]): Promise<NotificationCheckItem[]> {
    const shouldSend: NotificationCheckItem[] = [];
    
    for (const notification of notifications) {
      const exists = await this.notificationRepository.exists(
        notification.userId,
        notification.daoId,
        notification.proposalId
      );
      
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
   * @returns Response object with count of marked notifications
   */
  async markNotificationsAsSent(notifications: NotificationCheckItem[]): Promise<{ markedCount: number }> {
    const markedCount = await this.notificationRepository.createMany(
      notifications.map(notification => ({
        user_id: notification.userId,
        dao_id: notification.daoId,
        proposal_id: notification.proposalId
      }))
    );
    
    return {
      markedCount
    };
  }
} 