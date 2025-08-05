import { DispatcherMessage, MessageProcessingResult } from "../interfaces/dispatcher-message.interface";
import { TriggerHandler } from "../interfaces/base-trigger.interface";

/**
 * Service responsible for processing messages for specific triggers
 */
export class TriggerProcessorService {
  private triggerHandlers: Map<string, TriggerHandler<any>>;
  
  constructor() {
    this.triggerHandlers = new Map();
  }

  /**
   * Adds a trigger handler to the service
   * @param triggerId Unique identifier for the trigger
   * @param handler The trigger handler implementation
   */
  addHandler<T = any>(triggerId: string, handler: TriggerHandler<T>): void {
    this.triggerHandlers.set(triggerId, handler);
  }

  /**
   * Process a message for a specific trigger
   * @param message The message to process
   * @returns Processing result
   * @throws Error if trigger handler not found
   */
  async processTrigger<T = any>(message: DispatcherMessage<T>): Promise<MessageProcessingResult> {
    const handler = this.triggerHandlers.get(message.triggerId);
    if (!handler) {
      throw new Error(`No handler registered for trigger: ${message.triggerId}`);
    }
    return await handler.handleMessage(message);
  }
} 