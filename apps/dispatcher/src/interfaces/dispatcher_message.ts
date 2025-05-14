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
 * Interface for message processing result
 */
export interface MessageProcessingResult {
  messageId: string;
  timestamp: string;
}