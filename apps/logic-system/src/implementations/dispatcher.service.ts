import axios from 'axios';
import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';

/**
 * Implementation of the DispatcherService that uses HTTP/REST
 * to communicate with the external Dispatcher service
 */
export class DispatcherServiceImpl implements DispatcherService {
  private readonly url: string;

  constructor(endpoint: string) {
    this.url = endpoint;
  }

  /**
   * Sends a message to the Dispatcher service using HTTP POST
   * @param message - Message to be dispatched
   */
  async sendMessage(message: DispatcherMessage) {
    await axios.post(this.url, message, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
} 