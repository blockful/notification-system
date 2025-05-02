import { Knex } from 'knex';
import { IUserRepository, IPreferenceRepository, User, UserPreference } from '../interfaces/repository.interface';

export class KnexUserRepository implements IUserRepository {
  constructor(private readonly knex: Knex) {}

  async findByChannelAndId(channel: string, channelUserId: string): Promise<User | undefined> {
    return this.knex<User>('users')
      .where({ channel, channel_user_id: channelUserId })
      .first();
  }

  async create(data: Omit<User, 'id'>): Promise<User> {
    const [user] = await this.knex<User>('users')
      .insert({ ...data, created_at: new Date() })
      .returning('*');
    return user;
  }
}

export class KnexPreferenceRepository implements IPreferenceRepository {
  constructor(private readonly knex: Knex) {}

  async findByUserAndDao(userId: string, daoId: string): Promise<UserPreference | undefined> {
    return this.knex<UserPreference>('user_preferences')
      .where({ user_id: userId, dao_id: daoId })
      .first();
  }

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
} 