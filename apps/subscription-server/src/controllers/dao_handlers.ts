import type { FastifyTypedInstance } from "../interfaces/fastify_typed_instance";
import { z } from "zod";
import Knex from 'knex';
import { handleSubscription } from '../services/subscription.service';

const knexInstance = Knex({
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/'
});

export async function dao_handlers(app: FastifyTypedInstance) {
  app.post('/subscription/:dao', {
    schema: {
      tags: ['dao'],
      description: 'Create or update dao subscription for user',
      params: z.object({
        dao: z.string().describe('The DAO identifier')
      }),
      body: z.object({
        channel: z.string().describe('The channel the user is coming from (e.g., "telegram", "discord")'),
        channel_user_id: z.string().describe('The user ID from the channel'),
        is_active: z.boolean().default(true).describe('Whether the subscription is active')
      }),
      response: {
        200: z.object({
          success: z.boolean(),
          message: z.string(),
          data: z.object({
            user_id: z.string(),
            dao_id: z.string(),
            is_active: z.boolean(),
            created_at: z.string().optional(),
            updated_at: z.string().optional()
          }).optional()
        }),
        500: z.object({
          success: z.boolean(),
          message: z.string(),
          error: z.string().optional()
        })
      }
    },
  }, async (request, reply) => {
    try {
      const { dao } = request.params;
      const { channel, channel_user_id, is_active = true } = request.body;

      const { user, result, message } = await handleSubscription({
        knex: knexInstance,
        dao,
        channel,
        channel_user_id,
        is_active,
        log: request.log
      });

      return {
        success: true,
        message,
        data: {
          user_id: user.id,
          dao_id: dao,
          is_active: result.is_active,
          created_at: result.created_at ? new Date(result.created_at).toISOString() : undefined,
          updated_at: result.updated_at ? new Date(result.updated_at).toISOString() : undefined
        }
      };
    } catch (error: any) {
      console.error('Error in subscription handler:', error);
      return reply.code(500).send({
        success: false,
        message: error.message || 'Internal server error',
        error: error.stack
      });
    }
  });
} 