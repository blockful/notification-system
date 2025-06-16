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
    }, (request) => {
      const { dao } = request.params;
      const { channel, channel_user_id, is_active } = request.body;
      return this.daoHandler.postDaoSubscription(
        dao,
        channel,
        channel_user_id,
        is_active
      );
    });
  
    app.get('/subscriptions/:dao', {
      schema: {
        tags: ['dao'],
        description: 'Get all users subscribed to a specific DAO',
        params: subscriptionParamsSchema,
        response: getDaoSubscribersResponseSchema
      }
    }, (request) => {
      const { dao } = request.params;
      const { proposal_timestamp } = request.query as { proposal_timestamp?: string };
      return this.daoHandler.getDaoSubscribers(dao, proposal_timestamp);
    });
  }
} 