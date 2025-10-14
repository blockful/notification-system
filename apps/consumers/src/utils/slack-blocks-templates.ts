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
): Block[] => {
  // Create checkbox options for each DAO
  const checkboxOptions = daos.map(dao => {
    const daoId = dao.id.toUpperCase();
    const emoji = daoEmojis.get(daoId) || defaultDaoEmoji;

    return {
      text: {
        type: 'mrkdwn' as const,
        text: `${emoji} *${daoId}*`
      },
      value: daoId
    };
  });

  // Convert selected IDs set to array of initially selected options
  const initialOptions = Array.from(selectedIds).map(daoId => {
    const emoji = daoEmojis.get(daoId) || defaultDaoEmoji;
    return {
      text: {
        type: 'mrkdwn' as const,
        text: `${emoji} *${daoId}*`
      },
      value: daoId
    };
  });

  return [
    section(headerText),
    { type: 'divider' },
    {
      type: 'actions',
      block_id: 'dao_checkboxes_block',
      elements: [
        {
          type: 'checkboxes',
          action_id: actionPrefix,
          options: checkboxOptions,
          initial_options: initialOptions.length > 0 ? initialOptions : undefined
        }
      ]
    },
    { type: 'divider' },
    actions(button(slackMessages.dao.confirmButton, confirmActionId, { style: 'primary' }))
  ];
};

/**
 * Wallet empty state
 */
export const walletEmptyState = (): Block[] => [
  section(slackMessages.wallet.emptyList),
  actions(
    button(slackMessages.wallet.buttonAdd, 'wallet_add', { style: 'primary' }),
    button(slackMessages.wallet.buttonRemove, 'wallet_remove', { style: 'danger' })
  )
];

/**
 * DAO empty state
 */
export const daoEmptyState = (): Block[] => [
  section(slackMessages.dao.emptyList),
  actions(
    button(slackMessages.dao.buttonSubscribe, 'dao_subscribe', { style: 'primary' })
  )
];

/**
 * DAO list with edit button
 */
export const daoListWithEdit = (daoList: string): Block[] => [
  section(slackMessages.dao.listHeader + '\n' + daoList),
  { type: 'divider' },
  actions(
    button(slackMessages.dao.buttonEdit, 'dao_edit_subscriptions', { style: 'primary' })
  )
];