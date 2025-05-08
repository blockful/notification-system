/**
 * @fileoverview Trigger logic for handling new proposals in the dB.
 * This module monitors for active proposals and sends them to a subscription checker
 * to determine who should be notified.
 */

import { Trigger } from './base-trigger';
import { ProposalOnChain, ListProposalsOptions, ProposalDB } from '../interfaces/proposal.interface';
import { SubscriptionCheckerService, EventContextMessage } from '../interfaces/subscription-checker.interface';

const triggerId = 'newProposalTrigger';
const MESSAGES = {
  SUCCESS: 'New proposal notification processed.',
  NO_PROPOSALS: 'There are no new proposals.',
  ERROR_FETCHING: 'Error fetching proposals:',
  ERROR_CHECKING: 'Error checking subscriptions:',
  STATUS_REQUIRED: 'Status is required in filter options'
} as const;

export class NewProposalTrigger extends Trigger<ProposalOnChain, ListProposalsOptions> {
  constructor(
    private readonly subscriptionChecker: SubscriptionCheckerService,
    private readonly proposalDB: ProposalDB,
    interval: number
  ) {
    super(triggerId, interval);
  }

  async process(data: ProposalOnChain[]): Promise<string> {
    if (data.length === 0) {
      return MESSAGES.NO_PROPOSALS;
    }

    const message: EventContextMessage = {
      triggerId: this.id,
      context: JSON.stringify(data.map(proposal => ({
        ...proposal,
        forVotes: proposal.forVotes.toString(),
        againstVotes: proposal.againstVotes.toString(),
        abstainVotes: proposal.abstainVotes.toString()
      })))
    };

    try {
      const result = await this.subscriptionChecker.checkSubscribers(message);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error checking subscriptions');
      }
      
      return MESSAGES.SUCCESS;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetches proposals from the database
   * @returns Array of proposals
   */
  protected async fetchData(options?: ListProposalsOptions): Promise<ProposalOnChain[]> {
    if (!options?.status) {
      throw new Error(MESSAGES.STATUS_REQUIRED);
    }
    return await this.proposalDB.listAll({ status: options.status });
  }
} 