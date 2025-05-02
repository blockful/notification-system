import { handleSubscription } from '../services/subscription.service';
import { KnexUserRepository, KnexPreferenceRepository } from '../repositories/knex.repository';
import { knexInstance } from '../index';

/**
 * Handles the subscription logic for DAO users.
 * Acts as the handler layer, processing HTTP requests and responses.
 */
export async function daoSubscriptionHandler(request: any, reply: any) {
  try {
    const userRepo = new KnexUserRepository(knexInstance);
    const prefRepo = new KnexPreferenceRepository(knexInstance);
    
    const { dao } = request.params;
    const { channel, channel_user_id, is_active = true } = request.body;

    const { user, result, message } = await handleSubscription({
      userRepo,
      prefRepo,
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
}

/**
 * Handles retrieving all users subscribed to a specific DAO.
 * @param request - The HTTP request object
 * @param reply - The HTTP reply object
 */
export async function getDaoSubscribersHandler(request: any, reply: any) {
  try {
    const prefRepo = new KnexPreferenceRepository(knexInstance);
    const { dao } = request.params;
    const subscribers = await prefRepo.findActiveSubscribersByDao(dao);
    const formattedSubscribers = subscribers.map(subscriber => ({
      id: subscriber.id,
      user_id: subscriber.user_id,
      channel: subscriber.channel,
      channel_user_id: subscriber.channel_user_id,
      is_active: subscriber.is_active
    }));
    return {
      success: true,
      message: `Found ${formattedSubscribers.length} active subscribers for DAO: ${dao}`,
      data: formattedSubscribers
    };
  } catch (error: any) {
    console.error('Error in get DAO subscribers handler:', error);
    return reply.code(500).send({
      success: false,
      message: error.message || 'Internal server error',
      error: error.stack
    });
  }
} 