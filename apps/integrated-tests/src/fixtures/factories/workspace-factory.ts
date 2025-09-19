import { db } from '../../setup';
import { testConstants } from '../../config';

/**
 * Factory class for creating test workspace data (for Slack OAuth support)
 */
export class WorkspaceFactory {
  /**
   * Creates a default test workspace for Slack
   * @param workspaceId Optional workspace ID (defaults to T_DEFAULT)
   * @param botToken Optional bot token (defaults to test token)
   * @return Promise that resolves when workspace is created
   */
  static async createDefaultSlackWorkspace(
    workspaceId: string = 'T_DEFAULT',
    botToken: string = 'xoxb-test-workspace-token'
  ): Promise<void> {
    // Check if workspace already exists
    const existing = await db('channel_workspaces')
      .where({ workspace_id: workspaceId })
      .first();

    if (!existing) {
      await db('channel_workspaces').insert({
        workspace_id: workspaceId,
        workspace_name: 'Test Workspace',
        channel: 'slack',
        bot_token: botToken, // In real app this would be encrypted
        bot_user_id: 'U_BOT_TEST',
        is_active: true,
        installed_at: new Date().toISOString()
      });
    }
  }

  /**
   * Creates a workspace with encrypted token (for production-like testing)
   * @param workspaceId The workspace identifier
   * @param workspaceName The workspace name
   * @param botToken The bot token to encrypt
   * @return Promise that resolves when workspace is created
   */
  static async createSlackWorkspaceWithEncryption(
    workspaceId: string,
    workspaceName: string,
    botToken: string
  ): Promise<void> {
    // For tests, we'll just store the token as-is
    // In production, this would use the crypto utilities
    await db('channel_workspaces').insert({
      workspace_id: workspaceId,
      workspace_name: workspaceName,
      channel: 'slack',
      bot_token: botToken,
      bot_user_id: `U_BOT_${workspaceId}`,
      is_active: true,
      installed_at: new Date().toISOString()
    });
  }
}