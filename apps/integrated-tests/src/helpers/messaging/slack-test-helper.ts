import { waitFor, waitForCondition } from '../utilities/wait-for';
import { timeouts } from '../../config';
import { SimpleSlackClient, SlackCall } from '../../test-clients/simple-slack.client';

export interface SlackTestMessage {
  channel: string;
  text: string;
  ts?: string;
  [key: string]: any;
}

export class SlackTestHelper {
  constructor(private client: SimpleSlackClient) {}

  async waitForMessage(
    predicate: (message: SlackTestMessage) => boolean,
    options?: { timeout?: number; errorMessage?: string; useHistory?: boolean; channel?: string; token?: string }
  ): Promise<SlackTestMessage> {
    const startCount = this.client.getCapturedCalls().length;

    if (options?.useHistory) {
      return this.waitForMessageInHistory(predicate, options);
    }

    return waitFor(
      () => {
        const calls = this.getNewCalls(startCount);
        const messages = this.toMessages(calls);
        return messages.find(msg => predicate(msg)) as SlackTestMessage;
      },
      {
        timeout: options?.timeout || timeouts.wait.default,
        errorMessage: options?.errorMessage || 'Slack message not received'
      }
    );
  }

  private async waitForMessageInHistory(
    predicate: (message: SlackTestMessage) => boolean,
    options?: { timeout?: number; errorMessage?: string; channel?: string; token?: string }
  ): Promise<SlackTestMessage> {
    const channel = options?.channel || this.getChannelFromCaptured();
    if (!channel) {
      throw new Error('No channel specified or found in captured calls');
    }

    return waitFor(
      async () => {
        const history = await this.client.getMessageHistory(channel, 20, options?.token);
        const messages = history.map(msg => ({
          channel,
          text: msg.text || '',
          ts: msg.ts,
          ...msg
        }));
        return messages.find(msg => predicate(msg)) as SlackTestMessage;
      },
      {
        timeout: options?.timeout || timeouts.wait.default,
        errorMessage: options?.errorMessage || 'Slack message not found in history'
      }
    );
  }

  async waitForMessageCount(
    expectedCount: number,
    options?: {
      timeout?: number;
      toChannel?: string;
      containing?: string;
    }
  ): Promise<SlackTestMessage[]> {
    const startCount = this.client.getCapturedCalls().length;

    await waitForCondition(
      () => {
        const calls = this.getNewCalls(startCount);
        const filteredCalls = this.filterCalls(calls, options);
        return filteredCalls.length >= expectedCount;
      },
      `Expected ${expectedCount} messages but got less`,
      { timeout: options?.timeout || timeouts.wait.default }
    );

    const calls = this.getNewCalls(startCount);
    const filteredCalls = this.filterCalls(calls, options);

    return this.toMessages(filteredCalls.slice(0, expectedCount));
  }

  async waitForChannelMessage(
    channel: string,
    options?: { timeout?: number; containing?: string }
  ): Promise<SlackTestMessage> {
    return this.waitForMessage(
      (msg) => {
        const matchesChannel = msg.channel === channel;
        const matchesText = !options?.containing || msg.text.includes(options.containing);
        return matchesChannel && matchesText;
      },
      {
        timeout: options?.timeout,
        errorMessage: `No message received for channel ${channel}`
      }
    );
  }

  async waitForNoMessages(
    duration: number = timeouts.wait.short,
    options?: { toChannel?: string }
  ): Promise<void> {
    const startCount = this.client.getCapturedCalls().length;

    await new Promise(resolve => setTimeout(resolve, duration));

    const newCalls = this.getNewCalls(startCount);
    const filteredCalls = this.filterCalls(newCalls, options);

    if (filteredCalls.length > 0) {
      throw new Error(
        `Expected no messages but received ${filteredCalls.length} message(s)`
      );
    }
  }

  getAllMessages(): SlackTestMessage[] {
    return this.toMessages(this.client.getCapturedCalls());
  }

  getCallCount(): number {
    return this.client.getCapturedCalls().length;
  }

  private filterCalls(
    calls: readonly SlackCall[],
    options?: { toChannel?: string; containing?: string }
  ): readonly SlackCall[] {
    let filteredCalls: readonly SlackCall[] = calls;

    if (options?.toChannel) {
      filteredCalls = filteredCalls.filter(
        ([channel]) => channel === options.toChannel
      );
    }

    if (options?.containing) {
      filteredCalls = filteredCalls.filter(
        ([, text]) => text.includes(options.containing!)
      );
    }

    return filteredCalls;
  }

  private getNewCalls(sinceCount: number): readonly SlackCall[] {
    return this.client.getCapturedCalls().slice(sinceCount);
  }

  private toMessages(calls: readonly SlackCall[]): SlackTestMessage[] {
    return calls.map(([channel, text, options = {}]) => ({
      channel,
      text,
      ts: `${Date.now()}.000000`,
      ...options
    }));
  }

  private getChannelFromCaptured(): string | undefined {
    const firstCall = this.client.getCapturedCalls()[0];
    return firstCall ? firstCall[0] : undefined;
  }
}
