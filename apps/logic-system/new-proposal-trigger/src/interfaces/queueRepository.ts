/**
 * Message to be published to the queue
 */
export interface Message {
    /** Identifier of the trigger that generated this message */
    trigger_id: string;
    /** JSON serialized context data */
    context: string;
}

/**
 * Result of a message publish operation
 */
export interface PublishResult {
    /** Whether the message was successfully published */
    success: boolean;
    /** Error message if publish failed */
    error?: string;
}

/**
 * Repository interface for queue operations
 */
export interface QueueRepository {
    /**
     * Publishes a single message to the queue
     * @param message - The message to publish
     * @returns Result of the publish operation
     */
    publishMessage(message: Message): Promise<PublishResult>;
}