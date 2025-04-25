/**
 * Message to be sent to the subscription checker service
 */
export interface EventContextMessage {
    /** Identifier of the trigger that generated this message */
    triggerId: string;
    /** JSON serialized context data */
    context: string;
}

/**
 * Result of a subscription checking operation
 */
export interface SubscriptionCheckResult {
    /** Whether the subscription check was successful */
    success: boolean;
    /** Error message if check failed */
    error?: string;
}

/**
 * Service responsible for checking which subscribers should 
 * receive notifications for a given event
 * 
 * This service determines which subscribers are eligible to
 * receive notifications based on subscription rules, preferences,
 * and the event context.
 */
export interface SubscriptionCheckerService {
    /**
     * Checks which subscribers should receive a notification for a given event
     * @param message - The event context message
     * @returns Result of the subscription check operation
     */
    checkSubscribers(message: EventContextMessage): Promise<SubscriptionCheckResult>;
} 