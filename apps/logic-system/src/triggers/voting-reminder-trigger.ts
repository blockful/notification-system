/**
 * @fileoverview Trigger logic for handling voting reminders.
 * This module monitors for active proposals and sends reminders to users who haven't voted
 * based on configurable time thresholds (e.g., 30%, 60%, 90% of proposal duration elapsed).
 */

import { Trigger } from './base-trigger';
import { ProposalOnChain, ListProposalsOptions, ProposalDataSource } from '../interfaces/proposal.interface';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';

/**
 * Event data sent to dispatcher for voting reminders
 */
export interface VotingReminderEvent {
  id: string;
  daoId: string;
  title?: string;
  description: string;
  startTimestamp: number;
  endTimestamp: number;
  timeElapsedPercentage: number;
  thresholdPercentage: number;
}

const TRIGGER_ID_PREFIX = 'voting-reminder';
// 5% window the event will be triggered between thresholdPercentage and thresholdPercentage + window
const DEFAULT_WINDOW_SIZE = 5; 

export class VotingReminderTrigger extends Trigger<ProposalOnChain> {
  private timestampCursor: number;
  private thresholdPercentage: number;
  private windowSize: number;

  constructor(
    private readonly dispatcherService: DispatcherService,
    private readonly proposalRepository: ProposalDataSource,
    interval: number,
    thresholdPercentage: number = 75,
    windowSize: number = DEFAULT_WINDOW_SIZE,
    initialTimestamp?: string
  ) {
    super(TRIGGER_ID_PREFIX, interval);
    this.thresholdPercentage = thresholdPercentage;
    this.windowSize = windowSize;
    
    // Initialize timestamp - look back 24 hours by default
    if (initialTimestamp) {
      this.timestampCursor = parseInt(initialTimestamp, 10);
    } else {
      this.timestampCursor = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000); // 24 hours ago
    }
  }

  /**
   * Resets the trigger state to initial timestamp
   * @param timestamp Optional timestamp to reset to, defaults to 24 hours ago
   */
  public reset(timestamp?: string): void {
    if (timestamp) {
      this.timestampCursor = parseInt(timestamp, 10);
    } else {
      this.timestampCursor = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000); // 24 hours ago
    }
  }

  /**
   * Processes proposals and sends voting reminders for eligible ones
   */
  async process(proposals: ProposalOnChain[]): Promise<void> {
    if (proposals.length === 0) {
      return;
    }

    const eligibleProposals = this.filterEligibleProposals(proposals);
    
    if (eligibleProposals.length === 0) {
      return;
    }

    const reminderEvents = eligibleProposals.map(proposal => 
      this.createReminderEvent(proposal)
    );

    const message: DispatcherMessage<VotingReminderEvent> = {
      triggerId: this.id,
      events: reminderEvents
    };

    await this.dispatcherService.sendMessage(message);

    // Update timestamp to the most recent proposal's timestamp + 1
    // Since data comes ordered by timestamp desc, the first item has the latest timestamp
    if (proposals[0]?.timestamp) {
      this.timestampCursor = parseInt(proposals[0].timestamp, 10) + 1;
    }

  }

  /**
   * Filters proposals that are eligible for reminders
   */
  private filterEligibleProposals(proposals: ProposalOnChain[]): ProposalOnChain[] {
    const now = Math.floor(Date.now() / 1000);
    
    return proposals.filter(proposal => {
      // Skip null proposals
      if (!proposal) {
        return false;
      }

      // Skip if proposal doesn't have required timestamps
      if (!proposal.timestamp || !proposal.endTimestamp) {
        return false;
      }

      const startTime = parseInt(proposal.timestamp);
      const endTime = parseInt(proposal.endTimestamp);
      
      // Skip if proposal is not active
      if (now <= startTime || now >= endTime) {
        return false;
      }

      const timeElapsedPercentage = this.calculateTimeElapsedPercentage(
        startTime, 
        endTime, 
        now
      );

      // Check if proposal is within the notification window (threshold to threshold + windowSize)
      const threshold = this.thresholdPercentage;
      const windowEnd = Math.min(threshold + this.windowSize, 100);
      
      return timeElapsedPercentage >= threshold && timeElapsedPercentage <= windowEnd;
    });
  }


  /**
   * Calculates the percentage of time elapsed for a proposal
   */
  private calculateTimeElapsedPercentage(
    startTime: number, 
    endTime: number, 
    currentTime: number
  ): number {
    if (currentTime <= startTime) return 0;
    if (currentTime >= endTime) return 100;
    
    return ((currentTime - startTime) / (endTime - startTime)) * 100;
  }

  /**
   * Creates a reminder event from a proposal
   */
  private createReminderEvent(proposal: ProposalOnChain): VotingReminderEvent {
    if (!proposal || !proposal.timestamp || !proposal.endTimestamp) {
      throw new Error('Invalid proposal data for reminder event');
    }
    
    const now = Math.floor(Date.now() / 1000);
    const startTime = parseInt(proposal.timestamp);
    const endTime = parseInt(proposal.endTimestamp);
    const timeElapsedPercentage = this.calculateTimeElapsedPercentage(startTime, endTime, now);

    return {
      id: proposal.id,
      daoId: proposal.daoId,
      title: proposal.title || undefined,
      description: proposal.description,
      startTimestamp: startTime,
      endTimestamp: endTime,
      timeElapsedPercentage: Math.round(timeElapsedPercentage * 100) / 100, // Round to 2 decimal places
      thresholdPercentage: this.thresholdPercentage
    };
  }

  /**
   * Fetches active proposals from the repository
   * Excludes proposals with proposalType = 2 (optimistic proposals)
   */
  protected async fetchData(): Promise<ProposalOnChain[]> {
    return await this.proposalRepository.listAll({
      status: 'ACTIVE',
      fromDate: this.timestampCursor,
      proposalTypeExclude: 2
    });
  }
}