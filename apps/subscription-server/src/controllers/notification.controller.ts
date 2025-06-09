import type { FastifyTypedInstance } from "../interfaces";
import {
  notificationBodySchema,
  excludeSentResponseSchema
} from '../schemas/notification.schema';
import { NotificationService } from '../services/notification.service';

/**
 * Controller class for notification-related endpoints
 * Responsible for registering routes and connecting them to the appropriate services
 */
export class NotificationController {
  constructor(private notificationService: NotificationService) {}
  
  /**
   * Registers all notification-related routes to the Fastify instance
   * @param app - The Fastify instance
   */
  async register(app: FastifyTypedInstance) {
    app.post('/notifications/exclude-sent', {
      schema: {
        tags: ['notification'],
        description: 'Filter subscribers to return only those who should receive notifications',
        body: notificationBodySchema,
        response: excludeSentResponseSchema
      },
    }, async (request) => {
      const { notifications } = request.body;
      return this.notificationService.getShouldSendNotifications(notifications);
    });
  
    app.post('/notifications/mark-sent', {
      schema: {
        tags: ['notification'],
        description: 'Mark notifications as sent by creating records in the notifications table',
        body: notificationBodySchema
      }
    }, async (request) => {
      const { notifications } = request.body;
      await this.notificationService.markNotificationsAsSent(notifications);
    });
  }
} 