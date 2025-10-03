/**
 * Slack Block Kit Templates
 * Simple builders for reusable UI components
 */

import {
  slackMessages,
  daoEmojis,
  defaultDaoEmoji
} from '@notification-system/messages';

type Block = any;

// Simple builders - single responsibility
export const section = (text: string): Block => ({
  type: 'section',
  text: { type: 'mrkdwn', text }
});

export const button = (
  text: string,
  actionId: string,
  options: { style?: 'primary' | 'danger'; url?: string; value?: string } = {}
): any => ({
  type: 'button',
  text: { type: 'plain_text', text, emoji: true },
  action_id: actionId,
  ...options
});

export const actions = (...buttons: any[]): Block => ({
  type: 'actions',
  elements: buttons
});

/**
 * Success message
 */
export const successMessage = (text: string): Block[] => [
  section(`✅ *Success!*\n${text}`)
];

/**
 * Error message
 */
export const errorMessage = (text: string): Block[] => [
  section(`❌ *Error*\n${text}`)
];

/**
 * DAO selection list with checkboxes
 */
export const daoSelectionList = (
  daos: Array<{ id: string; name?: string }>,
  selectedIds: Set<string>,
  actionPrefix: string,
  confirmActionId: string,
  headerText: string
): Block[] => [
  section(headerText),
  ...daos.map(dao => {
    const daoId = dao.id.toUpperCase();
    const isSelected = selectedIds.has(daoId);
    const emoji = daoEmojis.get(daoId) || defaultDaoEmoji;

    return {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${isSelected ? '☑️' : '☐'} *${emoji} ${daoId}*`
      },
      accessory: button(
        isSelected ? slackMessages.dao.buttonSelected : slackMessages.dao.buttonSelect,
        `${actionPrefix}_${daoId}`,
        { style: isSelected ? 'primary' : undefined, value: daoId }
      )
    };
  }),
  { type: 'divider' },
  actions(button(slackMessages.dao.confirmButton, confirmActionId, { style: 'primary' }))
];

/**
 * Wallet empty state
 */
export const walletEmptyState = (): Block[] => [
  section(slackMessages.wallet.emptyList),
  actions(
    button('Add Wallet', 'wallet_add', { style: 'primary' }),
    button('Remove Wallet', 'wallet_remove', { style: 'danger' })
  )
];