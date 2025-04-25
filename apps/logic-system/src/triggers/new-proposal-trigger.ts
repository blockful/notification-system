/**
 * @fileoverview Trigger logic for handling new proposals in the dB.
 * This module monitors for active proposals and sends them to an API endpoint
 * for further processing.
 */

import { Trigger } from '../interfaces/core/trigger.interface';
import { ProposalOnChain, ListProposalsOptions, ProposalDB } from '../interfaces/repositories/proposal.interface';
import { ApiService, ApiMessage } from '../interfaces/repositories/api-service.interface';

const triggerId = 'newProposalTrigger';
const MESSAGES = {
  SUCCESS: 'New proposal sent to the API.',
  NO_PROPOSALS: 'There are no new proposals.',
  ERROR_FETCHING: 'Error fetching proposals:',
  ERROR_SENDING: 'Error sending message to API:',
  STATUS_REQUIRED: 'Status is required in filter options'
} as const;

export class NewProposalTrigger implements Trigger<ProposalOnChain, ListProposalsOptions> {
  public readonly id: string;
  public readonly interval: number;
  private timer: NodeJS.Timeout | null = null;
  private options?: ListProposalsOptions;

  constructor(
    private readonly apiService: ApiService,
    private readonly proposalDB: ProposalDB,
    interval: number
  ) {
    this.id = triggerId;
    this.interval = interval;
  }

  private filterData(data: ProposalOnChain[], options?: ListProposalsOptions): ProposalOnChain[] {
    if (!options?.status) {
      throw new Error(MESSAGES.STATUS_REQUIRED);
    }
    return data.filter(proposal => proposal?.status === options.status);
  }

  async process(data: ProposalOnChain[], options?: ListProposalsOptions): Promise<string> {
    const filteredData = this.filterData(data, options);
    
    if (filteredData.length === 0) {
      return MESSAGES.NO_PROPOSALS;
    }

    const message: ApiMessage = {
      triggerId: this.id,
      context: JSON.stringify(filteredData.map(proposal => ({
        ...proposal,
        forVotes: proposal.forVotes.toString(),
        againstVotes: proposal.againstVotes.toString(),
        abstainVotes: proposal.abstainVotes.toString()
      })))
    };

    try {
      const result = await this.apiService.sendMessage(message);
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error sending message to API');
      }
      
      return MESSAGES.SUCCESS;
    } catch (error) {
      console.error(`${MESSAGES.ERROR_SENDING} ${error}`);
      throw error;
    }
  }

  /**
   * Starts the trigger to run at the specified interval
   * @param options Options for filtering proposals
   */
  start(options: ListProposalsOptions): void {
    if (this.timer) {
      this.stop();
    }
    
    this.options = options;
    
    this.timer = setInterval(async () => {
      try {
        const proposals = await this.proposalDB.listAll();
        await this.process(proposals, this.options);
      } catch (error) {
        console.error('Error in trigger execution:', error);
      }
    }, this.interval);
  }

  /**
   * Stops the trigger and cleans up resources
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
} 