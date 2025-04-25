import axios from 'axios';
import { SubscriptionCheckerService, EventContextMessage, SubscriptionCheckResult } from '../interfaces/services/subscription-checker.interface';

export class HttpSubscriptionChecker implements SubscriptionCheckerService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async checkSubscribers(message: EventContextMessage): Promise<SubscriptionCheckResult> {
    try {
      const response = await axios.post(this.apiUrl, message);
      
      return {
        success: response.status >= 200 && response.status < 300,
        error: response.status >= 300 ? `HTTP error ${response.status}` : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
} 