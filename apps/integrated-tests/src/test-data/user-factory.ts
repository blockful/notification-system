import { db } from '../setup/database-config';
import { v4 as uuidv4 } from 'uuid';

export interface UserData {
  id: string;
  channel_user_id: string;
  channel: string;
}

export interface UserPreferenceData {
  id: string;
  user_id: string;
  dao_id: string;
  is_active: boolean;
}

export interface SubscriptionData {
  id: string;
  user_id: string;
  dao_id: string;
  notification_type: string;
  notification_channels: string;
}

export class UserFactory {
  static async createUser(channelUserId: string, name: string): Promise<UserData> {
    const user = {
      id: uuidv4(),
      channel: 'telegram',
      channel_user_id: channelUserId,
      created_at: new Date().toISOString()
    };
    await db('users').insert(user);
    return user;
  }

  static async createUserPreference(
    userId: string, 
    daoId: string, 
    isActive: boolean = true,
    timestamp?: string
  ): Promise<UserPreferenceData> {
    const preference = {
      id: uuidv4(),
      user_id: userId,
      dao_id: daoId,
      is_active: isActive,
      created_at: timestamp || new Date().toISOString(),
      updated_at: timestamp || new Date().toISOString()
    };
    await db('user_preferences').insert(preference);
    return preference;
  }

  static async createSubscription(
    userId: string, 
    daoId: string, 
    timestamp?: string
  ): Promise<SubscriptionData> {
    const subscription = {
      id: uuidv4(),
      user_id: userId,
      dao_id: daoId,
      notification_type: 'proposal_created',
      notification_channels: JSON.stringify(['telegram']),
      created_at: timestamp || new Date().toISOString(),
      updated_at: timestamp || new Date().toISOString()
    };
    await db('subscriptions').insert(subscription);
    return subscription;
  }

  static async createUserWithFullSetup(
    channelUserId: string, 
    name: string, 
    daoId: string,
    preferenceActive: boolean = true,
    timestamp?: string
  ): Promise<{ user: UserData; preference: UserPreferenceData; subscription: SubscriptionData }> {
    const user = await this.createUser(channelUserId, name);
    const preference = await this.createUserPreference(user.id, daoId, preferenceActive, timestamp);
    const subscription = await this.createSubscription(user.id, daoId, timestamp);
    
    return { user, preference, subscription };
  }
}