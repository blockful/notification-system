import { DispatcherMessage, MessageProcessingResult } from "./dispatcher-message.interface";

/**
 * Interface for trigger handlers
 */
export interface TriggerHandler {
  /**
   * Handle a message from a specific trigger
   * @param message The message to process
   * @returns Processing result
   */
  handleMessage(message: DispatcherMessage): Promise<MessageProcessingResult>;
} 