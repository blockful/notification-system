/**
 * API Controller
 * Handles HTTP API endpoints for the Telegram bot
 */

import { FastifyTypedInstance } from '../interfaces/fastify.interface';
import { NotificationRequestSchema, NotificationResponseSchema, HealthCheckResponseSchema, APIErrorResponseSchema } from '../schemas/notification.schema';
import { NotificationService } from '../services/notification.service';
import { NotificationPayload } from '../interfaces/notification.interface';

export class APIController {
  private notificationService: NotificationService;
  private server: FastifyTypedInstance;

  constructor(server: FastifyTypedInstance, notificationService: NotificationService) {
    this.server = server;
    this.notificationService = notificationService;
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.server.route({
      method: 'GET',
      url: '/health',
      schema: {
        tags: ['Health'],
        description: 'Health check endpoint',
        response: {
          200: HealthCheckResponseSchema
        }
      },
      handler: async () => {
        return {
          status: 'ok',
          timestamp: new Date().toISOString()
        };
      }
    });
    
    // Notification endpoint
    this.server.route({
      method: 'POST',
      url: '/notifications',
      schema: {
        tags: ['Notifications'],
        description: 'Send a notification to a Telegram user',
        body: NotificationRequestSchema,
        response: {
          200: NotificationResponseSchema,
          500: APIErrorResponseSchema
        }
      },
      handler: async (request) => {
        const payload: NotificationPayload = request.body;
        return await this.notificationService.sendNotification(payload);
      }
    });
  }
} 