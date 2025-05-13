import type { FastifyTypedInstance } from "../interfaces";
import {
  subscriptionParamsSchema,
  subscriptionBodySchema,
  createUpdateSubscriptionResponseSchema,
  getDaoSubscribersResponseSchema
} from '../schemas/subscription.schema';
import { DaoHandler } from '../handlers/dao.handlers';

/**
 * Controller class for DAO-related endpoints
 * Responsible for registering routes and connecting them to the appropriate handlers
 */
export class DaoController {
  constructor(private daoHandler: DaoHandler) {}
  
  /**
   * Registers all DAO-related routes to the Fastify instance
   * @param app - The Fastify instance
   */
  async register(app: FastifyTypedInstance) {
    app.post('/subscriptions/:dao', {
      schema: {
        tags: ['dao'],
        description: 'Create or update dao subscription for user',
        params: subscriptionParamsSchema,
        body: subscriptionBodySchema,
        response: createUpdateSubscriptionResponseSchema
      },
    }, (request) => this.daoHandler.postDaoSubscription(request));
  
    app.get('/subscriptions/:dao', {
      schema: {
        tags: ['dao'],
        description: 'Get all users subscribed to a specific DAO',
        params: subscriptionParamsSchema,
        response: getDaoSubscribersResponseSchema
      }
    }, (request) => this.daoHandler.getDaoSubscribers(request));
  }
} 