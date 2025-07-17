import { ProposalOnChain } from './proposal.interface';

/**
 * Message payload to be sent to the Dispatcher service
 */
export interface DispatcherMessage {
  /** Identifier of the trigger that generated this message */
  triggerId: string;
  /** Event data to be sent to the Dispatcher */
  events: ProposalOnChain[];
}

/**
 * Service responsible for sending notification messages to the Dispatcher service
 * via REST API calls.
 */
export interface DispatcherService {
  /**
   * Sends a message to the Dispatcher service
   * @param message - The message to be dispatched
   */
  sendMessage(message: DispatcherMessage): Promise<void>;
} 