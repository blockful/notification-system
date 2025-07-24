import { db } from '../../setup';
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

export interface UserAddressData {
  id: string;
  user_id: string;
  address: string;
  is_active: boolean;
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

  static async createUserWithFullSetup(
    channelUserId: string, 
    name: string, 
    daoId: string,
    preferenceActive: boolean = true,
    timestamp?: string
  ): Promise<{ user: UserData; preference: UserPreferenceData }> {
    const user = await this.createUser(channelUserId, name);
    const preference = await this.createUserPreference(user.id, daoId, preferenceActive, timestamp);
    
    return { user, preference };
  }

  static async updateUserPreference(
    userId: string,
    daoId: string,
    isActive: boolean,
    timestamp: string
  ): Promise<void> {
    await db('user_preferences')
      .where({ user_id: userId, dao_id: daoId })
      .update({
        is_active: isActive,
        updated_at: timestamp
      });
  }

  static async createUserAddress(
    userId: string,
    address: string,
    timestamp?: string
  ): Promise<UserAddressData> {
    const userAddress = {
      id: uuidv4(),
      user_id: userId,
      address: address,
      is_active: true,
      created_at: timestamp || new Date().toISOString(),
      updated_at: timestamp || new Date().toISOString()
    };
    await db('user_addresses').insert(userAddress);
    return userAddress;
  }
}