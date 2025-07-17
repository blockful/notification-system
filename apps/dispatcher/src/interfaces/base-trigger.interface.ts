import { DispatcherMessage, MessageProcessingResult } from "./dispatcher-message.interface";

/**
 * Interface for trigger handlers
 * @template T - Type of event data being processed
 */
export interface TriggerHandler<T = any> {
  /**
   * Handle a message from a specific trigger
   * @param message The message to process
   * @returns Processing result
   */
  handleMessage(message: DispatcherMessage<T>): Promise<MessageProcessingResult>;
} 