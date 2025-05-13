import type { FastifyTypedInstance } from "../interfaces";
import {
  subscriptionParamsSchema,
  subscriptionBodySchema,
  createUpdateSubscriptionResponseSchema,
  getDaoSubscribersResponseSchema
} from '../schemas/subscription.schema';
import { DaoHandler } from '../handlers/dao.handlers';
import { userRepository, preferenceRepository } from '../index';

/**
 * Registers DAO subscription routes in the Fastify app.
 * Acts as the controller layer, connecting HTTP routes to handlers.
 */
export async function daoHandlers(app: FastifyTypedInstance) {
  const daoHandler = new DaoHandler(userRepository, preferenceRepository);

  app.post('/subscription/:dao', {
    schema: {
      tags: ['dao'],
      description: 'Create or update dao subscription for user',
      params: subscriptionParamsSchema,
      body: subscriptionBodySchema,
      response: createUpdateSubscriptionResponseSchema
    },
  }, (request) => daoHandler.postDaoSubscription(request));

  app.get('/subscriptions/:dao', {
    schema: {
      tags: ['dao'],
      description: 'Get all users subscribed to a specific DAO',
      params: subscriptionParamsSchema,
      response: getDaoSubscribersResponseSchema
    }
  }, (request) => daoHandler.getDaoSubscribers(request));
} 