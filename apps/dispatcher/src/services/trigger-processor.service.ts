import { DispatcherMessage, MessageProcessingResult } from "../interfaces/dispatcher-message.interface";
import { TriggerHandler } from "../interfaces/base-trigger.interface";

/**
 * Service responsible for processing messages for specific triggers
 * Supports multiple handlers per trigger ID for parallel processing
 */
export class TriggerProcessorService {
  private triggerHandlers: Map<string, TriggerHandler<any>[]>;
  
  constructor() {
    this.triggerHandlers = new Map();
  }

  /**
   * Adds a trigger handler to the service
   * @param triggerId Unique identifier for the trigger
   * @param handler The trigger handler implementation
   */
  addHandler<T = any>(triggerId: string, handler: TriggerHandler<T>): void {
    const handlers = this.triggerHandlers.get(triggerId) ?? [];
    handlers.push(handler);
    this.triggerHandlers.set(triggerId, handlers);
  }

  /**
   * Process a message for a specific trigger
   * Executes all registered handlers for the trigger in parallel
   * Failed handlers are logged but don't prevent successful ones from running
   * @param message The message to process
   * @returns Aggregated processing result from all successful handlers
   * @throws Error if no handlers registered for the trigger or all handlers fail
   */
  async processTrigger<T = any>(message: DispatcherMessage<T>): Promise<MessageProcessingResult> {
    const handlers = this.triggerHandlers.get(message.triggerId);
    
    // If no handlers found, return early
    if (!handlers || handlers.length === 0) {
      console.log(`No handler registered for trigger: ${message.triggerId}`);
      return {
        messageId: `unhandled-${message.triggerId}-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    }

    // Execute all handlers in parallel
    const results = await Promise.allSettled(
      handlers.map(async (handler) => {
        return await handler.handleMessage(message);
      })
    );

    // Log any handler failures but continue processing
    const failedResults = results.filter(result => result.status === 'rejected');
    if (failedResults.length > 0) {
      const errors = failedResults
        .map((result) => (result as PromiseRejectedResult).reason);
      console.error(`${failedResults.length} handler(s) failed for trigger ${message.triggerId}. Errors:`, errors.map(e => e.message).join(', '));
    }

    const successfulResults = results
      .filter((result): result is PromiseFulfilledResult<MessageProcessingResult> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    // If all handlers failed, throw error
    if (successfulResults.length === 0) {
      throw new Error(`All handlers failed for trigger ${message.triggerId}`);
    }

    // Simple aggregation: combine message IDs and use latest timestamp
    return {
      messageId: successfulResults.map(r => r.messageId).join('+'),
      timestamp: successfulResults.reduce((latest, current) => 
        current.timestamp > latest ? current.timestamp : latest, 
        successfulResults[0].timestamp
      )
    };
  }
} 