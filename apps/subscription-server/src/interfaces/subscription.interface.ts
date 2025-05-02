import { IUserRepository, IPreferenceRepository } from './repository.interface';

export interface Logger {
  error: (msg: string) => void;
}

export interface SubscriptionParams {
  userRepo: IUserRepository;
  prefRepo: IPreferenceRepository;
  dao: string;
  channel: string;
  channel_user_id: string;
  is_active: boolean;
  log: Logger;
} 