import type { FastifyTypedInstance } from "../interfaces/fastify-typed-instance";
import { successResponseSchema, errorResponseSchema, dispatcherMessageSchema } from "../schemas/message.schema";
import { TriggerProcessorService } from "../services/trigger-processor.service";
import { DispatcherMessage } from "../interfaces/dispatcher-message.interface";
import { SubscriptionClient } from "../services/subscription-client.service";
import { NotificationClientFactory } from "../services/notification/notification-factory.service";
import { config } from "../envConfig";

/**
 * Controller responsible for message-related routes
 */
export class MessageController {
  private triggerProcessorService: TriggerProcessorService;

  constructor() {
    const subscriptionClient = new SubscriptionClient(config.subscriptionServerUrl);
    const notificationFactory = new NotificationClientFactory(config.telegramConsumerUrl);
    this.triggerProcessorService = new TriggerProcessorService(subscriptionClient, notificationFactory);
  }

  /**
   * Register message routes on the server
   * @param server The Fastify server instance
   */
  async messageRoutes(server: FastifyTypedInstance): Promise<void> {
    server.post<{ Body: DispatcherMessage }>('/messages', {
      schema: {
        tags: ['messages'],
        description: 'Endpoint to receive messages from logic system',
        body: dispatcherMessageSchema,
        response: {
          200: successResponseSchema,
          400: errorResponseSchema,
          500: errorResponseSchema
        }
      },
    }, async (request, reply) => {
      return await this.triggerProcessorService.processTrigger(request.body);
    });
  }
} 