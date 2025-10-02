import { db } from '../../setup';
import { serviceConfig } from '../../config';
import * as crypto from 'crypto';

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
    // Use encryption key from test configuration
    if (!process.env.TOKEN_ENCRYPTION_KEY) {
      process.env.TOKEN_ENCRYPTION_KEY = serviceConfig.oauth.tokenEncryptionKey;
    }

    // Check if workspace already exists
    const existing = await db('channel_workspaces')
      .where({ workspace_id: workspaceId })
      .first();

    if (!existing) {
      // Encrypt the token to match production behavior
      const encryptedToken = this.encryptToken(botToken);

      await db('channel_workspaces').insert({
        workspace_id: workspaceId,
        workspace_name: 'Test Workspace',
        channel: 'slack',
        bot_token: encryptedToken,
        bot_user_id: 'U_BOT_TEST',
        is_active: true,
        installed_at: new Date().toISOString()
      });
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
}