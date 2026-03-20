/**
 * Interface for OpenClaw client operations
 * Abstracts the OpenClaw webhook/API to allow for testing and different implementations
 */

export interface OpenClawClientInterface {
  /**
   * Send a message to the OpenClaw agent
   * @param message The message text
   * @param metadata Optional metadata to include
   * @returns Response identifier
   */
  sendMessage(message: string, metadata?: Record<string, any>): Promise<string>;

  /**
   * Check if the client is connected and ready
   * @returns true if client is operational
   */
  isReady(): boolean;
}
