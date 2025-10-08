/**
 * Knex Repository Implementation
 * Implements the repository interfaces using Knex query builder
 */

import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { IUserRepository, IPreferenceRepository, INotificationRepository, User, UserPreference, Notification } from '../interfaces';
import { IUserAddressRepository, UserAddress } from '../interfaces/user-address.interface';
import { CryptoUtil } from '../utils/crypto';

/**
 * User repository implementation using Knex
 * Handles all user-related database operations
 */
export class KnexUserRepository implements IUserRepository {
  constructor(
    private readonly knex: Knex,
    private readonly tokenEncryptionKey?: string
  ) {}

  /**
   * Finds a user by their channel and channel-specific user ID
   * @param channel - The channel (e.g., telegram, discord)
   * @param channelUserId - The user ID from the specific channel
   */
  async findByChannelAndId(channel: string, channelUserId: string): Promise<User | undefined> {
    const user = await this.knex<User>('users')
      .where({ channel, channel_user_id: channelUserId })
      .first();
    
    return user || undefined;
  }

  /**
   * Creates a new user in the database
   * Uses INSERT ... ON CONFLICT ... MERGE to handle race conditions gracefully
   * @param data - The user data to insert
   */
  async create(data: Omit<User, 'id'>): Promise<User> {
    const userId = uuidv4();
    const userData = { id: userId, ...data, created_at: new Date().toISOString() };
    const [user] = await this.knex<User>('users')
      .insert(userData)
      .onConflict(['channel', 'channel_user_id'])
      .merge()
      .returning('*');

    return user;
  }

  /**
   * Gets a user by their ID
   * @param id - The user's ID
   */
  async findById(id: string): Promise<User | undefined> {
    const user = await this.knex<User>('users')
      .where({ id })
      .first();
    
    return user || undefined;
  }

  /**
   * Gets multiple users by their IDs
   * @param ids - Array of user IDs
   */
  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    
    const users = await this.knex<User>('users')
      .whereIn('id', ids);
    
    return users;
  }

  /**
   * Gets multiple users by their IDs with workspace tokens attached
   * Uses LEFT JOIN to fetch tokens in a single query instead of N+1 queries
   * @param ids - Array of user IDs
   */
  async findByIdsWithWorkspaceTokens(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];

    const knex = this.knex;
    const rows = await knex('users')
      .select(
        'users.*',
        'channel_workspaces.bot_token as encrypted_token'
      )
      .leftJoin('channel_workspaces', function() {
        this.on(knex.raw("INSTR(users.channel_user_id, ':') > 0"))
          .andOn(knex.raw("SUBSTR(users.channel_user_id, 1, INSTR(users.channel_user_id, ':') - 1) = channel_workspaces.workspace_id"))
          .andOn('channel_workspaces.is_active', '=', knex.raw('true'));
      })
      .whereIn('users.id', ids);

    if (!this.tokenEncryptionKey) {
      return rows.map(({ encrypted_token, ...user }) => user);
    }

    return rows.map(({ encrypted_token, ...user }) => {
      if (encrypted_token) {
        try {
          user.token = CryptoUtil.decrypt(encrypted_token, this.tokenEncryptionKey!);
        } catch (error) {
          console.error(`Failed to decrypt token for user ${user.id}:`, error);
        }
      }
      return user;
    });
  }
}

/**
 * Preference repository implementation using Knex
 * Handles all user preference-related database operations
 */
export class KnexPreferenceRepository implements IPreferenceRepository {
  constructor(private readonly knex: Knex) {}

  /**
   * Finds a user's preference for a specific DAO
   * @param userId - The user's ID
   * @param daoId - The DAO's ID
   */
  async findByUserAndDao(userId: string, daoId: string): Promise<UserPreference | undefined> {
    const preference = await this.knex<UserPreference>('user_preferences')
      .where({ user_id: userId, dao_id: daoId })
      .first();
    
    return preference || undefined;
  }

  /**
   * Creates a new preference record
   * @param data - The preference data to insert
   */
  async create(data: Omit<UserPreference, 'id' | 'created_at' | 'updated_at'>): Promise<UserPreference> {
    const now = new Date().toISOString();
    const [preference] = await this.knex<UserPreference>('user_preferences')
      .insert({
        id: uuidv4(),
        ...data,
        created_at: now,
        updated_at: now
      })
      .returning('*');
    
    return preference;
  }

  /**
   * Updates an existing preference record
   * @param id - The preference record ID
   * @param data - The data to update
   */
  async update(id: string, data: Partial<UserPreference>): Promise<UserPreference> {
    const [preference] = await this.knex<UserPreference>('user_preferences')
      .where({ id })
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .returning('*');
    
    return preference;
  }

  /**
   * Finds all active preference records for a specific DAO
   * @param daoId - The DAO's ID
   * @param eventTimestamp - Optional timestamp to filter subscribers by subscription date
   */
  async findByDao(daoId: string, eventTimestamp?: string): Promise<UserPreference[]> {
    let query = this.knex<UserPreference>('user_preferences')
      .where({ 
        dao_id: daoId,
        is_active: true
      });
    
    if (eventTimestamp) {
      query = query.where('updated_at', '<=', eventTimestamp);
    }
    
    const preferences = await query.select('*');
    
    return preferences;
  }
}

