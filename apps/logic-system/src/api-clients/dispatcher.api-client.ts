import { DispatcherService, DispatcherMessage } from '../interfaces/dispatcher.interface';
import { AxiosInstance } from 'axios';

/**
 * Client for the Dispatcher API that handles sending notification messages
 * via HTTP/REST requests
 */
export class DispatcherApiClient implements DispatcherService {
  private readonly httpClient: AxiosInstance;

  constructor(httpClient: AxiosInstance) {
    this.httpClient = httpClient;
  }

  /**
   * Sends a message to the Dispatcher API using HTTP POST
   * @param message - Message to be dispatched
   */
  async sendMessage(message: DispatcherMessage) {
    const response = await this.httpClient.post('', message);
    return response.data;
  }
} 