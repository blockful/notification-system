import type { FastifyTypedInstance } from "../interfaces/fastify_typed_instance";
import { z } from "zod";

export async function healthRoutes(server: FastifyTypedInstance) {
  server.get('/health', {
    schema: {
      tags: ['health'],
      description: 'Health check endpoint',
      response: {
        200: z.object({
          status: z.string(),
          timestamp: z.string(),
          version: z.string(),
          environment: z.string().optional()
        })
      }
    },
  }, () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV
    }
  });
} 