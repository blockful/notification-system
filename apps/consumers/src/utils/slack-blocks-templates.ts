/**
 * Slack Block Kit Templates
 * Simple builders for reusable UI components
 */

import type { KnownBlock, SectionBlock, ActionsBlock, Button } from '@slack/web-api';
import {
  slackMessages,
  daoEmojis,
  defaultDaoEmoji
} from '@notification-system/messages';

// Simple builders - single responsibility
export const section = (text: string): SectionBlock => ({
  type: 'section',
  text: { type: 'mrkdwn', text }
});

export const button = (
  text: string,
  actionId: string,
  options: { style?: 'primary' | 'danger'; url?: string; value?: string } = {}
): Button => ({
  type: 'button',
  text: { type: 'plain_text', text, emoji: true },
  action_id: actionId,
  ...options
});

export const actions = (...buttons: Button[]): ActionsBlock => ({
  type: 'actions',
  elements: buttons
});

/**
 * Success message
 */
export const successMessage = (text: string): KnownBlock[] => [
  section(`${text}`)
];

/**
 * Error message
 */
export const errorMessage = (text: string): KnownBlock[] => [
  section(`❌ *Error*\n${text}`)
];

/**
 * Generic checkbox selection list
 * Can be used for any item selection (DAOs, wallets, etc.)
 */
export const checkboxSelectionList = (
  items: Array<{ value: string; displayText: string }>,
  selectedValues: Set<string>,
  actionId: string,
  blockId: string,
  confirmActionId: string,
  headerText: string,
  confirmButtonStyle: 'primary' | 'danger' = 'primary'
): KnownBlock[] => {
  // Create checkbox options for each item
  const checkboxOptions = items.map(item => ({
    text: {
      type: 'mrkdwn' as const,
      text: item.displayText
    },
    value: item.value
  }));

  // Convert selected values set to array of initially selected options
  const initialOptions = Array.from(selectedValues)
    .map(value => {
      const item = items.find(i => i.value === value);
      if (!item) return null;
      return {
        text: {
          type: 'mrkdwn' as const,
          text: item.displayText
        },
        value: item.value
      };
    })
    .filter((opt): opt is NonNullable<typeof opt> => opt !== null);

  return [
    section(headerText),
    { type: 'divider' },
    {
      type: 'actions',
      block_id: blockId,
      elements: [
        {
          type: 'checkboxes',
          action_id: actionId,
          options: checkboxOptions,
          initial_options: initialOptions.length > 0 ? initialOptions : undefined
        }
      ]
    },
    { type: 'divider' },
    actions(
      button(slackMessages.dao.confirmButton, confirmActionId, { style: confirmButtonStyle })
    )
  ];
};

/**
 * DAO selection list with checkboxes
 * Wrapper around checkboxSelectionList with DAO-specific formatting
 */
export const daoSelectionList = (
  daos: Array<{ id: string; name?: string }>,
  selectedIds: Set<string>,
  actionPrefix: string,
  confirmActionId: string,
  headerText: string
): KnownBlock[] => {
  // Format DAOs with emojis
  const items = daos.map(dao => {
    const daoId = dao.id.toUpperCase();
    const emoji = daoEmojis.get(daoId) || defaultDaoEmoji;
    return {
      value: daoId,
      displayText: `${emoji} *${daoId}*`
    };
  });

  return checkboxSelectionList(
    items,
    selectedIds,
    actionPrefix,
    'dao_checkboxes_block',
    confirmActionId,
    headerText,
    'primary'
  );
};

/**
 * Wallet selection list with checkboxes (for removal)
 */
export const walletSelectionList = (
  wallets: Array<{ address: string; displayName?: string }>,
  selectedAddresses: Set<string>,
  actionId: string,
  confirmActionId: string,
  headerText: string
): KnownBlock[] => {
  // Format wallets with display names
  const items = wallets.map(wallet => ({
    value: wallet.address,
    displayText: wallet.displayName || wallet.address
  }));

  return checkboxSelectionList(
    items,
    selectedAddresses,
    actionId,
    'wallet_checkboxes_block',
    confirmActionId,
    headerText,
    'danger'
  );
};

/**
 * Onboarding wallet prompt (after DAO selection): "Next step" message + Add wallet button.
 * Shared so showOnboardingWallet and list logic use the same block structure.
 */
export const walletOnboardingPromptBlocks = (): KnownBlock[] => [
  section(slackMessages.wallet.selectionPrefix + slackMessages.wallet.listHeader),
  actions(button(slackMessages.wallet.buttonAdd, 'wallet_add', { style: 'primary', value: 'onboarding' }))
];

/**
 * Wallet empty state
 */
export const walletEmptyState = (): KnownBlock[] => [
  section(slackMessages.wallet.emptyList),
  actions(
    button(slackMessages.wallet.buttonAdd, 'wallet_add', { style: 'primary' }),
    button(slackMessages.wallet.buttonRemove, 'wallet_remove', { style: 'danger' })
  )
];

/**
 * DAO empty state
 */
export const daoEmptyState = (): KnownBlock[] => [
  section(slackMessages.dao.emptyList),
  actions(
    button(slackMessages.dao.buttonSubscribe, 'dao_subscribe', { style: 'primary' })
  )
];

/**
 * DAO list with edit button
 */
export const daoListWithEdit = (daoList: string): KnownBlock[] => [
  section(slackMessages.dao.listHeader + '\n' + daoList),
  { type: 'divider' },
  actions(
    button(slackMessages.dao.buttonEdit, 'dao_edit_subscriptions', { style: 'primary' })
  )
];