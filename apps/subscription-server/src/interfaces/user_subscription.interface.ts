/**
 * Repository interfaces for the notification system.
 * These interfaces define the contract for database operations.
 */

/**
 * User entity interface representing a user in the system
 */
export interface User {
  id: string;
  channel: string;
  channel_user_id: string;
  is_active: boolean;
  created_at?: Date;
}

/**
 * User preference entity interface representing a user's subscription preferences
 */
export interface UserPreference {
  id: string;
  user_id: string;
  dao_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * User repository interface defining operations for user management
 */
export interface IUserRepository {
  findByChannelAndId(channel: string, channelUserId: string): Promise<User | undefined>;
  create(data: Omit<User, 'id'>): Promise<User>;
}

/**
 * Preference repository interface defining operations for user preferences management
 */
export interface IPreferenceRepository {
  findByUserAndDao(userId: string, daoId: string): Promise<UserPreference | undefined>;
  create(data: Omit<UserPreference, 'id' | 'created_at' | 'updated_at'>): Promise<UserPreference>;
  update(id: string, data: Partial<UserPreference>): Promise<UserPreference>;
  findActiveSubscribersByDao(daoId: string): Promise<(UserPreference & User)[]>;
} 