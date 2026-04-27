/**
 * Slack Client Implementation
 * Production implementation using @slack/web-api and @slack/bolt
 * Supports both basic Web API calls and Socket Mode for interactive features
 */

import { WebClient } from '@slack/web-api';
import { App, HTTPReceiver, Installation, ViewSubmitAction } from '@slack/bolt';
import {
  SlackClientInterface,
  SlackSendMessageOptions,
  SlackMessage
} from '../interfaces/slack-client.interface';
import {
  SlackHandlerRegistration,
  SlackCommandContext,
  SlackActionContext,
  SlackViewContext,
  SlackSessionStorage,
  SlackSession
} from '../interfaces/slack-context.interface';
import { CryptoUtil } from '../utils/crypto';
import { convertMarkdownToSlack } from '@notification-system/messages';
import { createLogger, type Logger } from '@anticapture/observability';

export class SlackClient implements SlackClientInterface {
  private boltApp: App;
  private sessionStorage: SlackSessionStorage;
  private subscriptionServerUrl: string;
  private tokenEncryptionKey: string;
  private port: number;
  private readonly logger: Logger;

  constructor(
    signingSecret: string,
    subscriptionServerUrl: string,
    tokenEncryptionKey: string,
    port: number,
    logger: Logger = createLogger('consumers'),
  ) {
    this.sessionStorage = new InMemorySessionStorage();
    this.subscriptionServerUrl = subscriptionServerUrl;
    this.tokenEncryptionKey = tokenEncryptionKey;
    this.port = port;
    this.logger = logger.child({ component: 'SlackClient' });
    this.boltApp = this.createBoltApp(signingSecret);
  }

  /**
   * Create Bolt app with installationStore and authorize callback
   */
  private createBoltApp(
    signingSecret: string
  ): App {
    const installationStore = {
      storeInstallation: async () => {},
      fetchInstallation: async (installQuery) => {
          // Fetch installation from subscription server
          const response = await fetch(
            `${this.subscriptionServerUrl}/slack/workspace/${installQuery.teamId}/token`
          );

          if (!response.ok) {
            throw new Error(`Installation not found for workspace ${installQuery.teamId}`);
          }
          const installation = await response.json() as Installation;

          // Decrypt the token before returning
          installation.bot!.token = CryptoUtil.decrypt(installation.bot!.token, this.tokenEncryptionKey);

          return installation;
        },
      deleteInstallation: async () => {}
    };

    this.logger.info({ event: 'slack_client.oauth_initialized' }, 'slack client OAuth mode initialized');
    return new App({
      signingSecret,
      receiver: new HTTPReceiver({
        signingSecret,
        endpoints: '/slack/events',
        processBeforeResponse: true,
      }),
      installationStore,
      authorize: async (source) => {
        // Fetch installation using the installationStore
        const installation = await installationStore.fetchInstallation({
          teamId: source.teamId,
          enterpriseId: source.enterpriseId,
          isEnterpriseInstall: source.isEnterpriseInstall,
        });

        if (!installation) {
          throw new Error(`No installation found for team ${source.teamId}`);
        }

        // Return authorization result
        return {
          botToken: installation.bot?.token,
          botId: installation.bot?.id,
          botUserId: installation.bot?.userId,
          teamId: installation.team?.id,
          enterpriseId: installation.enterprise?.id,
        };
      }
    });
  }

  async sendMessage(
    channel: string,
    text: string,
    options?: SlackSendMessageOptions
  ): Promise<SlackMessage> {
    if (!options?.token) {
      throw new Error('Slack notification requires workspace OAuth token. No token provided in message options.');
    }

    // Convert markdown to Slack mrkdwn format
    const slackText = convertMarkdownToSlack(text);
    const clientToUse = new WebClient(options.token);

    const result = await clientToUse.chat.postMessage({
      channel,
      text: slackText,
      blocks: options?.blocks,
      parse: options?.parse || 'none',
      link_names: options?.link_names ?? true,
      unfurl_links: options?.unfurl_links ?? false,
      unfurl_media: options?.unfurl_media ?? false,
      mrkdwn: options?.mrkdwn ?? true
    });

    if (!result.ok) {
      this.logger.error({ slackError: result.error, event: 'slack.send_failed' }, 'failed to send Slack message');
    }

    return {
      ts: result.ts as string,
      channel: result.channel as string,
      text: slackText
    };
  }

  /**
   * Register a command handler with session management
   */
  private registerCommand(
    command: string,
    handler: (context: SlackCommandContext) => Promise<void>
  ): void {
    this.boltApp.command(command, async (args) => {
      const userId = args.body.user_id;
      const session = this.sessionStorage.get(userId);
      const context: SlackCommandContext = {
        body: args.body,
        session,
        ack: args.ack as any,
        respond: args.respond,
        say: args.say,
        client: args.client
      };

      try {
        await handler(context);
        this.sessionStorage.set(userId, context.session);
      } catch (error) {
        this.logger.error({ err: error, command, event: 'slack.command_failed' }, 'error handling command');
        await args.ack();
        await args.respond({
          text: '❌ An error occurred while processing your command. Please try again.',
          response_type: 'ephemeral'
        });
      }
    });
  }

