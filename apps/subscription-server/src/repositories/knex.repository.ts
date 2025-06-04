/**
 * Knex Repository Implementation
 * Implements the repository interfaces using Knex query builder
 */

import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { IUserRepository, IPreferenceRepository, INotificationRepository, User, UserPreference, Notification } from '../interfaces';

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
   */
  async findByDao(daoId: string): Promise<UserPreference[]> {
    return this.knex<UserPreference>('user_preferences')
      .where({ 
        dao_id: daoId,
        is_active: true
      })
      .select('*');
  }
}

/**
 * Notification repository implementation using Knex
 * Handles all notification deduplication-related database operations
 */
export class KnexNotificationRepository implements INotificationRepository {
  constructor(private readonly knex: Knex) {}

  /**
   * Checks if a notification record exists for a specific user/dao/proposal combination
   * @param notification - The notification to check
   */
  async exists(notification: Notification): Promise<boolean> {
    const result = await this.knex('notifications')
      .where(notification)
      .first();
    
    return !!result;
  }

  /**
   * Creates multiple notification records in batch
   * @param notifications - Array of notification data to insert
   */
  async createMany(notifications: Notification[]): Promise<void> {
    if (notifications.length === 0) {
      return;
    }

    const now = new Date();
    const notificationRecords = notifications.map(notification => ({
      ...notification,
      created_at: now
    }));

    await this.knex('notifications')
      .insert(notificationRecords)
      .onConflict(['user_id', 'dao_id', 'proposal_id'])
      .ignore();
  }
} 