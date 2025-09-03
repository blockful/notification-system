/**
 * Subscription service module
 * Handles the business logic for managing user subscriptions to DAOs
 */

import { IUserRepository, IPreferenceRepository, User } from '../interfaces';
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
      try {
        user = await this.userRepository.create({
          channel,
          channel_user_id
        });
      } catch (error: any) {
        // Handle race condition - if user was created by another request
        if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
          user = await this.userRepository.findByChannelAndId(channel, channel_user_id);
          if (!user) {
            throw new Error('Failed to create or find user after duplicate key error');
          }
        } else {
          throw error;
        }
      }
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
   * @param channel - The channel (defaults to 'telegram')
   * @returns UserAddress record
   */
  async addUserAddress(userId: string, address: string, channel: string = 'telegram'): Promise<UserAddress> {
    // Basic validation
    if (!address || address.trim().length === 0) {
      throw new Error('Address is required');
    }
    
    // Basic Ethereum address validation (starts with 0x and has 42 characters)
    const cleanAddress = address.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(cleanAddress)) {
      throw new Error('Invalid Ethereum address format');
    }

    // Ensure user exists, create if not
    let user = await this.userRepository.findByChannelAndId(channel, userId);
    if (!user) {
      try {
        user = await this.userRepository.create({
          channel,
          channel_user_id: userId
        });
      } catch (error: any) {
        // Handle race condition - if user was created by another request
        if (error.message && error.message.includes('duplicate key value violates unique constraint')) {
          user = await this.userRepository.findByChannelAndId(channel, userId);
          if (!user) {
            throw new Error('Failed to create or find user after duplicate key error');
          }
        } else {
          throw error;
        }
      }
    }

    // Check if the address already exists for this user
    const existing = await this.userAddressRepository.findByUserAndAddress(user.id, cleanAddress);
    
    if (existing) {
      if (existing.is_active) {
        return existing;
      } else {
        return await this.userAddressRepository.reactivate(user.id, cleanAddress);
      }
    } else {
      // Create new address record
      return await this.userAddressRepository.create({
        user_id: user.id,
        address: cleanAddress,
        is_active: true
      });
    }
  }

  /**
   * Remove a wallet address from a user (soft delete)
   * @param userId - The user ID
   * @param address - The wallet address to remove
   * @param channel - The channel (defaults to 'telegram')
   * @returns Updated UserAddress record
   */
  async removeUserAddress(userId: string, address: string, channel: string = 'telegram'): Promise<UserAddress> {
    if (!address || address.trim().length === 0) {
      throw new Error('Address is required');
    }

    // Find the user first
    const user = await this.userRepository.findByChannelAndId(channel, userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await this.userAddressRepository.deactivate(user.id, address.trim());
  }

  /**
   * Get all active wallet addresses for a user
   * @param userId - The user ID
   * @param channel - The channel (defaults to 'telegram')
   * @returns Array of active UserAddress records
   */
  async getUserAddresses(userId: string, channel: string = 'telegram'): Promise<UserAddress[]> {
    // Find the user first
    const user = await this.userRepository.findByChannelAndId(channel, userId);
    if (!user) {
      return [];
    }

    return await this.userAddressRepository.findByUser(user.id);
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

  /**
   * Get users by multiple wallet addresses (batch operation)
   * @param addresses Array of wallet addresses
   * @returns Record mapping addresses to arrays of Users who own each address
   */
  async getUsersByWalletAddressesBatch(addresses: string[]): Promise<Record<string, User[]>> {
    if (addresses.length === 0) return {};
    
    const userAddresses = await this.userAddressRepository.findByAddresses(addresses);
    const result: Record<string, User[]> = {};
    
    // Initialize all addresses with empty arrays
    addresses.forEach(address => {
      result[address] = [];
    });
    
    // Group user addresses by address
    const addressGroups: Record<string, string[]> = {};
    userAddresses.forEach(userAddress => {
      if (!addressGroups[userAddress.address]) {
        addressGroups[userAddress.address] = [];
      }
      addressGroups[userAddress.address].push(userAddress.user_id);
    });
    
    // Get unique user IDs
    const userIds = [...new Set(userAddresses.map(ua => ua.user_id))];
    if (userIds.length === 0) return result;
    
    // Fetch all users in one batch
    const users = await this.userRepository.findByIds(userIds);
    const userMap = new Map(users.map(user => [user.id, user]));
    
    // Build result mapping addresses to users
    Object.entries(addressGroups).forEach(([address, userIdList]) => {
      result[address] = userIdList
        .map(userId => userMap.get(userId))
        .filter((user): user is User => user !== undefined);
    });
    
    return result;
  }

  /**
   * Get all unique addresses being followed by users in a specific DAO
   * @param daoId The DAO ID
   * @returns List of unique addresses
   */
  async getFollowedAddresses(daoId: string): Promise<string[]> {
    return await this.userAddressRepository.getFollowedAddressByDao(daoId);
  }
} 