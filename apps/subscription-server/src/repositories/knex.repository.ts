/**
 * Knex Repository Implementation
 * Implements the repository interfaces using Knex query builder
 */

import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { IUserRepository, IPreferenceRepository, INotificationRepository, User, UserPreference, Notification } from '../interfaces';
import { IUserAddressRepository, UserAddress } from '../interfaces/user-address.interface';

/**
 * User repository implementation using Knex
 * Handles all user-related database operations
 */
export class KnexUserRepository implements IUserRepository {
  constructor(private readonly knex: Knex) {}

  /**
   * Finds a user by their channel and channel-specific user ID
   * @param channel - The channel (e.g., telegram, discord)
   * @param channelUserId - The user ID from the specific channel
   */
  async findByChannelAndId(channel: string, channelUserId: string): Promise<User | undefined> {
    return this.knex<User>('users')
      .where({ channel, channel_user_id: channelUserId })
      .first();
  }

  /**
   * Creates a new user in the database
   * @param data - The user data to insert
   */
  async create(data: Omit<User, 'id'>): Promise<User> {
    const [user] = await this.knex<User>('users')
      .insert({ id: uuidv4(), ...data, created_at: new Date() })
      .returning('*');
    return user;
  }

  /**
   * Gets a user by their ID
   * @param id - The user's ID
   */
  async findById(id: string): Promise<User | undefined> {
    return this.knex<User>('users')
      .where({ id })
      .first();
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
    return this.knex<UserPreference>('user_preferences')
      .where({ user_id: userId, dao_id: daoId })
      .first();
  }

  /**
   * Creates a new preference record
   * @param data - The preference data to insert
   */
  async create(data: Omit<UserPreference, 'id' | 'created_at' | 'updated_at'>): Promise<UserPreference> {
    const now = new Date();
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
        updated_at: new Date()
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
    return query.select('*');
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
    return this.knex<UserAddress>('user_addresses')
      .where({ user_id: userId, is_active: true })
      .orderBy('created_at', 'desc')
      .select('*');
  }

  /**
   * Find all users who own a specific wallet address
   * @param address - The wallet address (case-insensitive)
   * @returns Array of UserAddress records for active addresses
   */
  async findByAddress(address: string): Promise<UserAddress[]> {
    return this.knex<UserAddress>('user_addresses')
      .where({ address: address.toLowerCase(), is_active: true })
      .select('*');
  }

  /**
   * Find a specific user-address combination
   * @param userId - The user ID
   * @param address - The wallet address
   * @returns UserAddress record if found, undefined otherwise
   */
  async findByUserAndAddress(userId: string, address: string): Promise<UserAddress | undefined> {
    return this.knex<UserAddress>('user_addresses')
      .where({ user_id: userId, address: address.toLowerCase() })
      .first();
  }

  /**
   * Create a new user address record
   * @param data - User address data (without id, created_at, updated_at)
   * @returns Created UserAddress record
   */
  async create(data: Omit<UserAddress, 'id' | 'created_at' | 'updated_at'>): Promise<UserAddress> {
    const now = new Date();
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
        updated_at: new Date()
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
        updated_at: new Date()
      })
      .returning('*');
    return userAddress;
  }
} 