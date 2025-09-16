/**
 * Slack Mock Setup
 * Central mock for Slack's sendMessage used across integration tests
 * Provides consistent mocking behavior for Slack API calls
 */

import { createMockFunction } from './jest-mock-factory';

/**
 * Central mock for Slack's sendMessage used across integration tests
 * This mock is used when SlackTestClient is in mock mode
 */
export const mockSlackSendMessage = createMockFunction();

// Initialize mock implementation when Jest is available
if (typeof jest !== 'undefined') {
  mockSlackSendMessage.mockImplementation(() =>
    Promise.resolve({
      ts: `${Date.now()}.000000`,
      channel: 'C1234567890',
      message: {
        text: 'mocked slack message',
        type: 'message',
        user: 'U1234567890'
      }
    })
  );
}