/**
 * Message to be published to the queue
 */
export interface Message {
    /** Identifier of the trigger that generated this message */
    triggerId: string;
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
 * Service interface for queue operations
 */
export interface Queue {
    /**
     * Publishes a single message to the queue
     * @param message - The message to publish
     * @returns Result of the publish operation
     */
    publishMessage(message: Message): Promise<PublishResult>;
} 