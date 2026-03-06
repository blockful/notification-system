/**
 * ContextWithSession interface provides proper typing for the bot context with session.
 */

import { Context } from 'telegraf';
  
export interface ContextWithSession extends Context {
    session: {
        daoSelections: Set<string>;
        walletAction?: 'add' | 'remove';
        walletsToRemove?: Set<string>;
        awaitingWalletInput?: boolean;
        fromStart?: boolean;
    };
}

/**
 * Context with regex match for action handlers
 */
export type MatchedContext = ContextWithSession & {
    match: RegExpExecArray;
};
