/**
 * Subscription service module
 * Handles the business logic for managing user subscriptions to DAOs
 */

import { IUserRepository, IPreferenceRepository, User, UserPreference, SubscriptionBody } from '../interfaces';

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
  SUCCESS_FETCH_SUBSCRIBERS: 'DAO subscribers retrieved successfully',
};

/**
 * Service class for handling subscription operations
 */
export class SubscriptionService {
  constructor(
    private userRepository: IUserRepository,
    private preferenceRepository: IPreferenceRepository
  ) {}

  /**
   * Handles subscription requests for users to DAOs
   * 
   * This method:
   * 1. Finds or creates a user based on their channel and channel_user_id
   * 2. Finds or creates a subscription preference for the user and DAO
   * 3. Updates the subscription state if necessary
   * 
   * @param {string} dao - The DAO identifier
   * @param {string} channel - The channel (e.g., "discord", "telegram")
   * @param {string} channel_user_id - The user ID in the specified channel
   * @param {boolean} is_active - Whether the subscription should be active
   * @returns {Promise<{user: User, result: UserPreference, message: string}>} The subscription result
   * @throws {Error} If any database operation fails
   */
  async handleSubscription(
    dao: string,
    channel: string,
    channel_user_id: string,
    is_active: boolean
  ) {
    let user = await this.userRepository.findByChannelAndId(channel, channel_user_id);
    
    if (!user) {
      user = await this.userRepository.create({
        channel,
        channel_user_id,
        is_active: true
      });
    }
    
    let existingPreference = await this.preferenceRepository.findByUserAndDao(user.id, dao);
    let result;
    let message;
    
    if (existingPreference) {
      if (existingPreference.is_active !== is_active) {
        result = await this.preferenceRepository.update(existingPreference.id, { is_active });
        message = is_active ? SUBSCRIPTION_MESSAGES.SUCCESS_ACTIVATED : SUBSCRIPTION_MESSAGES.SUCCESS_DEACTIVATED;
      } else {
        result = existingPreference;
        message = SUBSCRIPTION_MESSAGES.SUCCESS_ALREADY;
      }
    } else {
      result = await this.preferenceRepository.create({
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
   * Gets all subscribers for a specific DAO
   * 
   * @param {string} dao - The DAO identifier
   * @returns {Promise<{subscribers: Array<User>, message: string}>} The list of subscribers
   */
  async getDaoSubscribers(dao: string) {
    const preferences = await this.preferenceRepository.findByDao(dao);
    const subscribers: User[] = [];
    
    // Fetch user details for each preference
    for (const pref of preferences) {
      const user = await this.userRepository.findById(pref.user_id);
      if (user && user.is_active) {
        subscribers.push(user);
      }
    }
    
    return {
      subscribers,
      message: SUBSCRIPTION_MESSAGES.SUCCESS_FETCH_SUBSCRIBERS
    };
  }
} 