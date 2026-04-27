/**
 * @fileoverview Trigger logic for handling new proposals in the dB.
 * This module monitors for active proposals and sends them to the Dispatcher.
 */

import { Trigger } from './base-trigger';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';
import { NotificationTypeId } from '@notification-system/messages';
import { OnchainProposal, proposals, proposalsPathParamsDaoEnum, ProposalsQueryParams } from "@anticapture/client"

const triggerId = NotificationTypeId.NewProposal;

export class NewProposalTrigger extends Trigger<OnchainProposal, ProposalsQueryParams> {
  private timestampCursor: number;
  constructor(
    private readonly dispatcherService: DispatcherService,
    interval: number,
    initialTimestamp?: string
  ) {
    super(triggerId, interval);
    // Use provided timestamp or default to 24 hours lookback
    if (initialTimestamp) {
      this.timestampCursor = parseInt(initialTimestamp, 10);
    } else {
      this.timestampCursor = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000); // 24 hours ago
    }
  }

  /**
   * Resets the trigger state to initial timestamp
   * @param timestamp Optional timestamp to reset to, defaults to 24 hours ago
   * @todo This method will be removed when we migrate to Redis for state management,
   * allowing proper state isolation between tests without manual resets
   */
  public reset(timestamp?: string): void {
    if (timestamp) {
      this.timestampCursor = parseInt(timestamp, 10);
    } else {
      this.timestampCursor = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000); // 24 hours ago
    }
  }

  async process(data: OnchainProposal[]) {
    if (data.length === 0) {
      return;
    }

    const message: DispatcherMessage = {
      triggerId: this.id,
      events: data
    };
    await this.dispatcherService.sendMessage(message);

    // Update timestamp to the most recent proposal's timestamp + 1
    // Since data comes ordered by timestamp desc, the first item has the latest timestamp
    if (data[0]?.timestamp) {
      this.timestampCursor = data[0].timestamp + 1;
    }
  }

  /**
   * Fetches proposals from the database
   * @returns Array of proposals
   */
  protected async fetchData(options?: ProposalsQueryParams): Promise<OnchainProposal[]> {
    if (!options?.status) {
      throw new Error('Status is required in filter options');
    }

    const responses = await Promise.all(Object.values(proposalsPathParamsDaoEnum).map(dao =>
      proposals(dao, {
        fromDate: this.timestampCursor,
        status: options.status,
      }, {
        headers: {
          "x-client-source": "notification-system"
        }
      })
    ))

    return responses.flatMap((r) => r.items);
  }
} 