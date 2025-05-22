/**
 * Subscription service module
 * Handles the business logic for managing user subscriptions to DAOs
 */

import { IUserRepository, IPreferenceRepository, User, UserPreference } from '../interfaces';

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
   * @returns {Promise<{user: User, result: UserPreference}>} The subscription result
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
        channel_user_id
      });
    }
    
    let existingPreference = await this.preferenceRepository.findByUserAndDao(user.id, dao);
    let result;
    
    if (existingPreference) {
      if (existingPreference.is_active !== is_active) {
        result = await this.preferenceRepository.update(existingPreference.id, { is_active });
      } else {
        result = existingPreference;
      }
    } else {
      result = await this.preferenceRepository.create({
        user_id: user.id,
        dao_id: dao,
        is_active
      });
    }
    
    return {
      user,
      result
    };
  }

  /**
   * Gets all subscribers for a specific DAO
   * 
   * @param {string} dao - The DAO identifier
   * @returns {Promise<{subscribers: Array<User>}>} The list of subscribers
   */
  async getDaoSubscribers(dao: string) {
    const preferences = await this.preferenceRepository.findByDao(dao);
    const subscribers: User[] = [];
    
    // Fetch user details for each preference
    for (const pref of preferences) {
      const user = await this.userRepository.findById(pref.user_id);
      if (user) {
        subscribers.push(user);
      }
    }
    
    return {
      subscribers
    };
  }
} 