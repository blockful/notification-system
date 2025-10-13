/**
 * Button definitions for trigger notifications
 * Contains call-to-action buttons for each trigger type
 */

import { ExplorerService } from '../formatters/explorer.service';

export interface Button {
  text: string;
  url: string;
}

/**
 * Call-to-action buttons for each trigger type
 * All CTAs link to AntiCapture main page
 */
export const callToActionButtons = {
  delegationChange: {
    text: "Explore delegates activity",
    url: 'https://anticapture.com/'
  },
  newProposal: {
    text: 'Review DAO data before voting',
    url: 'https://anticapture.com/'
  },
  nonVoting: {
    text: 'Check delegates and proposals',
    url: 'https://anticapture.com/'
  },
  voteConfirmation: {
    text: "See delegates activity",
    url: 'https://anticapture.com/'
  },
  votingPowerChange: {
    text: 'Check voting power shifts',
    url: 'https://anticapture.com/'
  },
  votingReminder: {
    text: 'Check about the delegates and proposal information',
    url: 'https://anticapture.com/'
  }
} as const;

/**
 * Text for blockchain explorer (scan) button
 */
export const scanButtonText = 'View Transaction';

/**
 * Parameters for building notification buttons
 */
export interface BuildButtonsParams {
  triggerType: keyof typeof callToActionButtons;
  txHash?: string;
  chainId?: number;
}

const explorerService = new ExplorerService();

/**
 * Build buttons for a notification
 * Always includes CTA button, optionally includes scan button if transaction info is available
 */
export function buildButtons(params: BuildButtonsParams): Button[] {
  const buttons: Button[] = [];

  // Always add CTA button
  buttons.push(callToActionButtons[params.triggerType]);

  // Add scan button if transaction info is available
  if (params.txHash && params.chainId) {
    const scanUrl = explorerService.getTransactionLink(params.chainId, params.txHash);
    if (scanUrl) {
      buttons.push({ text: scanButtonText, url: scanUrl });
    }
  }

  return buttons;
}
