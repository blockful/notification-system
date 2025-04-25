/**
 * Message to be sent to the API
 */
export interface ApiMessage {
    /** Identifier of the trigger that generated this message */
    triggerId: string;
    /** JSON serialized context data */
    context: string;
}

/**
 * Result of an API call operation
 */
export interface ApiCallResult {
    /** Whether the API call was successful */
    success: boolean;
    /** Error message if API call failed */
    error?: string;
}

/**
 * Repository interface for API operations
 */
export interface ApiRepository {
    /**
     * Sends data to an API endpoint
     * @param message - The message to send
     * @returns Result of the API call operation
     */
    sendMessage(message: ApiMessage): Promise<ApiCallResult>;
} 