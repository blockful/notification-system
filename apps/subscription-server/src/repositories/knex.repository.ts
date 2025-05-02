/**
 * Knex Repository Implementation
 * Implements the repository interfaces using Knex query builder
 */

import { Knex } from 'knex';
import { IUserRepository, IPreferenceRepository, User, UserPreference } from '../interfaces';

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
      .insert({ ...data, created_at: new Date() })
      .returning('*');
    return user;
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
  async create(data: Omit<UserPreference, 'id'>): Promise<UserPreference> {
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
   * Finds all users with active subscriptions to a specific DAO
   * @param daoId - The DAO's ID
   * @returns An array of user preferences joined with user details
   */
  async findActiveSubscribersByDao(daoId: string): Promise<(UserPreference & User)[]> {
    return this.knex<UserPreference>('user_preferences')
      .join('users', 'user_preferences.user_id', '=', 'users.id')
      .where({ 
        'user_preferences.dao_id': daoId,
        'user_preferences.is_active': true
      })
      .select('users.*', 'user_preferences.*');
  }
} 