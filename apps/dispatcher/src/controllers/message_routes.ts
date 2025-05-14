import type { FastifyTypedInstance } from "../interfaces/fastify_typed_instance";
import { successResponseSchema, errorResponseSchema, dispatcherMessageSchema } from "../schemas/message_schemas";
import { TriggerProcessorService } from "../services/triggerProcessorService";

export async function messageRoutes(server: FastifyTypedInstance) {
  const triggerProcessorService = new TriggerProcessorService();
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
    return await triggerProcessorService.processTrigger(validatedMessage);
  });
} 