import { SubscriptionService } from '../services/subscription.service';

/**
 * Handles DAO-related requests
 * Acts as the handler layer, processing HTTP requests and responses
 */
export class DaoHandler {
  constructor(private subscriptionService: SubscriptionService) {}

  /**
   * Handles the subscription logic for DAO users.
   * 
   * @param dao - The DAO identifier
   * @param channel - The channel the user is coming from (e.g., "telegram", "discord")
   * @param channel_user_id - The user ID from the channel
   * @param is_active - Whether the subscription is active
   */
  async postDaoSubscription(
    dao: string,
    channel: string,
    channel_user_id: string,
    is_active: boolean = true
  ) {
    const { user, result, message } = await this.subscriptionService.handleSubscription(
      dao,
      channel,
      channel_user_id,
      is_active
    );
    
    return {
      message,
      data: {
        user_id: user.id,
        dao_id: dao,
        is_active: result.is_active,
        created_at: result.created_at ? new Date(result.created_at).toISOString() : undefined,
        updated_at: result.updated_at ? new Date(result.updated_at).toISOString() : undefined
      }
    };
  }

  /**
   * Handles retrieving all users subscribed to a specific DAO.
   * 
   * @param daoId - The ID of the DAO
   */
  async getDaoSubscribers(daoId: string) {
    const { subscribers, message } = await this.subscriptionService.getDaoSubscribers(daoId);
    
    return {
      message,
      data: subscribers
    };
  }
} 