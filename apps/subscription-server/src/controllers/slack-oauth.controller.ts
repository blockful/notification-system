import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { WebClient } from '@slack/web-api';
import { WorkspaceService, WorkspaceData } from '../services/workspace.service';

/**
 * Controller handling Slack OAuth flow
 * Provides endpoints for app installation and OAuth callback
 */
export class SlackOAuthController {
  private slackClient: WebClient;

  constructor(
    private workspaceService: WorkspaceService
  ) {
    this.slackClient = new WebClient();
  }

  /**
   * Register OAuth routes
   */
  register(app: FastifyInstance): FastifyInstance {
    // Create a new context without Zod type provider for these routes
    app.register((instance, opts, done) => {
      // Install endpoint - redirects to Slack OAuth page
      instance.get('/slack/install', this.handleInstall.bind(this));

      // OAuth callback endpoint
      instance.get('/slack/oauth/callback', this.handleOAuthCallback.bind(this));

      // Status endpoint to check if workspace is installed
      instance.get('/slack/status/:workspaceId', this.handleStatus.bind(this));

      done();
    });

    return app;
  }

  /**
   * Handle installation request - redirect to Slack OAuth
   */
  private async handleInstall(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = process.env.SLACK_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return reply.code(500).send({
        error: 'OAuth configuration missing. Please set SLACK_CLIENT_ID and SLACK_REDIRECT_URI.'
      });
    }

    // Build Slack OAuth URL
    const scopes = [
      'chat:write',
      'chat:write.public',
      'commands',
      'app_mentions:read',
      'im:read',
      'im:write',
      'im:history'
    ].join(',');

    const oauthUrl = new URL('https://slack.com/oauth/v2/authorize');
    oauthUrl.searchParams.append('client_id', clientId);
    oauthUrl.searchParams.append('scope', scopes);
    oauthUrl.searchParams.append('redirect_uri', redirectUri);

    // Redirect to Slack OAuth page
    return reply.redirect(oauthUrl.toString());
  }

  /**
   * Handle OAuth callback from Slack
   */
  private async handleOAuthCallback(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { code } = request.query as { code: string; state?: string };

    if (!code) {
      return reply.code(400).send({
        error: 'Authorization code missing'
      });
    }

    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const redirectUri = process.env.SLACK_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return reply.code(500).send({
        error: 'OAuth configuration incomplete'
      });
    }

    try {
      // Exchange code for access token
      const oauthResponse = await this.slackClient.oauth.v2.access({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      });

      if (!oauthResponse.ok || !oauthResponse.access_token) {
        throw new Error('Failed to exchange code for token');
      }

      // Extract workspace and bot information
      const workspaceData: WorkspaceData = {
        workspaceId: oauthResponse.team?.id as string,
        workspaceName: oauthResponse.team?.name as string,
        botToken: oauthResponse.access_token,
        botUserId: oauthResponse.bot_user_id as string,
      };

      // Save workspace credentials
      await this.workspaceService.saveWorkspace(workspaceData);

      // Return success HTML page
      const successHtml = this.generateSuccessPage(workspaceData.workspaceName || 'your workspace');

      return reply
        .code(200)
        .header('Content-Type', 'text/html')
        .send(successHtml);

    } catch (error) {
      console.error('OAuth error:', error);

      const errorHtml = this.generateErrorPage(error instanceof Error ? error.message : 'Unknown error');

      return reply
        .code(400)
        .header('Content-Type', 'text/html')
        .send(errorHtml);
    }
  }

  /**
   * Check workspace installation status
   */
  private async handleStatus(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const { workspaceId } = request.params as { workspaceId: string };

    const workspace = await this.workspaceService.getWorkspace(workspaceId);

    return reply.send({
      installed: workspace !== null,
      workspace_name: workspace?.workspace_name || null,
      is_active: workspace?.is_active || null,
    });
  }

  /**
   * Generate success HTML page
   */
  private generateSuccessPage(workspaceName: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Installation Successful</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            background: white;
            padding: 3rem;
            border-radius: 10px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 500px;
        }
        h1 { color: #2d3748; margin-bottom: 1rem; }
        .success-icon {
            font-size: 4rem;
            color: #48bb78;
            margin-bottom: 1rem;
        }
        p { color: #4a5568; line-height: 1.6; }
        .button {
            display: inline-block;
            margin-top: 2rem;
            padding: 0.75rem 1.5rem;
            background: #4c1d95;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        .button:hover { background: #5b21b6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✓</div>
        <h1>Installation Successful!</h1>
        <p>The DAO Notification Bot has been successfully installed to <strong>${workspaceName}</strong>.</p>
        <p>You can now close this window and return to Slack. Use <code>/dao-notify help</code> to get started.</p>
        <a href="slack://open" class="button">Open Slack</a>
    </div>
</body>
</html>`;
  }

  /**
   * Generate error HTML page
   */
  private generateErrorPage(error: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Installation Failed</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
        }
        .container {
            background: white;
            padding: 3rem;
            border-radius: 10px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 500px;
        }
        h1 { color: #2d3748; margin-bottom: 1rem; }
        .error-icon {
            font-size: 4rem;
            color: #f56565;
            margin-bottom: 1rem;
        }
        p { color: #4a5568; line-height: 1.6; }
        .error-details {
            background: #fed7d7;
            color: #742a2a;
            padding: 1rem;
            border-radius: 5px;
            margin-top: 1rem;
            font-size: 0.9rem;
        }
        .button {
            display: inline-block;
            margin-top: 2rem;
            padding: 0.75rem 1.5rem;
            background: #e53e3e;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        .button:hover { background: #c53030; }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">✕</div>
        <h1>Installation Failed</h1>
        <p>There was an error installing the DAO Notification Bot.</p>
        <div class="error-details">${error}</div>
        <a href="/slack/install" class="button">Try Again</a>
    </div>
</body>
</html>`;
  }
}