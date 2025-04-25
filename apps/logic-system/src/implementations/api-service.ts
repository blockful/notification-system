import axios from 'axios';
import { ApiService, ApiMessage, ApiCallResult } from '../interfaces/repositories/api-service.interface';

export class HttpApiService implements ApiService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async sendMessage(message: ApiMessage): Promise<ApiCallResult> {
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