/**
 * Slack-specific context interfaces for handling commands and interactions
 * Provides type-safe access to Slack event payloads and session management
 */

import type {
  SlashCommand,
  RespondFn,
  AckFn,
  SayFn,
  ViewOutput,
  ViewStateValue,
  ViewResponseAction
} from '@slack/bolt';
import type { WebClient } from '@slack/web-api';

/**
 * Type helper for Slack action/command bodies with channel and team IDs
 * Includes state property for interactive elements
 */
export interface SlackBodyWithIds {
  channel?: { id?: string } | null;
  channel_id?: string;
  team?: { id?: string } | null;
  team_id?: string;
  user?: { id?: string; team_id?: string } | null;
  user_id?: string;
  trigger_id?: string;
  state?: {
    values?: {
      [blockId: string]: {
        [actionId: string]: ViewStateValue;
      };
    };
  } | string; // Can be string for DialogSubmitAction or object for BlockAction
}

/**
 * Type helper for Slack view submission bodies
 * Extends SlackBodyWithIds with view-specific fields
 */
export interface SlackViewBodyWithMetadata extends SlackBodyWithIds {
  view?: ViewOutput;
}

/**
 * Session data structure for Slack users
 * Maintains state across multiple interactions
 */
export interface SlackSession {
  daoSelections?: Set<string>;
  daoAction?: 'subscribe' | 'unsubscribe';
  walletAction?: 'add' | 'remove';
  walletsToRemove?: Set<string>;
  awaitingInput?: {
    type: 'wallet' | 'dao';
    action: 'add' | 'remove';
  };
}

/**
 * Base Slack context interface with common properties
 * Generic interface that all specific contexts extend from
 */
export interface SlackBaseContext<TBody = any, TAck = void> {
  body: TBody;
  session: SlackSession;
  ack: AckFn<TAck>;
  client: WebClient;
}

/**
 * Slack context with messaging capabilities
 * Used by contexts that support respond/say functions
 */
export interface SlackMessageableContext<TBody = any> extends SlackBaseContext<TBody> {
  respond?: RespondFn;
  say?: SayFn;
}

/**
 * Slack command context with session support
 * Provides essential properties from Slack's command args with session management
 */
export interface SlackCommandContext extends SlackMessageableContext<SlashCommand> {}

/**
 * Slack action context for button/select interactions
 * Provides essential properties from Slack's action args with session management
 */
export interface SlackActionContext extends SlackMessageableContext<SlackBodyWithIds> {}

/**
 * Slack view submission context for modal interactions
 * Provides essential properties from Slack's view args with session management
 */
export interface SlackViewContext extends SlackBaseContext<SlackViewBodyWithMetadata, void | ViewResponseAction> {
  view: ViewOutput;
}

/**
 * Session storage interface
 * Provides methods for managing user sessions
 */
export interface SlackSessionStorage {
  get(userId: string): SlackSession;
  set(userId: string, session: SlackSession): void;
  clear(userId: string): void;
  has(userId: string): boolean;
}

/**
 * Slack Bolt App configuration
 * Defines initialization options for the Slack app
 */
export interface SlackBoltConfig {
  token: string;
  appToken?: string;
  signingSecret?: string;
  socketMode?: boolean;
}

/**
 * Handler registration interface for Slack
 * Provides methods to register command and action handlers
 */
export interface SlackHandlerRegistration {
  command(command: string, handler: (context: SlackCommandContext) => Promise<void>): void;
  action(actionId: string | RegExp, handler: (context: SlackActionContext) => Promise<void>): void;
  view(callbackId: string | RegExp, handler: (context: SlackViewContext) => Promise<void>): void;
  message(pattern: string | RegExp, handler: (context: SlackCommandContext) => Promise<void>): void;
  event(eventType: string, handler: (context: any) => Promise<void>): void;
}

/**
 * Slack message options
 * Extends the basic send message options with Slack-specific features
 */
export interface SlackMessageOptions {
  text: string;
  blocks?: any[];
  attachments?: any[];
  thread_ts?: string;
  mrkdwn?: boolean;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  ephemeral?: boolean;
  user?: string; // For ephemeral messages
}