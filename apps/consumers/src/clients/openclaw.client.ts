/**
 * OpenClaw Client Implementation
 * Sends notifications to an OpenClaw agent via webhook HTTP POST.
 *
 * The webhook endpoint receives JSON payloads and forwards them
 * to the configured OpenClaw agent session (e.g., CRA for governance analysis).
 */

import axios, { AxiosInstance } from 'axios';
import { OpenClawClientInterface } from '../interfaces/openclaw-client.interface';

export class OpenClawClient implements OpenClawClientInterface {
  private httpClient: AxiosInstance;
  private ready: boolean = false;

  /**
   * @param webhookUrl The OpenClaw webhook endpoint URL
   * @param apiKey Optional API key for authentication
   */
  constructor(
    private readonly webhookUrl: string,
    private readonly apiKey?: string
  ) {
    this.httpClient = axios.create({
      baseURL: this.webhookUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      },
      timeout: 30000,
    });
    this.ready = true;
  }

  async sendMessage(
    message: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    const payload = {
      message,
      timestamp: new Date().toISOString(),
      ...(metadata && { metadata }),
    };

    try {
      const response = await this.httpClient.post('', payload);
      const responseId =
        response.data?.id || response.data?.messageId || `openclaw-${Date.now()}`;
      console.log(`[OpenClaw] Message sent successfully: ${responseId}`);
      return responseId;
    } catch (error: any) {
      const status = error.response?.status || 'unknown';
      const detail = error.response?.data?.message || error.message;
      console.error(
        `[OpenClaw] Failed to send message (status=${status}): ${detail}`
      );
      throw new Error(`OpenClaw webhook failed: ${detail}`);
    }
  }

  isReady(): boolean {
    return this.ready;
  }
}
