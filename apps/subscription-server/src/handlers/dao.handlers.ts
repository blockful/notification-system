import { SubscriptionService } from '../services/subscription.service';
import { toSubscriptionResponse, toUserResponse } from '../mappers';

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
    const { user, result } = await this.subscriptionService.handleSubscription(
      dao,
      channel,
      channel_user_id,
      is_active
    );
    
    return toSubscriptionResponse(result, dao);
  }

  /**
   * Handles retrieving all users subscribed to a specific DAO.
   * 
   * @param daoId - The ID of the DAO
   * @param proposalTimestamp - Optional timestamp to filter subscribers by subscription date
   */
  async getDaoSubscribers(daoId: string, proposalTimestamp?: string) {
    const { subscribers } = await this.subscriptionService.getDaoSubscribers(daoId, proposalTimestamp);
    
    return subscribers.map(toUserResponse);
  }
} 