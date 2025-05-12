/**
 * Subscription service module
 * Handles the business logic for managing user subscriptions to DAOs
 */

import { IPreferenceRepository, IUserRepository } from '../interfaces';

/**
 * Constants for subscription-related messages
 */
export const SUBSCRIPTION_MESSAGES = {
  ERROR_QUERY_USER: 'Database query failed (users)',
  ERROR_CREATE_USER: 'Failed to create user',
  ERROR_QUERY_PREF: 'Database query failed (preferences)',
  ERROR_CREATE_PREF: 'Failed to create subscription',
  ERROR_UPDATE_PREF: 'Failed to update subscription',
  SUCCESS_NEW_SUB: 'New subscription created',
  SUCCESS_ALREADY: 'Subscription already in the requested state',
  SUCCESS_ACTIVATED: 'Subscription activated for user',
  SUCCESS_DEACTIVATED: 'Subscription deactivated for user',
  SUCCESS_GET_SUBSCRIBERS: 'Successfully retrieved DAO subscribers',
  ERROR_GET_SUBSCRIBERS: 'Failed to retrieve DAO subscribers'
};

export class SubscriptionService {
  private userRepo: IUserRepository;
  private prefRepo: IPreferenceRepository;

  constructor(userRepo: IUserRepository, prefRepo: IPreferenceRepository) {
    this.userRepo = userRepo;
    this.prefRepo = prefRepo;
  }

  /**
   * Handles subscription requests for users to DAOs
   * 
   * This function:
   * 1. Finds or creates a user based on their channel and channel_user_id
   * 2. Finds or creates a subscription preference for the user and DAO
   * 3. Updates the subscription state if necessary
   * 
   * @param {string} dao - The DAO identifier
   * @param {string} channel - The notification channel
   * @param {string} channel_user_id - The user's ID in the channel
   * @param {boolean} is_active - Whether to activate or deactivate the subscription
   * @returns {Promise<{user: User, result: UserPreference, message: string}>} The subscription result
   */
  async handleSubscription(dao: string, channel: string, channel_user_id: string, is_active: boolean) {
    let user = await this.userRepo.findByChannelAndId(channel, channel_user_id);
    
    if (!user) {
      user = await this.userRepo.create({
        channel,
        channel_user_id,
        is_active: true
      });
    }
    let existingPreference = await this.prefRepo.findByUserAndDao(user.id, dao);
    let result;
    let message;
    if (existingPreference) {
      if (existingPreference.is_active !== is_active) {
        result = await this.prefRepo.update(existingPreference.id, { is_active });
        message = is_active ? SUBSCRIPTION_MESSAGES.SUCCESS_ACTIVATED : SUBSCRIPTION_MESSAGES.SUCCESS_DEACTIVATED;
      } else {
        result = existingPreference;
        message = SUBSCRIPTION_MESSAGES.SUCCESS_ALREADY;
      }
    } else {
      result = await this.prefRepo.create({
        user_id: user.id,
        dao_id: dao,
        is_active
      });
      message = SUBSCRIPTION_MESSAGES.SUCCESS_NEW_SUB;
    }
    return {
      user,
      result,
      message
    };
  }

  /**
   * Retrieves all active subscribers for a specific DAO
   * 
   * This function queries the database for all users with active subscriptions
   * to the specified DAO and formats the response data
   * 
   * @param {string} daoId - The DAO identifier
   * @returns {Promise<{subscribers: any[], message: string}>} The subscribers and success message
   */
  async getDaoSubscribers(daoId: string) {
    const subscribers = await this.prefRepo.findActiveSubscribersByDao(daoId);
    const formattedSubscribers = subscribers.map(subscriber => ({
      id: subscriber.id,
      user_id: subscriber.user_id,
      channel: subscriber.channel,
      channel_user_id: subscriber.channel_user_id,
      is_active: subscriber.is_active
    }));
    return {
      subscribers: formattedSubscribers,
      message: SUBSCRIPTION_MESSAGES.SUCCESS_GET_SUBSCRIBERS
    };
  }
} 