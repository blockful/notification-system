/**
 * Message payload to be sent to the Dispatcher service
 * @template T - Type of event data being processed
 */
export interface DispatcherMessage<T = any> {
  /** Identifier of the trigger that generated this message */
  triggerId: string;
  /** Event data to be processed */
  events: T[];
}

/**
 * Interface for message processing result
 */
export interface MessageProcessingResult {
  messageId: string;
  timestamp: string;
} 