/**
 * Flow Parser
 * Extracts the conversation flow from the codebase messages
 */

import { uiMessages, telegramMessages } from '@notification-system/messages';
import { Flow, FlowNode, FlowEdge, FlowMetadata } from './flow-types';

const COMMON_FILE = 'packages/messages/src/ui/common.ts';
const TELEGRAM_FILE = 'packages/messages/src/ui/telegram.ts';
const TRIGGERS_PATH = 'packages/messages/src/triggers';

// Import trigger messages
import { newProposalMessages } from '@notification-system/messages';
import { votingReminderMessages } from '@notification-system/messages';
import { proposalFinishedMessages } from '@notification-system/messages';
import { voteConfirmationMessages } from '@notification-system/messages';
import { delegationChangeMessages } from '@notification-system/messages';
import { votingPowerMessages } from '@notification-system/messages';
import { nonVotingMessages } from '@notification-system/messages';

/**
 * Parse the code and generate a Flow structure
 */
export function parseFlowFromCode(): Flow {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  // Layout configuration
  const cols = {
    start: 50,
    main: 450,
    secondary: 900,
    tertiary: 1350,
    quaternary: 1800,
    // Notification section (to the right)
    notifStart: 2400,
    notifMain: 2850,
    notifSecondary: 3300,
  };

  const rows = {
    top: 50,
    upper: 300,
    middle: 600,
    lower: 900,
    bottom: 1200,
    // Notification rows (below)
    notifHeader: 1500,
    notifProposal: 1800,
    notifVoting: 2200,
    notifDelegation: 2600,
    notifPower: 3000,
  };

  // ============ USER INTERACTION FLOW ============

  // 1. Start Node
  nodes.push({
    id: 'start',
    type: 'start',
    title: 'User Starts',
    content: 'User sends /start command',
    sourceKey: 'command:/start',
    sourceFile: 'apps/consumers/src/services/bot/telegram-bot.service.ts',
    position: { x: cols.start, y: rows.upper },
    command: '/start',
  });

  // 2. Welcome Message Node
  nodes.push({
    id: 'welcome',
    type: 'message',
    title: 'Welcome Message',
    content: uiMessages.welcome,
    sourceKey: 'uiMessages.welcome',
    sourceFile: COMMON_FILE,
    position: { x: cols.main, y: rows.upper },
    buttons: [
      { text: uiMessages.buttons.daos, targetNodeId: 'daos_init', sourceKey: 'uiMessages.buttons.daos' },
      { text: uiMessages.buttons.myWallets, targetNodeId: 'wallets_init', sourceKey: 'uiMessages.buttons.myWallets' },
      { text: uiMessages.buttons.learnMore, targetNodeId: 'learn_more', sourceKey: 'uiMessages.buttons.learnMore' },
    ],
  });

  edges.push({ id: 'e-start-welcome', source: 'start', target: 'welcome' });

  // 3. Learn More / Help Node
  nodes.push({
    id: 'learn_more',
    type: 'message',
    title: 'Learn More / Help',
    content: uiMessages.help,
    sourceKey: 'uiMessages.help',
    sourceFile: COMMON_FILE,
    position: { x: cols.main, y: rows.top },
    parseMode: 'HTML',
    command: '/learn_more',
  });

  edges.push({ id: 'e-welcome-learn', source: 'welcome', target: 'learn_more', label: uiMessages.buttons.learnMore, type: 'button' });

  // 4. Unknown Command Node
  nodes.push({
    id: 'unknown_command',
    type: 'message',
    title: 'Unknown Command',
    content: telegramMessages.bot.unknownCommand,
    sourceKey: 'telegramMessages.bot.unknownCommand',
    sourceFile: TELEGRAM_FILE,
    position: { x: cols.main, y: rows.middle },
  });

  // ============ DAO FLOW ============

  nodes.push({
    id: 'daos_init',
    type: 'message',
    title: 'DAO Selection',
    content: uiMessages.daoSelection,
    sourceKey: 'uiMessages.daoSelection',
    sourceFile: COMMON_FILE,
    position: { x: cols.secondary, y: rows.upper - 100 },
    command: '/daos',
    buttons: [
      { text: uiMessages.confirmSelection, targetNodeId: 'dao_confirm', sourceKey: 'uiMessages.confirmSelection', actionId: 'dao_confirm' },
    ],
  });

  edges.push({ id: 'e-welcome-daos', source: 'welcome', target: 'daos_init', label: uiMessages.buttons.daos, type: 'button' });

  nodes.push({
    id: 'dao_toggle',
    type: 'action',
    title: 'Toggle DAO Selection',
    content: 'User toggles a DAO checkbox. Selection is stored in session.',
    sourceKey: 'action:dao_toggle',
    sourceFile: 'apps/consumers/src/services/dao/telegram-dao.service.ts',
    position: { x: cols.secondary, y: rows.top },
  });

  edges.push({ id: 'e-daos-toggle', source: 'daos_init', target: 'dao_toggle', label: 'Toggle DAO', type: 'button' });
  edges.push({ id: 'e-toggle-daos', source: 'dao_toggle', target: 'daos_init', label: 'Update UI' });

  nodes.push({
    id: 'error_loading_daos',
    type: 'error',
    title: 'Error: Loading DAOs',
    content: uiMessages.errors.loadingDaos,
    sourceKey: 'uiMessages.errors.loadingDaos',
    sourceFile: COMMON_FILE,
    position: { x: cols.secondary + 400, y: rows.top },
  });

  nodes.push({
    id: 'dao_confirm',
    type: 'condition',
    title: 'DAOs Selected?',
    content: 'Check if user selected at least one DAO',
    sourceKey: 'condition:selectedDAOs.size > 0',
    sourceFile: 'apps/consumers/src/services/dao/telegram-dao.service.ts',
    position: { x: cols.tertiary, y: rows.upper - 100 },
  });

  edges.push({ id: 'e-daos-confirm', source: 'daos_init', target: 'dao_confirm', label: uiMessages.confirmSelection, type: 'button' });

  nodes.push({
    id: 'dao_success',
    type: 'message',
    title: 'DAO Selection Success',
    content: `${uiMessages.selectedDaos}\n\n{DAO_LIST}\n\n${uiMessages.editDaos}`,
    sourceKey: 'uiMessages.selectedDaos + uiMessages.editDaos',
    sourceFile: COMMON_FILE,
    position: { x: cols.quaternary, y: rows.upper - 200 },
  });

  edges.push({ id: 'e-confirm-success', source: 'dao_confirm', target: 'dao_success', label: 'Yes', type: 'success', sourceHandle: 'yes' });

  nodes.push({
    id: 'dao_unsubscribed',
    type: 'message',
    title: 'All DAOs Unsubscribed',
    content: telegramMessages.dao.allUnsubscribed,
    sourceKey: 'telegramMessages.dao.allUnsubscribed',
    sourceFile: TELEGRAM_FILE,
    position: { x: cols.quaternary, y: rows.upper + 50 },
  });

  edges.push({ id: 'e-confirm-unsub', source: 'dao_confirm', target: 'dao_unsubscribed', label: 'No', type: 'condition', sourceHandle: 'no' });

  // ============ WALLET FLOW ============

  nodes.push({
    id: 'wallets_init',
    type: 'message',
    title: 'Wallet Management',
    content: `${uiMessages.wallet.selection}\n\n{WALLET_LIST}`,
    sourceKey: 'uiMessages.wallet.selection',
    sourceFile: COMMON_FILE,
    position: { x: cols.secondary, y: rows.middle },
    command: '/wallets',
    buttons: [
      { text: uiMessages.buttons.addWallet, targetNodeId: 'wallet_add', sourceKey: 'uiMessages.buttons.addWallet', actionId: 'wallet_add' },
      { text: uiMessages.buttons.removeWallet, targetNodeId: 'wallet_remove', sourceKey: 'uiMessages.buttons.removeWallet', actionId: 'wallet_remove' },
    ],
  });

  edges.push({ id: 'e-welcome-wallets', source: 'welcome', target: 'wallets_init', label: uiMessages.buttons.myWallets, type: 'button' });

  nodes.push({
    id: 'wallets_empty',
    type: 'message',
    title: 'No Wallets Yet',
    content: uiMessages.wallet.noWallets,
    sourceKey: 'uiMessages.wallet.noWallets',
    sourceFile: COMMON_FILE,
    position: { x: cols.secondary, y: rows.lower },
    buttons: [
      { text: uiMessages.buttons.addWallet, targetNodeId: 'wallet_add', sourceKey: 'uiMessages.buttons.addWallet' },
    ],
  });

  nodes.push({
    id: 'wallet_add',
    type: 'input',
    title: 'Add Wallet Prompt',
    content: uiMessages.wallet.input,
    sourceKey: 'uiMessages.wallet.input',
    sourceFile: COMMON_FILE,
    position: { x: cols.tertiary, y: rows.middle - 100 },
    awaitInput: true,
  });

  edges.push({ id: 'e-wallets-add', source: 'wallets_init', target: 'wallet_add', label: uiMessages.buttons.addWallet, type: 'button' });
  edges.push({ id: 'e-empty-add', source: 'wallets_empty', target: 'wallet_add', label: uiMessages.buttons.addWallet, type: 'button' });

  nodes.push({
    id: 'wallet_processing',
    type: 'action',
    title: 'Processing Wallet',
    content: uiMessages.wallet.processing,
    sourceKey: 'uiMessages.wallet.processing',
    sourceFile: COMMON_FILE,
    position: { x: cols.quaternary, y: rows.middle - 200 },
  });

  edges.push({ id: 'e-add-processing', source: 'wallet_add', target: 'wallet_processing', label: 'User enters address' });

  nodes.push({
    id: 'wallet_add_success',
    type: 'message',
    title: 'Wallet Added Success',
    content: uiMessages.wallet.success,
    sourceKey: 'uiMessages.wallet.success',
    sourceFile: COMMON_FILE,
    position: { x: cols.quaternary + 400, y: rows.middle - 300 },
  });

  edges.push({ id: 'e-processing-success', source: 'wallet_processing', target: 'wallet_add_success', label: 'Valid', type: 'success' });

  nodes.push({
    id: 'wallet_add_error',
    type: 'error',
    title: 'Invalid Wallet Error',
    content: uiMessages.wallet.error,
    sourceKey: 'uiMessages.wallet.error',
    sourceFile: COMMON_FILE,
    position: { x: cols.quaternary + 400, y: rows.middle - 50 },
  });

  edges.push({ id: 'e-processing-error', source: 'wallet_processing', target: 'wallet_add_error', label: 'Invalid', type: 'error' });
  edges.push({ id: 'e-error-retry', source: 'wallet_add_error', target: 'wallet_add', label: 'Retry' });

  nodes.push({
    id: 'wallet_remove',
    type: 'message',
    title: 'Remove Wallet Selection',
    content: uiMessages.wallet.removeConfirmation,
    sourceKey: 'uiMessages.wallet.removeConfirmation',
    sourceFile: COMMON_FILE,
    position: { x: cols.tertiary, y: rows.middle + 200 },
    buttons: [
      { text: uiMessages.buttons.confirmRemoval, targetNodeId: 'wallet_remove_confirm', sourceKey: 'uiMessages.buttons.confirmRemoval', actionId: 'wallet_confirm_remove' },
    ],
  });

  edges.push({ id: 'e-wallets-remove', source: 'wallets_init', target: 'wallet_remove', label: uiMessages.buttons.removeWallet, type: 'button' });

  nodes.push({
    id: 'wallet_remove_success',
    type: 'message',
    title: 'Wallets Removed Success',
    content: uiMessages.wallet.removeSuccess,
    sourceKey: 'uiMessages.wallet.removeSuccess',
    sourceFile: COMMON_FILE,
    position: { x: cols.quaternary, y: rows.middle + 200 },
  });

  edges.push({ id: 'e-remove-success', source: 'wallet_remove', target: 'wallet_remove_success', label: uiMessages.buttons.confirmRemoval, type: 'success' });

  nodes.push({
    id: 'error_loading_wallets',
    type: 'error',
    title: 'Error: Loading Wallets',
    content: uiMessages.errors.loadingWallets,
    sourceKey: 'uiMessages.errors.loadingWallets',
    sourceFile: COMMON_FILE,
    position: { x: cols.secondary, y: rows.bottom },
  });

  nodes.push({
    id: 'error_generic',
    type: 'error',
    title: 'Generic Error',
    content: uiMessages.errors.generic,
    sourceKey: 'uiMessages.errors.generic',
    sourceFile: COMMON_FILE,
    position: { x: cols.tertiary, y: rows.bottom },
  });

  // ============ SYSTEM NOTIFICATIONS SECTION ============

  // Header/Trigger for notifications
  nodes.push({
    id: 'notif_trigger',
    type: 'start',
    title: 'System Notifications',
    content: 'Automated notifications triggered by blockchain events',
    sourceKey: 'system:notifications',
    sourceFile: 'apps/dispatcher/src/dispatcher.service.ts',
    position: { x: cols.notifStart, y: rows.notifHeader },
  });

  // ============ PROPOSAL NOTIFICATIONS ============

  // New Proposal
  nodes.push({
    id: 'notif_new_proposal',
    type: 'message',
    title: 'New Proposal',
    content: newProposalMessages.notification,
    sourceKey: 'newProposalMessages.notification',
    sourceFile: `${TRIGGERS_PATH}/new-proposal.ts`,
    position: { x: cols.notifMain, y: rows.notifProposal },
  });

  edges.push({ id: 'e-trigger-new-proposal', source: 'notif_trigger', target: 'notif_new_proposal', label: 'New Proposal Created', type: 'button' });

  // Voting Reminder - Urgent
  nodes.push({
    id: 'notif_vote_reminder_urgent',
    type: 'message',
    title: 'Voting Reminder (Urgent)',
    content: votingReminderMessages.urgent,
    sourceKey: 'votingReminderMessages.urgent',
    sourceFile: `${TRIGGERS_PATH}/voting-reminder.ts`,
    position: { x: cols.notifMain, y: rows.notifVoting },
  });

  edges.push({ id: 'e-trigger-vote-urgent', source: 'notif_trigger', target: 'notif_vote_reminder_urgent', label: '>80% time passed', type: 'button' });

  // Voting Reminder - Mid Period
  nodes.push({
    id: 'notif_vote_reminder_mid',
    type: 'message',
    title: 'Voting Reminder (Mid)',
    content: votingReminderMessages.midPeriod,
    sourceKey: 'votingReminderMessages.midPeriod',
    sourceFile: `${TRIGGERS_PATH}/voting-reminder.ts`,
    position: { x: cols.notifMain + 400, y: rows.notifVoting },
  });

  edges.push({ id: 'e-trigger-vote-mid', source: 'notif_trigger', target: 'notif_vote_reminder_mid', label: '>50% time passed', type: 'button' });

  // Voting Reminder - Early
  nodes.push({
    id: 'notif_vote_reminder_early',
    type: 'message',
    title: 'Voting Reminder (Early)',
    content: votingReminderMessages.early,
    sourceKey: 'votingReminderMessages.early',
    sourceFile: `${TRIGGERS_PATH}/voting-reminder.ts`,
    position: { x: cols.notifSecondary, y: rows.notifVoting },
  });

  edges.push({ id: 'e-trigger-vote-early', source: 'notif_trigger', target: 'notif_vote_reminder_early', label: '>30% time passed', type: 'button' });

  // Proposal Finished - Executed
  nodes.push({
    id: 'notif_proposal_executed',
    type: 'message',
    title: 'Proposal Executed',
    content: proposalFinishedMessages.withTitle.EXECUTED,
    sourceKey: 'proposalFinishedMessages.withTitle.EXECUTED',
    sourceFile: `${TRIGGERS_PATH}/proposal-finished.ts`,
    position: { x: cols.notifMain, y: rows.notifProposal + 250 },
  });

  edges.push({ id: 'e-trigger-executed', source: 'notif_new_proposal', target: 'notif_proposal_executed', label: 'Executed ✅', type: 'success' });

  // Proposal Finished - Defeated
  nodes.push({
    id: 'notif_proposal_defeated',
    type: 'message',
    title: 'Proposal Defeated',
    content: proposalFinishedMessages.withTitle.DEFEATED,
    sourceKey: 'proposalFinishedMessages.withTitle.DEFEATED',
    sourceFile: `${TRIGGERS_PATH}/proposal-finished.ts`,
    position: { x: cols.notifMain + 400, y: rows.notifProposal + 250 },
  });

  edges.push({ id: 'e-trigger-defeated', source: 'notif_new_proposal', target: 'notif_proposal_defeated', label: 'Defeated ❌', type: 'error' });

  // Proposal Finished - Expired
  nodes.push({
    id: 'notif_proposal_expired',
    type: 'message',
    title: 'Proposal Expired',
    content: proposalFinishedMessages.withTitle.EXPIRED,
    sourceKey: 'proposalFinishedMessages.withTitle.EXPIRED',
    sourceFile: `${TRIGGERS_PATH}/proposal-finished.ts`,
    position: { x: cols.notifSecondary, y: rows.notifProposal + 250 },
  });

  edges.push({ id: 'e-trigger-expired', source: 'notif_new_proposal', target: 'notif_proposal_expired', label: 'Expired ⏰', type: 'condition' });

  // ============ VOTE CONFIRMATION ============

  // Vote Confirmation - FOR
  nodes.push({
    id: 'notif_vote_for',
    type: 'message',
    title: 'Vote Confirmed (FOR)',
    content: voteConfirmationMessages.withReason.FOR,
    sourceKey: 'voteConfirmationMessages.withReason.FOR',
    sourceFile: `${TRIGGERS_PATH}/vote-confirmation.ts`,
    position: { x: cols.notifMain, y: rows.notifVoting + 300 },
  });

  edges.push({ id: 'e-vote-for', source: 'notif_vote_reminder_urgent', target: 'notif_vote_for', label: 'User votes FOR', type: 'success' });

  // Vote Confirmation - AGAINST
  nodes.push({
    id: 'notif_vote_against',
    type: 'message',
    title: 'Vote Confirmed (AGAINST)',
    content: voteConfirmationMessages.withReason.AGAINST,
    sourceKey: 'voteConfirmationMessages.withReason.AGAINST',
    sourceFile: `${TRIGGERS_PATH}/vote-confirmation.ts`,
    position: { x: cols.notifMain + 400, y: rows.notifVoting + 300 },
  });

  edges.push({ id: 'e-vote-against', source: 'notif_vote_reminder_urgent', target: 'notif_vote_against', label: 'User votes AGAINST', type: 'error' });

  // Vote Confirmation - ABSTAIN
  nodes.push({
    id: 'notif_vote_abstain',
    type: 'message',
    title: 'Vote Confirmed (ABSTAIN)',
    content: voteConfirmationMessages.withReason.ABSTAIN,
    sourceKey: 'voteConfirmationMessages.withReason.ABSTAIN',
    sourceFile: `${TRIGGERS_PATH}/vote-confirmation.ts`,
    position: { x: cols.notifSecondary, y: rows.notifVoting + 300 },
  });

  edges.push({ id: 'e-vote-abstain', source: 'notif_vote_reminder_urgent', target: 'notif_vote_abstain', label: 'User abstains', type: 'condition' });

  // ============ DELEGATION NOTIFICATIONS ============

  // Delegation Confirmed
  nodes.push({
    id: 'notif_delegation_confirmed',
    type: 'message',
    title: 'Delegation Confirmed',
    content: delegationChangeMessages.confirmed,
    sourceKey: 'delegationChangeMessages.confirmed',
    sourceFile: `${TRIGGERS_PATH}/delegation-change.ts`,
    position: { x: cols.notifMain, y: rows.notifDelegation },
  });

  edges.push({ id: 'e-trigger-delegation', source: 'notif_trigger', target: 'notif_delegation_confirmed', label: 'Delegation Changed', type: 'button' });

  // Self Delegation
  nodes.push({
    id: 'notif_self_delegation',
    type: 'message',
    title: 'Self-Delegation',
    content: delegationChangeMessages.selfDelegation,
    sourceKey: 'delegationChangeMessages.selfDelegation',
    sourceFile: `${TRIGGERS_PATH}/delegation-change.ts`,
    position: { x: cols.notifMain + 400, y: rows.notifDelegation },
  });

  edges.push({ id: 'e-self-delegation', source: 'notif_delegation_confirmed', target: 'notif_self_delegation', label: 'Self-delegate', type: 'button' });

  // Received Delegation
  nodes.push({
    id: 'notif_received_delegation',
    type: 'message',
    title: 'Delegation Received',
    content: delegationChangeMessages.receivedDelegation,
    sourceKey: 'delegationChangeMessages.receivedDelegation',
    sourceFile: `${TRIGGERS_PATH}/delegation-change.ts`,
    position: { x: cols.notifSecondary, y: rows.notifDelegation },
  });

  edges.push({ id: 'e-received-delegation', source: 'notif_delegation_confirmed', target: 'notif_received_delegation', label: 'Received', type: 'success' });

  // Lost Delegation
  nodes.push({
    id: 'notif_lost_delegation',
    type: 'message',
    title: 'Delegation Removed',
    content: delegationChangeMessages.lostDelegation,
    sourceKey: 'delegationChangeMessages.lostDelegation',
    sourceFile: `${TRIGGERS_PATH}/delegation-change.ts`,
    position: { x: cols.notifSecondary + 400, y: rows.notifDelegation },
  });

  edges.push({ id: 'e-lost-delegation', source: 'notif_delegation_confirmed', target: 'notif_lost_delegation', label: 'Lost', type: 'error' });

  // ============ VOTING POWER NOTIFICATIONS ============

  // Voting Power Increased
  nodes.push({
    id: 'notif_power_increased',
    type: 'message',
    title: 'Voting Power Increased',
    content: votingPowerMessages.generic.increased,
    sourceKey: 'votingPowerMessages.generic.increased',
    sourceFile: `${TRIGGERS_PATH}/voting-power.ts`,
    position: { x: cols.notifMain, y: rows.notifPower },
  });

  edges.push({ id: 'e-trigger-power-up', source: 'notif_trigger', target: 'notif_power_increased', label: 'Power Increased', type: 'success' });

  // Voting Power Decreased
  nodes.push({
    id: 'notif_power_decreased',
    type: 'message',
    title: 'Voting Power Decreased',
    content: votingPowerMessages.generic.decreased,
    sourceKey: 'votingPowerMessages.generic.decreased',
    sourceFile: `${TRIGGERS_PATH}/voting-power.ts`,
    position: { x: cols.notifMain + 400, y: rows.notifPower },
  });

  edges.push({ id: 'e-trigger-power-down', source: 'notif_trigger', target: 'notif_power_decreased', label: 'Power Decreased', type: 'error' });

  // Non-Voting Alert
  nodes.push({
    id: 'notif_non_voting',
    type: 'message',
    title: 'Non-Voting Alert',
    content: nonVotingMessages.alert,
    sourceKey: 'nonVotingMessages.alert',
    sourceFile: `${TRIGGERS_PATH}/non-voting.ts`,
    position: { x: cols.notifSecondary, y: rows.notifPower },
  });

  edges.push({ id: 'e-trigger-non-voting', source: 'notif_trigger', target: 'notif_non_voting', label: 'Address not voting', type: 'condition' });

  // Build metadata
  const contentHash = JSON.stringify({ nodes: nodes.map(n => n.id), edges: edges.map(e => e.id) });
  const metadata: FlowMetadata = {
    platform: 'telegram',
    version: '1.0.0',
    generatedAt: `static-${contentHash.length}`,
    commands: [
      { command: '/start', description: 'Initialize bot and show welcome message' },
      { command: '/daos', description: 'Manage DAO notification preferences' },
      { command: '/wallets', description: 'Manage tracked wallet addresses' },
      { command: '/learn_more', description: 'Learn about Anticapture platform' },
    ],
    persistentKeyboard: [
      [uiMessages.buttons.daos, uiMessages.buttons.myWallets],
      [uiMessages.buttons.learnMore],
    ],
  };

  return { nodes, edges, metadata };
}

/**
 * Get all message sources for reference
 */
export function getAllMessageSources(): { key: string; value: string; file: string }[] {
  const sources: { key: string; value: string; file: string }[] = [];

  const extractMessages = (obj: Record<string, unknown>, prefix: string, file: string) => {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string') {
        sources.push({ key: fullKey, value, file });
      } else if (typeof value === 'object' && value !== null) {
        extractMessages(value as Record<string, unknown>, fullKey, file);
      }
    }
  };

  extractMessages(uiMessages as unknown as Record<string, unknown>, 'uiMessages', COMMON_FILE);
  extractMessages(telegramMessages as unknown as Record<string, unknown>, 'telegramMessages', TELEGRAM_FILE);

  return sources;
}
