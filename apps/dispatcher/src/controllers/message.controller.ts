import type { FastifyTypedInstance } from "../interfaces/fastify-typed-instance";
import { successResponseSchema, errorResponseSchema, dispatcherMessageSchema } from "../schemas/message.schema";
import { TriggerProcessorService } from "../services/trigger-processor.service";

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