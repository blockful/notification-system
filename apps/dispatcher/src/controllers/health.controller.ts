import type { FastifyTypedInstance } from "../interfaces/fastify-typed-instance";
import { z } from "zod";

/**
 * Controller responsible for health-related routes
 */
export class HealthController {
  /**
   * Register health routes on the server
   * @param server The Fastify server instance
   */
  async healthRoutes(server: FastifyTypedInstance): Promise<void> {
    server.get('/health', {
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
    });
  }
} 