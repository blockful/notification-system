/**
 * Slack Client Implementation
 * Production implementation using @slack/web-api and @slack/bolt
 * Supports both basic Web API calls and Socket Mode for interactive features
 */

import { WebClient } from '@slack/web-api';
import { App } from '@slack/bolt';
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

export class SlackClient implements SlackClientInterface {
  private client: WebClient;
  private boltApp: App;
  private sessionStorage: SlackSessionStorage;

  constructor(
    token: string,
    appToken: string,
    signingSecret: string
  ) {
    this.client = new WebClient(token);

    // Initialize session storage
    this.sessionStorage = new InMemorySessionStorage();

    // Initialize Bolt app with Socket Mode
    this.boltApp = new App({
      token,
      appToken,
      signingSecret,
      socketMode: true,
      processBeforeResponse: true
    });
    console.log('✅ Slack client initialized with Socket Mode support');
  }

  async sendMessage(
    channel: string,
    text: string,
    options?: SlackSendMessageOptions
  ): Promise<SlackMessage> {
    // Convert markdown to Slack mrkdwn format
    const slackText = this.convertMarkdownToSlackFormat(text);

    const result = await this.client.chat.postMessage({
      channel,
      text: slackText,
      parse: options?.parse || 'none',
      link_names: options?.link_names ?? true,
      unfurl_links: options?.unfurl_links ?? false,
      unfurl_media: options?.unfurl_media ?? false,
      mrkdwn: options?.mrkdwn ?? true
    });

    if (!result.ok) {
      console.error(`Failed to send Slack message: ${result.error}`);
    }

    return {
      ts: result.ts as string,
      channel: result.channel as string,
      text: slackText
    };
  }

  /**
   * Convert Telegram markdown to Slack mrkdwn format
   * @param text Text with Telegram markdown formatting
   * @returns Text with Slack mrkdwn formatting
   */
  private convertMarkdownToSlackFormat(text: string): string {
    return text
      // Convert [text](url) links to <url|text> format
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>')
      // Convert **bold** to *bold*
      .replace(/\*\*([^*]+)\*\*/g, '*$1*');
  }

  /**
   * Setup handlers for Slack commands and interactions
   */
  setupHandlers(registration: (handlers: SlackHandlerRegistration) => void): void {
    const handlers: SlackHandlerRegistration = {
      command: (command: string, handler: (context: SlackCommandContext) => Promise<void>) => {
        this.boltApp.command(command, async (args) => {
          // Add session to context
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
            // Save session after handler
            this.sessionStorage.set(userId, context.session);
          } catch (error) {
            console.error(`Error handling command ${command}:`, error);
            await args.ack();
            await args.respond({
              text: '❌ An error occurred while processing your command. Please try again.',
              response_type: 'ephemeral'
            });
          }
        });
      },

      action: (actionId: string | RegExp, handler: (context: SlackActionContext) => Promise<void>) => {
        this.boltApp.action(actionId, async (args) => {
          // Add session to context
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
            // Save session after handler
            this.sessionStorage.set(userId, context.session);
          } catch (error) {
            console.error(`Error handling action ${actionId}:`, error);
            await args.ack();
          }
        });
      },

      view: (callbackId: string | RegExp, handler: (context: SlackViewContext) => Promise<void>) => {
        this.boltApp.view(callbackId, async (args) => {
          // Add session to context
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
            // Save session after handler
            this.sessionStorage.set(userId, context.session);
          } catch (error) {
            console.error(`Error handling view ${callbackId}:`, error);
            await args.ack();
          }
        });
      },

      message: (pattern: string | RegExp, handler: (context: SlackCommandContext) => Promise<void>) => {
        this.boltApp.message(pattern, async (args) => {
          // Add session to context
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
            // Save session after handler
            this.sessionStorage.set(userId, context.session);
          } catch (error) {
            console.error(`Error handling message pattern ${pattern}:`, error);
          }
        });
      }
    };

    registration(handlers);
  }

  /**
   * Launch the Slack bot
   */
  async launch(): Promise<void> {
    console.log('🚀 Starting Slack Bolt app...');
    try {
      await this.boltApp.start();
      console.log('⚡ Slack bot is running in Socket Mode!');
    } catch (error) {
      console.error('❌ Failed to start Slack bot:', error);
      throw error;
    }
  }

  /**
   * Stop the Slack bot
   */
  stop(signal?: string): void {
    this.boltApp.stop();
    console.log(`Slack bot stopped (${signal || 'manual'})`);
  }

  /**
   * Check if the bot is running
   */
  isRunning(): boolean {
    return true; // Always in Socket Mode now
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