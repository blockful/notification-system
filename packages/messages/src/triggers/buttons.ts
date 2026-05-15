/**
 * Button definitions for trigger notifications
 * Contains call-to-action buttons with dynamic URL builders for each trigger type
 */

import { ExplorerService } from '../formatters/explorer.service';

export interface Button {
  text: string;
  url: string;
}

const BASE_URL = 'https://anticapture.com';

interface CtaButtonConfig {
  text: string;
  buildUrl: (params: Record<string, string | undefined>) => string;
}

/**
 * CTA button configurations with dynamic URL builders per trigger type
 * Falls back to BASE_URL when required params are missing
 */
const ctaButtonConfigs: Record<string, CtaButtonConfig> = {
  delegationChange: {
    text: 'Check delegation details',
    buildUrl: ({ daoId, address }) =>
      daoId && address
        ? `${BASE_URL}/${daoId}/holders-and-delegates?tab=delegates&drawerAddress=${address}&drawerTab=voteComposition`
        : BASE_URL
  },
  newProposal: {
    text: 'Check proposal details',
    buildUrl: ({ daoId, proposalId }) =>
      daoId && proposalId
        ? `${BASE_URL}/${daoId}/governance/proposal/${proposalId}`
        : BASE_URL
  },
  nonVoting: {
    text: 'Check previous votes',
    buildUrl: ({ daoId, address }) =>
      daoId && address
        ? `${BASE_URL}/${daoId}/holders-and-delegates?tab=delegates&drawerAddress=${address}`
        : BASE_URL
  },
  voteConfirmation: {
    text: 'Check vote details',
    buildUrl: ({ daoId, address }) =>
      daoId && address
        ? `${BASE_URL}/${daoId}/holders-and-delegates?tab=delegates&drawerAddress=${address}`
        : BASE_URL
  },
  votingPowerChange: {
    text: 'Check voting power changes',
    buildUrl: ({ daoId, address }) =>
      daoId && address
        ? `${BASE_URL}/${daoId}/holders-and-delegates?tab=delegates&drawerAddress=${address}&drawerTab=votingPowerHistory`
        : BASE_URL
  },
  votingReminder: {
    text: 'Cast your vote',
    buildUrl: ({ daoId, proposalId }) =>
      daoId && proposalId
        ? `${BASE_URL}/${daoId}/governance/proposal/${proposalId}`
        : BASE_URL
  },
  'voting-reminder': {
    text: 'Cast your vote',
    buildUrl: ({ daoId, proposalId }) =>
      daoId && proposalId
        ? `${BASE_URL}/${daoId}/governance/proposal/${proposalId}`
        : BASE_URL
  },
  newOffchainProposal: {
    text: 'Cast your vote',
    buildUrl: ({ proposalUrl }) =>
      proposalUrl || BASE_URL
  },
  offchainProposalFinished: {
    text: 'View proposal results',
    buildUrl: ({ proposalUrl }) =>
      proposalUrl || BASE_URL
  },
  offchainVotingReminder: {
    text: 'Cast your vote',
    buildUrl: ({ proposalUrl }) =>
      proposalUrl || BASE_URL
  },
  'offchain-voting-reminder': {
    text: 'Cast your vote',
    buildUrl: ({ proposalUrl }) =>
      proposalUrl || BASE_URL
  },
};

/**
 * Text for blockchain explorer (scan) button
 */
export const scanButtonText = 'View Transaction';

/**
 * Text for forum discussion button
 */
export const discussionButtonText = 'View Discussion';

/**
 * Parameters for building notification buttons
 */
export interface BuildButtonsParams {
  triggerType: keyof typeof ctaButtonConfigs;
  txHash?: string;
  chainId?: number;
  discussionUrl?: string;
  daoId?: string;
  address?: string;
  proposalId?: string;
  proposalUrl?: string;
  supportsCalldataReview?: boolean;
}

const explorerService = new ExplorerService();

/**
 * Build buttons for a notification, organized as rows.
 * Each inner array is a row rendered side-by-side; outer array stacks rows top-to-bottom.
 */
export function buildButtons(params: BuildButtonsParams): Button[][] {
  const config = ctaButtonConfigs[params.triggerType];
  const url = config.buildUrl({
    daoId: params.daoId,
    address: params.address,
    proposalId: params.proposalId,
    proposalUrl: params.proposalUrl
  });

  const mainRow: Button[] = [{ text: config.text, url }];

  if (params.discussionUrl) {
    mainRow.push({ text: discussionButtonText, url: params.discussionUrl });
  }

  if (params.txHash && params.chainId) {
    const scanUrl = explorerService.getTransactionLink(params.chainId, params.txHash);
    if (scanUrl) mainRow.push({ text: scanButtonText, url: scanUrl });
  }

  const rows: Button[][] = [mainRow];

  // Calldata review gets its own row when the DAO doesn't natively support it
  if (params.supportsCalldataReview === false) {
    const message = encodeURIComponent(
      `Hi, I'd like to request a call-data review for proposal ${params.proposalId ?? 'unknown'} in ${params.daoId ?? 'unknown'}.`
    );
    rows.push([{ text: '🔎 Request a call-data review', url: `https://t.me/Zeugh?text=${message}` }]);
  }

  return rows;
}
