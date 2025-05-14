import type { FastifyTypedInstance } from "../interfaces/fastify_typed_instance";
import { successResponseSchema, errorResponseSchema, dispatcherMessageSchema } from "../schemas/message_schemas";
import { MessageProcessorService } from "../services/messageProcessor";

export async function messageRoutes(server: FastifyTypedInstance) {
  // Create the message processor service
  const messageProcessor = new MessageProcessorService();

  server.post('/api/messages', {
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
    const validatedMessage = dispatcherMessageSchema.parse(request.body);
    return await messageProcessor.processMessage(validatedMessage);
  });
} 