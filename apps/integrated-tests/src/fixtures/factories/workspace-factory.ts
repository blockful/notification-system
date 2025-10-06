import { db } from '../../setup';
import { env } from '../../config/env';
import * as crypto from 'crypto';

/**
 * Factory class for creating test workspace data (for Slack OAuth support)
 */
export class WorkspaceFactory {
  /**
   * Creates a default test workspace for Slack
   * @return Promise that resolves when workspace is created
   */
  static async createDefaultSlackWorkspace(): Promise<void> {
    // Use real credentials if SEND_REAL_SLACK is enabled
    const isRealMode = env.SEND_REAL_SLACK === 'true';

    const workspaceId = this.getWorkspaceId();
    const BotToken = isRealMode ? env.SLACK_BOT_TOKEN! : 'xoxb-test-workspace-token';

    // Check if workspace already exists
    const existing = await db('channel_workspaces')
      .where({ workspace_id: workspaceId })
      .first();

    if (!existing) {
      // Encrypt the token to match production behavior
      const tokenToStore = this.encryptToken(BotToken);

      const workspaceData = {
        workspace_id: workspaceId,
        workspace_name: isRealMode ? 'Real Test Workspace' : 'Test Workspace',
        channel: 'slack',
        bot_token: tokenToStore,
        bot_user_id: isRealMode ? 'U_BOT_REAL' : 'U_BOT_TEST',
        is_active: true,
        installed_at: new Date().toISOString()
      };

      await db('channel_workspaces').insert(workspaceData);
    }
  }

  /**
   * Helper method to encrypt tokens for test storage
   * Mimics the CryptoUtil.encrypt behavior
   */
  private static encryptToken(token: string): string {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(env.TOKEN_ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Get the workspace ID based on real/mock mode
   * @returns Workspace ID for use in channel_user_id format (T_DEFAULT for mock, real ID for real mode)
   */
  static getWorkspaceId(): string {
    const isRealMode = env.SEND_REAL_SLACK === 'true';
    return isRealMode ? env.SLACK_WORKSPACE_ID! : 'T_DEFAULT';
  }
}