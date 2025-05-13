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
   * @param request - The HTTP request object
   */
  async postDaoSubscription(request: any) {
    const { dao } = request.params;
    const { channel, channel_user_id, is_active = true } = request.body;
    
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
   * @param request - The HTTP request object
   */
  async getDaoSubscribers(request: any) {
    const { dao } = request.params;
    const { subscribers, message } = await this.subscriptionService.getDaoSubscribers(dao);
    
    return {
      message,
      data: subscribers
    };
  }
} 