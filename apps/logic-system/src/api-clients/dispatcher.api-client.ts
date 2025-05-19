import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';

/**
 * Client for the Dispatcher API that handles sending notification messages
 * via HTTP/REST requests
 */
export class DispatcherApiClient implements DispatcherService {
  private readonly url: string;

  constructor(endpoint: string) {
    this.url = endpoint;
  }

  /**
   * Sends a message to the Dispatcher API using HTTP POST
   * @param message - Message to be dispatched
   */
  async sendMessage(message: DispatcherMessage) {
    await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });
  }
} 