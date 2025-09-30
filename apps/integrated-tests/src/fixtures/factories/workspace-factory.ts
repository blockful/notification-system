import { db } from '../../setup';
import { serviceConfig } from '../../config';
import { env } from '../../config/env';
import * as crypto from 'crypto';

/**
 * Factory class for creating test workspace data (for Slack OAuth support)
 */
export class WorkspaceFactory {
  /**
   * Creates a default test workspace for Slack
   * @param workspaceId Optional workspace ID (defaults to T_DEFAULT or env value)
   * @param botToken Optional bot token (defaults to test token or env value)
   * @return Promise that resolves when workspace is created
   */
  static async createDefaultSlackWorkspace(
    workspaceId?: string,
    botToken?: string
  ): Promise<void> {
    // Use real credentials if SEND_REAL_SLACK is enabled
    const isRealMode = env.SEND_REAL_SLACK === 'true';

    const finalWorkspaceId = workspaceId || (isRealMode ? env.SLACK_WORKSPACE_ID! : 'T_DEFAULT');
    const finalBotToken = botToken || (isRealMode ? env.SLACK_BOT_TOKEN! : 'xoxb-test-workspace-token');

    // Always use encryption key from environment or config
    const encryptionKey = process.env.TOKEN_ENCRYPTION_KEY || serviceConfig.oauth.tokenEncryptionKey;
    if (!process.env.TOKEN_ENCRYPTION_KEY) {
      process.env.TOKEN_ENCRYPTION_KEY = encryptionKey;
    }

    // Check if workspace already exists
    const existing = await db('channel_workspaces')
      .where({ workspace_id: finalWorkspaceId })
      .first();

    if (!existing) {
      // Encrypt the token to match production behavior
      const tokenToStore = this.encryptToken(finalBotToken);

      const workspaceData = {
        workspace_id: finalWorkspaceId,
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
    const key = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'hex');
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

  /**
   * Mask sensitive token for logging
   */
  private static maskToken(token: string): string {
    if (!token) return 'NO_TOKEN';
    if (token.length <= 10) return '***';
    return `${token.substring(0, 6)}...${token.substring(token.length - 4)}`;
  }
}