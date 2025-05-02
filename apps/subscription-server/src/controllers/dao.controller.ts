import type { FastifyTypedInstance } from "../interfaces";
import {
  subscriptionParamsSchema,
  subscriptionBodySchema,
  subscriptionResponseSchema,
  daoSubscribersResponseSchema
} from '../schemas/subscription.schema';
import { daoSubscriptionHandler, getDaoSubscribersHandler } from '../handlers/dao.handlers';

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

  app.get('/subscriptions/:dao', {
    schema: {
      tags: ['dao'],
      description: 'Get all users subscribed to a specific DAO',
      params: subscriptionParamsSchema,
      response: daoSubscribersResponseSchema
    }
  }, getDaoSubscribersHandler);
} 