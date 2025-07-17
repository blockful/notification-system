
/**
 * Message payload to be sent to the Dispatcher service
 * @template T - Type of event data being sent
 */
export interface DispatcherMessage<T = any> {
  /** Identifier of the trigger that generated this message */
  triggerId: string;
  /** Event data to be sent to the Dispatcher */
  events: T[];
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
  sendMessage<T = any>(message: DispatcherMessage<T>): Promise<void>;
} 