/**
 * Notification repository implementation using Knex
 * Handles all notification deduplication-related database operations
 */
export class KnexNotificationRepository implements INotificationRepository {
  constructor(private readonly knex: Knex) {}

  /**
   * Checks which notifications already exist in the database
   * @param notifications - Array of notifications to check
   * @returns Array of notifications that already exist in the database
   */
  async exists(notifications: Notification[]): Promise<Notification[]> {
    if (notifications.length === 0) {
      return [];
    }

    // Create array of [user_id, dao_id, event_id] tuples
    const notificationTuples = notifications.map(n => [n.user_id, n.dao_id, n.event_id]);

    return await this.knex('notifications')
      .select('user_id', 'dao_id', 'event_id')
      .whereIn(['user_id', 'dao_id', 'event_id'], notificationTuples);
  }

  /**
   * Creates multiple notification records in batch
   * @param notifications - Array of notification data to insert
   */
  async createMany(notifications: Notification[]): Promise<void> {
    if (notifications.length === 0) {
      return;
    }

    await this.knex('notifications')
      .insert(notifications)
      .onConflict(['user_id', 'dao_id', 'event_id'])
      .ignore();
  }
}

/**
 * User Address repository implementation using Knex
 * Handles all user address-related database operations with soft delete support
 */
export class KnexUserAddressRepository implements IUserAddressRepository {
  constructor(private readonly knex: Knex) {}

  /**
   * Find all active wallet addresses for a user
   * @param userId - The user ID
   * @returns Array of active UserAddress records
   */
  async findByUser(userId: string): Promise<UserAddress[]> {
    const addresses = await this.knex<UserAddress>('user_addresses')
      .where({ user_id: userId, is_active: true })
      .orderBy('created_at', 'desc')
      .select('*');
    
    return addresses;
  }

  /**
   * Find all users who own a specific wallet address
   * @param address - The wallet address (case-insensitive)
   * @returns Array of UserAddress records for active addresses
   */
  async findByAddress(address: string): Promise<UserAddress[]> {
    const addresses = await this.knex<UserAddress>('user_addresses')
      .where({ address: address.toLowerCase(), is_active: true })
      .select('*');
    
    return addresses;
  }

  /**
   * Find all users who own any of the specified wallet addresses
   * @param addresses - Array of wallet addresses (case-insensitive)
   * @returns Array of UserAddress records for active addresses
   */
  async findByAddresses(addresses: string[]): Promise<UserAddress[]> {
    if (addresses.length === 0) return [];
    
    const lowercaseAddresses = addresses.map(addr => addr.toLowerCase());
    const userAddresses = await this.knex<UserAddress>('user_addresses')
      .whereIn('address', lowercaseAddresses)
      .where({ is_active: true })
      .select('*');
    
    return userAddresses;
  }

  /**
   * Find a specific user-address combination
   * @param userId - The user ID
   * @param address - The wallet address
   * @returns UserAddress record if found, undefined otherwise
   */
  async findByUserAndAddress(userId: string, address: string): Promise<UserAddress | undefined> {
    const address_record = await this.knex<UserAddress>('user_addresses')
      .where({ user_id: userId, address: address.toLowerCase() })
      .first();
    
    return address_record || undefined;
  }

  /**
   * Create a new user address record
   * @param data - User address data (without id, created_at, updated_at)
   * @returns Created UserAddress record
   */
  async create(data: Omit<UserAddress, 'id' | 'created_at' | 'updated_at'>): Promise<UserAddress> {
    const now = new Date().toISOString();
    const [userAddress] = await this.knex<UserAddress>('user_addresses')
      .insert({
        id: uuidv4(),
        user_id: data.user_id,
        address: data.address.toLowerCase(),
        is_active: data.is_active,
        created_at: now,
        updated_at: now
      })
      .returning('*');
    
    return userAddress;
  }

  /**
   * Deactivate a user address (soft delete)
   * @param userId - The user ID
   * @param address - The wallet address to deactivate
   * @returns Updated UserAddress record
   */
  async deactivate(userId: string, address: string): Promise<UserAddress> {
    const [userAddress] = await this.knex<UserAddress>('user_addresses')
      .where({ user_id: userId, address: address.toLowerCase() })
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .returning('*');
    
    return userAddress;
  }

  /**
   * Reactivate a user address
   * @param userId - The user ID
   * @param address - The wallet address to reactivate
   * @returns Updated UserAddress record
   */
  async reactivate(userId: string, address: string): Promise<UserAddress> {
    const [userAddress] = await this.knex<UserAddress>('user_addresses')
      .where({ user_id: userId, address: address.toLowerCase() })
      .update({
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .returning('*');
    
    return userAddress;
  }

  /**
   * Get all unique addresses being followed by users in a specific DAO
   * @param daoId - The DAO ID
   * @returns Array of unique addresses being followed
   */
  async getFollowedAddressByDao(daoId: string): Promise<string[]> {
    const result = await this.knex('user_addresses')
      .distinct('address')
      .join('user_preferences', 'user_addresses.user_id', 'user_preferences.user_id')
      .where('user_preferences.dao_id', daoId)
      .where('user_addresses.is_active', true)
      .where('user_preferences.is_active', true);
    
    return result.map(row => row.address);
  }
} 