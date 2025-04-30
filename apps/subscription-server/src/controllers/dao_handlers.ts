import type { FastifyTypedInstance } from "../interfaces/fastify_typed_instance";
import { z } from "zod";

export async function dao_handlers(app: FastifyTypedInstance) {
  app.get('/subscription/:dao', {
    schema: {
      tags: ['dao'],
      description: 'Post dao preferences for user',
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