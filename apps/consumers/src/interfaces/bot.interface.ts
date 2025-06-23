/**
 * ContextWithSession interface provides proper typing for the bot context with session.
 */

import { Context } from 'telegraf';
  
export interface ContextWithSession extends Context {
    session: {
        daoSelections?: Set<string>;
    };
}