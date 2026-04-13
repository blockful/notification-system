import { ProposalOnChain } from '../interfaces/proposal.interface';
import { OffchainProposal } from '../interfaces/offchain-proposal.interface';
import { VotingReminderProposal } from '../interfaces/voting-reminder.interface';

/**
 * Maps an on-chain proposal to the normalized VotingReminderProposal shape.
 */
export function mapOnchainToReminderProposal(p: ProposalOnChain): VotingReminderProposal {
  return {
    id: p.id,
    daoId: p.daoId,
    title: p.title || undefined,
    description: p.description,
    startTime: p.timestamp,
    endTime: p.endTimestamp,
  };
}

/**
 * Maps an off-chain (Snapshot) proposal to the normalized VotingReminderProposal shape.
 * Uses `start` (actual voting start) when available, falls back to `created`.
 */
export function mapOffchainToReminderProposal(p: OffchainProposal): VotingReminderProposal {
  return {
    id: p.id,
    daoId: p.daoId,
    title: p.title || undefined,
    startTime: p.start ?? p.created,
    endTime: p.end,
    link: p.link,
    discussion: p.discussion,
  };
}
