import { createMockFunction } from './jest-mock-factory';
import { testConstants } from '../config';

/**
 * @notice Central mock for Telegram's sendMessage used across integration tests
 * @dev Provides consistent mocking behavior for Telegram API calls
 * This is now only used as a fallback when TestTelegramClient is not available
 */
export const mockTelegramSendMessage = createMockFunction();

// Initialize mock implementation when Jest is available
if (typeof jest !== 'undefined') {
  mockTelegramSendMessage.mockImplementation(() =>
    Promise.resolve({
      message_id: Math.floor(Math.random() * 1_000_000),
      chat: { id: parseInt(testConstants.defaults.channelUserId) },
      date: Math.floor(Date.now() / 1000),
      text: 'mocked message',
    })
  );
}

// Mock dotenv since it's used in various places
if (typeof jest !== 'undefined') {
  jest.doMock('dotenv', () => ({
    config: jest.fn(),
    parse: jest.fn(),
  }));
}