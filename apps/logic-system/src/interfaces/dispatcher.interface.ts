/**
 * Message payload to be sent to the Dispatcher service
 */
export interface DispatcherMessage {
  /** Identifier of the trigger that generated this message */
  triggerId: string;
  /** Data context to be sent to the Dispatcher */
  payload: any;
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