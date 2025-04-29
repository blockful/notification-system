import type { FastifyTypedInstance } from "../interfaces/fastify_typed_instance";
import { z } from "zod";

export async function initial_routes(app: FastifyTypedInstance) {
  app.get('/health', {
    schema: {
      tags: ['health'],
      description: 'Health check endpoint',
      response: {
        200: z.object({
          status: z.string(),
          timestamp: z.string()
        })
      }
    },
  }, () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  })
} 