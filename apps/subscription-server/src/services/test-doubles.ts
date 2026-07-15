import type { NotificationTypeId } from '@notification-system/messages';
import {
  User,
  UserPreference,
  UserNotificationPreference,
  IUserRepository,
  IPreferenceRepository,
  IUserNotificationPreferencesRepository,
} from '../interfaces';
import { IUserAddressRepository, UserAddress } from '../interfaces/user-address.interface';

const unstubbed = (name: string): never => {
  throw new Error(`${name} not stubbed in this test`);
};

export class SimpleUserRepository implements IUserRepository {
  findByChannelAndIdResult: User | undefined;
  findByChannelAndIdError: Error | undefined;
  createResult: User | undefined;
  createError: Error | undefined;
  createCalls: Omit<User, 'id'>[] = [];
  // ponytail: models onConflict(...).merge(['channel','channel_user_id']) - a real insert
  // persists (and returns) the secret it was given, unless a concurrent racer's row won
  // the conflict first. Set this to simulate the "lost the race" case in a test.
  createRaceWinnerSecret: string | undefined;
  findByIdsWithWorkspaceTokensResult: User[] = [];
  findByIdsWithWorkspaceTokensCalls: string[][] = [];

  async findByChannelAndId(): Promise<User | undefined> {
    if (this.findByChannelAndIdError) throw this.findByChannelAndIdError;
    return this.findByChannelAndIdResult;
  }
  async create(data: Omit<User, 'id'>): Promise<User> {
    this.createCalls.push(data);
    if (this.createError) throw this.createError;
    return {
      ...this.createResult!,
      secret: this.createRaceWinnerSecret !== undefined ? this.createRaceWinnerSecret : data.secret
    };
  }
  async findByIdsWithWorkspaceTokens(ids: string[]): Promise<User[]> {
    this.findByIdsWithWorkspaceTokensCalls.push(ids);
    return this.findByIdsWithWorkspaceTokensResult;
  }
  async findById(): Promise<User | undefined> { return unstubbed('findById'); }
  async findByIds(): Promise<User[]> { return unstubbed('findByIds'); }
}

export class SimplePreferenceRepository implements IPreferenceRepository {
  findByUserAndDaoResult: UserPreference | undefined;
  findByUserAndDaoError: Error | undefined;
  findByDaoResult: UserPreference[] = [];
  findByDaoError: Error | undefined;
  findByDaoCalls: Array<{ daoId: string; eventTimestamp?: string }> = [];
  createResult: UserPreference | undefined;
  createError: Error | undefined;
  updateResult: UserPreference | undefined;
  updateError: Error | undefined;

  async findByUserAndDao(): Promise<UserPreference | undefined> {
    if (this.findByUserAndDaoError) throw this.findByUserAndDaoError;
    return this.findByUserAndDaoResult;
  }
  async findByDao(daoId: string, eventTimestamp?: string): Promise<UserPreference[]> {
    this.findByDaoCalls.push({ daoId, eventTimestamp });
    if (this.findByDaoError) throw this.findByDaoError;
    return this.findByDaoResult;
  }
  async create(): Promise<UserPreference> {
    if (this.createError) throw this.createError;
    return this.createResult!;
  }
  async update(): Promise<UserPreference> {
    if (this.updateError) throw this.updateError;
    return this.updateResult!;
  }
}

export class SimpleUserAddressRepository implements IUserAddressRepository {
  async findByUser(): Promise<UserAddress[]> { return unstubbed('findByUser'); }
  async findByAddress(): Promise<UserAddress[]> { return unstubbed('findByAddress'); }
  async findByAddresses(): Promise<UserAddress[]> { return unstubbed('findByAddresses'); }
  async findByUserAndAddress(): Promise<UserAddress | undefined> { return unstubbed('findByUserAndAddress'); }
  async create(): Promise<UserAddress> { return unstubbed('create'); }
  async deactivate(): Promise<UserAddress> { return unstubbed('deactivate'); }
  async reactivate(): Promise<UserAddress> { return unstubbed('reactivate'); }
  async getFollowedAddressByDao(): Promise<string[]> { return unstubbed('getFollowedAddressByDao'); }
}

export class SimpleUserNotificationPreferencesRepository implements IUserNotificationPreferencesRepository {
  filterActiveUsersResult: string[] = [];
  filterActiveUsersCalls: Array<{ userIds: string[]; triggerType: NotificationTypeId }> = [];

  async filterActiveUsers(userIds: string[], triggerType: NotificationTypeId): Promise<string[]> {
    this.filterActiveUsersCalls.push({ userIds, triggerType });
    return this.filterActiveUsersResult;
  }
  async findByUser(): Promise<UserNotificationPreference[]> { return unstubbed('findByUser'); }
  async upsertMany(): Promise<void> { unstubbed('upsertMany'); }
}