  /**
   * Register an action handler with session management
   */
  private registerAction(
    actionId: string | RegExp,
    handler: (context: SlackActionContext) => Promise<void>
  ): void {
    this.boltApp.action(actionId, async (args) => {
      const userId = args.body.user.id;
      const session = this.sessionStorage.get(userId);
      const context: SlackActionContext = {
        body: args.body,
        session,
        ack: args.ack as any,
        respond: args.respond,
        say: undefined,
        client: args.client
      };

      try {
        await handler(context);
        this.sessionStorage.set(userId, context.session);
      } catch (error) {
        this.logger.error({ err: error, actionId, event: 'slack.action_failed' }, 'error handling action');
        await args.ack();
      }
    });
  }

  /**
   * Register a view submission handler with session management
   */
  private registerView(
    callbackId: string | RegExp,
    handler: (context: SlackViewContext) => Promise<void>
  ): void {
    this.boltApp.view<ViewSubmitAction>(callbackId, async (args) => {
      const userId = args.body.user.id;
      const session = this.sessionStorage.get(userId);
      const context: SlackViewContext = {
        body: args.body,
        view: args.view,
        session,
        ack: args.ack,
        client: args.client
      };

      try {
        await handler(context);
        this.sessionStorage.set(userId, context.session);
      } catch (error) {
        this.logger.error({ err: error, callbackId, event: 'slack.view_failed' }, 'error handling view');
        await args.ack();
      }
    });
  }

  /**
   * Register a message handler with session management
   */
  private registerMessage(
    pattern: string | RegExp,
    handler: (context: SlackCommandContext) => Promise<void>
  ): void {
    this.boltApp.message(pattern, async (args) => {
      const userId = (args.message as any).user;
      const session = this.sessionStorage.get(userId);
      const context: SlackCommandContext = {
        body: args.message as any,
        session,
        ack: async () => {},  // No ack needed for message events
        respond: undefined,
        say: args.say,
        client: args.client
      };

      try {
        await handler(context);
        this.sessionStorage.set(userId, context.session);
      } catch (error) {
        this.logger.error({ err: error, pattern, event: 'slack.message_pattern_failed' }, 'error handling message pattern');
      }
    });
  }

  /**
   * Register event handler (e.g., app_home_opened)
   */
  private registerEvent(
    eventType: string,
    handler: (context: any) => Promise<void>
  ): void {
    this.boltApp.event(eventType as any, async (args) => {
      try {
        await handler(args);
      } catch (error) {
        this.logger.error({ err: error, eventType, event: 'slack.event_failed' }, 'error handling event');
      }
    });
  }

  /**
   * Setup all handlers via registration function
   */
  setupHandlers(registration: (handlers: SlackHandlerRegistration) => void): void {
    registration({
      command: this.registerCommand.bind(this),
      action: this.registerAction.bind(this),
      view: this.registerView.bind(this),
      message: this.registerMessage.bind(this),
      event: this.registerEvent.bind(this)
    });
  }

  /**
   * Launch the Slack bot
   */
  async launch(): Promise<void> {
    this.logger.info({ event: 'slack_bot.starting' }, 'starting Slack Bolt app');
    try {
      await this.boltApp.start(this.port);
      this.logger.info({ port: this.port, event: 'slack_bot.started' }, 'slack bot is running');
    } catch (error) {
      this.logger.error({ err: error, event: 'slack_bot.start_failed' }, 'failed to start slack bot');
      throw error;
    }
  }

  /**
   * Stop the Slack bot
   */
  async stop(signal?: string): Promise<void> {
    await this.boltApp.stop();
    this.logger.info({ signal: signal || 'manual', event: 'slack_bot.stopped' }, 'slack bot stopped');
  }

  /**
   * Check if the bot is running
   */
  isRunning(): boolean {
    return true; // Always running on port this.port
  }
}

/**
 * In-memory session storage implementation
 * Stores user sessions in memory (will be lost on restart)
 */
class InMemorySessionStorage implements SlackSessionStorage {
  private sessions: Map<string, SlackSession> = new Map();

  get(userId: string): SlackSession {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        daoSelections: new Set<string>(),
        walletAction: undefined,
        walletsToRemove: undefined,
        awaitingInput: undefined
      });
    }
    return this.sessions.get(userId)!;
  }

  set(userId: string, session: SlackSession): void {
    this.sessions.set(userId, session);
  }

  clear(userId: string): void {
    this.sessions.delete(userId);
  }

  has(userId: string): boolean {
    return this.sessions.has(userId);
  }
}