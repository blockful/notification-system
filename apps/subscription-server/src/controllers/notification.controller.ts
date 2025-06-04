import type { FastifyTypedInstance } from "../interfaces";
import {
  shouldSendBodySchema,
  markSentBodySchema,
  shouldSendResponseSchema,
  markSentResponseSchema
} from '../schemas/notification.schema';
import { NotificationHandler } from '../handlers/notification.handlers';

/**
 * Controller class for notification-related endpoints
 * Responsible for registering routes and connecting them to the appropriate handlers
 */
export class NotificationController {
  constructor(private notificationHandler: NotificationHandler) {}
  
  /**
   * Registers all notification-related routes to the Fastify instance
   * @param app - The Fastify instance
   */
  async register(app: FastifyTypedInstance) {
    app.post('/notifications/should-send', {
      schema: {
        tags: ['notification'],
        description: 'Filter subscribers to return only those who should receive notifications',
        body: shouldSendBodySchema,
        response: shouldSendResponseSchema
      },
    }, (request) => {
      const { notifications } = request.body;
      return this.notificationHandler.shouldSendNotifications(notifications);
    });
  
    app.post('/notifications/mark-sent', {
      schema: {
        tags: ['notification'],
        description: 'Mark notifications as sent by creating records in the notifications table',
        body: markSentBodySchema,
        response: markSentResponseSchema
      }
    }, (request) => {
      const { notifications } = request.body;
      return this.notificationHandler.markNotificationsAsSent(notifications);
    });
  }
} 