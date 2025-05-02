export interface User {
  id: string;
  channel: string;
  channel_user_id: string;
  is_active: boolean;
  created_at?: Date;
}

export interface UserPreference {
  id: string;
  user_id: string;
  dao_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IUserRepository {
  findByChannelAndId(channel: string, channelUserId: string): Promise<User | undefined>;
  create(data: Omit<User, 'id'>): Promise<User>;
}

export interface IPreferenceRepository {
  findByUserAndDao(userId: string, daoId: string): Promise<UserPreference | undefined>;
  create(data: Omit<UserPreference, 'id' | 'created_at' | 'updated_at'>): Promise<UserPreference>;
  update(id: string, data: Partial<UserPreference>): Promise<UserPreference>;
} 