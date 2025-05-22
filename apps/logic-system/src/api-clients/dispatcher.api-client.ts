import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';
import axios from 'axios';

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
    const response = await axios.post(this.url, message, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000 // 5 second timeout
    });
    return response.data;
  }
} 