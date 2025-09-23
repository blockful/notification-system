import { Knex } from 'knex';
import { CryptoUtil } from '../utils/crypto';

export interface ChannelWorkspace {
  workspace_id: string;
  workspace_name?: string;
  channel: string;  // Platform identifier (slack, discord, etc)
  bot_token: string;
  bot_user_id?: string;
  is_active: boolean;
  installed_at: Date;
}

export interface WorkspaceData {
  workspaceId: string;
  workspaceName?: string;
  channel: string;  // Platform identifier (slack, discord, etc)
  botToken: string;
  botUserId?: string;
}

/**
 * Service for managing workspace credentials and tokens for channels that support workspaces
 * Handles encryption/decryption and database operations
 */
export class WorkspaceService {
  constructor(private db: Knex) {}

  /**
   * Save or update workspace credentials
   * @param workspaceData Workspace information from OAuth
   */
  async saveWorkspace(workspaceData: WorkspaceData): Promise<void> {
    const encryptedToken = CryptoUtil.encrypt(workspaceData.botToken);

    const workspace: Partial<ChannelWorkspace> = {
      workspace_id: workspaceData.workspaceId,
      workspace_name: workspaceData.workspaceName,
      channel: workspaceData.channel,
      bot_token: encryptedToken,
      bot_user_id: workspaceData.botUserId,
      is_active: true,
    };

    // Upsert workspace - update if exists, insert if not
    await this.db('channel_workspaces')
      .insert(workspace)
      .onConflict('workspace_id')
      .merge({
        workspace_name: workspace.workspace_name,
        bot_token: workspace.bot_token,
        bot_user_id: workspace.bot_user_id,
        is_active: true,
        installed_at: this.db.fn.now(),
      });
  }

  /**
   * Get workspace token by workspace ID
   * @param workspaceId Workspace/team ID
   * @returns Decrypted bot token or null if not found/inactive
   */
  async getWorkspaceToken(workspaceId: string): Promise<string | null> {
    const workspace = await this.db<ChannelWorkspace>('channel_workspaces')
      .where({ workspace_id: workspaceId, is_active: true })
      .first();

    if (!workspace) {
      return null;
    }

    try {
      return CryptoUtil.decrypt(workspace.bot_token);
    } catch (error) {
      console.error(`Failed to decrypt token for workspace ${workspaceId}:`, error);
      return null;
    }
  }

  /**
   * Get workspace information (without token)
   * @param workspaceId Workspace/team ID
   * @returns Workspace metadata or null if not found
   */
  async getWorkspace(workspaceId: string): Promise<Omit<ChannelWorkspace, 'bot_token'> | null> {
    const workspace = await this.db<ChannelWorkspace>('channel_workspaces')
      .where({ workspace_id: workspaceId })
      .select('workspace_id', 'workspace_name', 'channel', 'bot_user_id', 'is_active', 'installed_at')
      .first();

    return workspace || null;
  }
}