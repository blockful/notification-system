/**
 * Flow Parser
 * Extracts the conversation flow from the codebase messages
 */

import { uiMessages, telegramMessages } from '@notification-system/messages';
import { Flow, FlowNode, FlowEdge, FlowMetadata } from './flow-types';

const COMMON_FILE = 'packages/messages/src/ui/common.ts';
const TELEGRAM_FILE = 'packages/messages/src/ui/telegram.ts';

/**
 * Parse the code and generate a Flow structure
 */
export function parseFlowFromCode(): Flow {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  // Better layout with more spacing
  // Column positions - increased spacing for node widths (320px max)
  const cols = {
    start: 50,
    main: 450,        // Welcome, Learn More, Unknown Command
    secondary: 900,   // DAO Selection, Wallet Management
    tertiary: 1350,   // Conditions, Inputs
    quaternary: 1800, // Results, Success/Error states
  };

  // Row positions - increased spacing for node heights
  const rows = {
    top: 50,
    upper: 300,
    middle: 600,
    lower: 900,
    bottom: 1200,
  };

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

  // ============ DAO FLOW (top section) ============

  // 5. DAO Selection Node
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

  // 6. DAO Toggle Action Node
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

  // 7. Error: Loading DAOs
  nodes.push({
    id: 'error_loading_daos',
    type: 'error',
    title: 'Error: Loading DAOs',
    content: uiMessages.errors.loadingDaos,
    sourceKey: 'uiMessages.errors.loadingDaos',
    sourceFile: COMMON_FILE,
    position: { x: cols.secondary + 400, y: rows.top },
  });

  // 8. DAO Confirmation Condition
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

  // 9. DAO Success Node
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

  // 10. DAO Unsubscribed Node
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

  // ============ WALLET FLOW (bottom section) ============

  // 11. Wallet Management Node
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

  // 12. No Wallets State
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

  // 13. Add Wallet Input Node
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

  // 14. Wallet Processing Node
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

  // 15. Wallet Add Success Node
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

  // 16. Wallet Add Error Node
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

  // 17. Remove Wallet Selection Node
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

  // 18. Wallet Remove Success Node
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

  // 19. Error: Loading Wallets
  nodes.push({
    id: 'error_loading_wallets',
    type: 'error',
    title: 'Error: Loading Wallets',
    content: uiMessages.errors.loadingWallets,
    sourceKey: 'uiMessages.errors.loadingWallets',
    sourceFile: COMMON_FILE,
    position: { x: cols.secondary, y: rows.bottom },
  });

  // 20. Generic Error
  nodes.push({
    id: 'error_generic',
    type: 'error',
    title: 'Generic Error',
    content: uiMessages.errors.generic,
    sourceKey: 'uiMessages.errors.generic',
    sourceFile: COMMON_FILE,
    position: { x: cols.tertiary, y: rows.bottom },
  });

  // Build metadata - use a fixed timestamp based on content hash to prevent unnecessary re-renders
  const contentHash = JSON.stringify({ nodes: nodes.map(n => n.id), edges: edges.map(e => e.id) });
  const metadata: FlowMetadata = {
    platform: 'telegram',
    version: '1.0.0',
    generatedAt: `static-${contentHash.length}`, // Static identifier based on flow structure
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

  // Extract from uiMessages
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
