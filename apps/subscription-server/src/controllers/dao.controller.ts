import type { FastifyTypedInstance } from "../interfaces/fastify_typed_instance";
import {
  subscriptionParamsSchema,
  subscriptionBodySchema,
  subscriptionResponseSchema
} from '../schemas/subscription.schema';
import { daoSubscriptionHandler } from '../handlers/dao.handlers';

/**
 * Registers DAO subscription routes in the Fastify app.
 * Acts as the controller layer, connecting HTTP routes to handlers.
 */
export async function daoHandlers(app: FastifyTypedInstance) {
  app.post('/subscription/:dao', {
    schema: {
      tags: ['dao'],
      description: 'Create or update dao subscription for user',
      params: subscriptionParamsSchema,
      body: subscriptionBodySchema,
      response: subscriptionResponseSchema
    },
  }, daoSubscriptionHandler);
} 