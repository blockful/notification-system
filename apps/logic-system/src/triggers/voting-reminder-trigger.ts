/**
 * @fileoverview Trigger logic for handling voting reminders.
 * This module monitors for active proposals and sends reminders to users who haven't voted
 * based on configurable time thresholds (e.g., 30%, 60%, 90% of proposal duration elapsed).
 */

import { Trigger } from './base-trigger';
import { VotingReminderProposal, VotingReminderDataSource } from '../interfaces/voting-reminder.interface';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';

/**
 * Event data sent to dispatcher for voting reminders
 */
export interface VotingReminderEvent {
  id: string;
  daoId: string;
  title?: string;
  description?: string;
  startTimestamp: number;
  endTimestamp: number;
  timeElapsedPercentage: number;
  thresholdPercentage: number;
  link?: string;
  discussion?: string;
}

const DEFAULT_TRIGGER_ID_PREFIX = 'voting-reminder';
// 5% window the event will be triggered between thresholdPercentage and thresholdPercentage + window
const DEFAULT_WINDOW_SIZE = 5;

export class VotingReminderTrigger extends Trigger<VotingReminderProposal> {
  private thresholdPercentage: number;
  private windowSize: number;

  constructor(
    private readonly dispatcherService: DispatcherService,
    private readonly dataSource: VotingReminderDataSource,
    interval: number,
    thresholdPercentage: number = 75,
    windowSize: number = DEFAULT_WINDOW_SIZE,
    triggerIdPrefix: string = DEFAULT_TRIGGER_ID_PREFIX
  ) {
    super(`${triggerIdPrefix}-${thresholdPercentage}`, interval);
    this.thresholdPercentage = thresholdPercentage;
    this.windowSize = windowSize;
  }

  /**
   * Processes proposals and sends voting reminders for eligible ones
   */
  async process(proposals: VotingReminderProposal[]): Promise<void> {
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
  }

  /**
   * Filters proposals that are eligible for reminders
   */
  private filterEligibleProposals(proposals: VotingReminderProposal[]): VotingReminderProposal[] {
    const now = Math.floor(Date.now() / 1000);

    return proposals.filter(proposal => {
      // Skip null proposals
      if (!proposal) {
        return false;
      }

      // Skip if proposal doesn't have required timestamps
      if (!proposal.startTime || !proposal.endTime) {
        return false;
      }

      // Skip if proposal is not active
      if (now <= proposal.startTime || now >= proposal.endTime) {
        return false;
      }

      const timeElapsedPercentage = this.calculateTimeElapsedPercentage(
        proposal.startTime,
        proposal.endTime,
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
  private createReminderEvent(proposal: VotingReminderProposal): VotingReminderEvent {
    if (!proposal || !proposal.startTime || !proposal.endTime) {
      throw new Error('Invalid proposal data for reminder event');
    }

    const now = Math.floor(Date.now() / 1000);
    const timeElapsedPercentage = this.calculateTimeElapsedPercentage(proposal.startTime, proposal.endTime, now);

    return {
      id: proposal.id,
      daoId: proposal.daoId,
      title: proposal.title,
      description: proposal.description,
      startTimestamp: proposal.startTime,
      endTimestamp: proposal.endTime,
      timeElapsedPercentage: Math.round(timeElapsedPercentage * 100) / 100, // Round to 2 decimal places
      thresholdPercentage: this.thresholdPercentage,
      link: proposal.link,
      discussion: proposal.discussion,
    };
  }

  /**
   * Fetches active proposals from the data source
   */
  protected async fetchData(): Promise<VotingReminderProposal[]> {
    return await this.dataSource.listActiveForReminder();
  }
}
