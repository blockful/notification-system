import type { FastifyTypedInstance } from "../interfaces/fastify-typed-instance";
import { successResponseSchema, errorResponseSchema, dispatcherMessageSchema } from "../schemas/message.schema";
import { TriggerProcessorService } from "../services/trigger-processor.service";
import { DispatcherMessage } from "../interfaces/dispatcher-message.interface";

/**
 * Controller responsible for message-related routes
 */
export class MessageController {
  constructor(
    private readonly triggerProcessorService: TriggerProcessorService
  ) {}

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