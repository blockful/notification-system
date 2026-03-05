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
  }
};

/**
 * Text for blockchain explorer (scan) button
 */
export const scanButtonText = 'View Transaction';

/**
 * Parameters for building notification buttons
 */
export interface BuildButtonsParams {
  triggerType: keyof typeof ctaButtonConfigs;
  txHash?: string;
  chainId?: number;
  daoId?: string;
  address?: string;
  proposalId?: string;
}

const explorerService = new ExplorerService();

/**
 * Build buttons for a notification
 * Always includes CTA button with dynamic URL, optionally includes scan button
 */
export function buildButtons(params: BuildButtonsParams): Button[] {
  const buttons: Button[] = [];
  const config = ctaButtonConfigs[params.triggerType];

  const url = config.buildUrl({
    daoId: params.daoId,
    address: params.address,
    proposalId: params.proposalId
  });

  buttons.push({ text: config.text, url });

  // Add scan button if transaction info is available
  if (params.txHash && params.chainId) {
    const scanUrl = explorerService.getTransactionLink(params.chainId, params.txHash);
    if (scanUrl) {
      buttons.push({ text: scanButtonText, url: scanUrl });
    }
  }

  return buttons;
}
