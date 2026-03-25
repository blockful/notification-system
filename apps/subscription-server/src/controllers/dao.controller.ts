import type { FastifyTypedInstance } from "../interfaces";
import {
  subscriptionParamsSchema,
  subscriptionBodySchema,
  subscriptionQuerystringSchema,
  createUpdateSubscriptionResponseSchema,
  getDaoSubscribersResponseSchema,
  getFollowedAddressesResponseSchema
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
        querystring: subscriptionQuerystringSchema,
        response: getDaoSubscribersResponseSchema
      }
    }, (request) => {
      const { dao } = request.params;
      const { proposal_timestamp, trigger_type } = request.query;
      return this.daoHandler.getDaoSubscribers(dao, proposal_timestamp, trigger_type);
    });

    app.get('/dao/:dao/followed-addresses', {
      schema: {
        tags: ['dao'],
        description: 'Get all unique addresses being followed by users in a specific DAO',
        params: subscriptionParamsSchema,
        response: getFollowedAddressesResponseSchema
      }
    }, (request) => {
      const { dao } = request.params;
      return this.daoHandler.getFollowedAddresses(dao);
    });
  }
} 