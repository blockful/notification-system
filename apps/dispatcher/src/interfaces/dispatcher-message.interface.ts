/**
 * Message payload to be sent to the Dispatcher service
 */
export interface DispatcherMessage {
  /** Identifier of the trigger that generated this message */
  triggerId: string;
  /** Proposal data to be processed */
  events: {
    id: string;
    daoId: string;
    description: string;
    timestamp: string;
  }[];
}

/**
 * Interface for message processing result
 */
export interface MessageProcessingResult {
  messageId: string;
  timestamp: string;
} 