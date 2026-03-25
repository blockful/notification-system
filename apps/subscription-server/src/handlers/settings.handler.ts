import { SettingsService } from '../services/settings.service';
import { IUserRepository } from '../interfaces';

export class SettingsHandler {
  constructor(
    private settingsService: SettingsService,
    private userRepository: IUserRepository
  ) {}

  async getPreferences(channel: string, channelUserId: string) {
    const user = await this.userRepository.findByChannelAndId(channel, channelUserId);
    if (!user) {
      return { preferences: [] };
    }
    const preferences = await this.settingsService.getUserPreferences(user.id);
    return {
      preferences: preferences.map(p => ({
        trigger_type: p.trigger_type,
        is_active: p.is_active,
      })),
    };
  }

  async savePreferences(
    channel: string,
    channelUserId: string,
    preferences: { trigger_type: string; is_active: boolean }[]
  ) {
    let user = await this.userRepository.findByChannelAndId(channel, channelUserId);
    if (!user) {
      user = await this.userRepository.create({ channel, channel_user_id: channelUserId });
    }
    await this.settingsService.saveUserPreferences(user.id, preferences);
  }
}
