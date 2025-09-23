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
    private workspaceService: WorkspaceService,
    private slackClientId: string,
    private slackClientSecret: string,
    private slackRedirectUri: string
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
    const clientId = this.slackClientId;
    const redirectUri = this.slackRedirectUri;

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

    const clientId = this.slackClientId;
    const clientSecret = this.slackClientSecret;
    const redirectUri = this.slackRedirectUri;

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
        channel: 'slack',
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
    return `<html>
<head>
  <meta http-equiv="refresh" content="0; URL=slack://open">
  <style>
    body {
      padding: 10px 15px;
      font-family: verdana;
      text-align: center;
    }
  </style>
</head>
<body>
  <h2>Thank you!</h2>
  <p>The DAO Notification Bot has been successfully installed to <strong>${workspaceName}</strong>.</p>
  <p>Redirecting to Slack... click <a href="slack://open">here</a>.
     If you use the browser version, click <a href="https://app.slack.com" target="_blank">this link</a> instead.</p>
  <p>Use <code>/dao-notify help</code> to get started.</p>
</body>
</html>`;
  }

  /**
   * Generate error HTML page
   */
  private generateErrorPage(error: string): string {
    return `<html>
<head>
  <style>
    body {
      padding: 10px 15px;
      font-family: verdana;
      text-align: center;
    }
  </style>
</head>
<body>
  <h2>Oops, Something Went Wrong!</h2>
  <p>The installation was not completed.</p>
  <p>Error: ${error}</p>
  <p><a href="/slack/install">Try Again</a> or contact the app owner.</p>
</body>
</html>`;
  }
}