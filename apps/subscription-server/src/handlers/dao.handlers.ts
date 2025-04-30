import { handleSubscription } from '../services/subscription.service';
import { knexInstance } from '../index';

/**
 * Handles the subscription logic for DAO users.
 * Acts as the handler layer, processing HTTP requests and responses.
 */
export async function daoSubscriptionHandler(request: any, reply: any) {
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
} 