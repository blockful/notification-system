/**
 * Subscription service module
 * Handles the business logic for managing user subscriptions to DAOs
 */

import { IUserRepository, IPreferenceRepository, User, UserPreference } from '../interfaces';
import { IUserAddressRepository, UserAddress } from '../interfaces/user-address.interface';

/**
 * Service class for handling subscription operations
 */
export class SubscriptionService {
  constructor(
    private userRepository: IUserRepository,
    private preferenceRepository: IPreferenceRepository,
    private userAddressRepository: IUserAddressRepository
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
    is_active: boolean,
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
   * @param {string} eventTimestamp - Optional timestamp to filter subscribers by subscription date
   * @returns {Promise<{subscribers: Array<User>}>} The list of subscribers
   */
  async getDaoSubscribers(dao: string, eventTimestamp?: string) {
    const preferences = await this.preferenceRepository.findByDao(dao, eventTimestamp);
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

  /**
   * Add a wallet address to a user (create new or reactivate existing)
   * @param userId - The user ID
   * @param address - The wallet address to add
   * @returns UserAddress record
   */
  async addUserAddress(userId: string, address: string): Promise<UserAddress> {
    // Check if the address already exists for this user
    const existing = await this.userAddressRepository.findByUserAndAddress(userId, address);
    
    if (existing) {
      if (existing.is_active) {
        return existing;
      } else {
        return await this.userAddressRepository.reactivate(userId, address);
      }
    } else {
      // Create new address record
      return await this.userAddressRepository.create({
        user_id: userId,
        address: address,
        is_active: true
      });
    }
  }

  /**
   * Remove a wallet address from a user (soft delete)
   * @param userId - The user ID
   * @param address - The wallet address to remove
   * @returns Updated UserAddress record
   */
  async removeUserAddress(userId: string, address: string): Promise<UserAddress> {
    return await this.userAddressRepository.deactivate(userId, address);
  }

  /**
   * Get all active wallet addresses for a user
   * @param userId - The user ID
   * @returns Array of active UserAddress records
   */
  async getUserAddresses(userId: string): Promise<UserAddress[]> {
    return await this.userAddressRepository.findByUser(userId);
  }

  /**
   * Get all users who own a specific wallet address
   * @param address - The wallet address
   * @returns Array of UserAddress records with user information
   */
  async getAddressOwners(address: string): Promise<UserAddress[]> {
    return await this.userAddressRepository.findByAddress(address);
  }

  /**
   * Get full user information for users who own a specific wallet address
   * @param address - The wallet address
   * @returns Array of Users who own the address
   */
  async getUsersByWalletAddress(address: string): Promise<User[]> {
    const userAddresses = await this.userAddressRepository.findByAddress(address);
    const users: User[] = [];
    
    for (const userAddress of userAddresses) {
      const user = await this.userRepository.findById(userAddress.user_id);
      if (user) {
        users.push(user);
      }
    }
    
    return users;
  }
} 