import type { FastifyTypedInstance } from "../interfaces/fastify-typed-instance";
import { z } from "zod";
import { config } from "../envConfig";

export async function healthRoutes(server: FastifyTypedInstance) {
  server.get('/health', {
    schema: {
      tags: ['health'],
      description: 'Health check endpoint',
      response: {
        200: z.object({
          status: z.string(),
          timestamp: z.string(),
          environment: z.string().optional()
        })
      }
    },
  }, () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.environment
    }
  });
} 