import { createMockFunction } from './jest-mock-factory';
import { testConstants } from '../config';

/**
 * @notice Central mock for Telegram's sendMessage used across integration tests
 * @dev Provides consistent mocking behavior for Telegram API calls
 * When SEND_REAL_TELEGRAM is set, this will be replaced with a spy on the real bot
 */
export const mockSendMessage = createMockFunction();

// Initialize mock implementation when Jest is available and not using real Telegram
if (typeof jest !== 'undefined' && !process.env.SEND_REAL_TELEGRAM) {
  mockSendMessage.mockImplementation(() =>
    Promise.resolve({
      message_id: Math.floor(Math.random() * 1_000_000),
      chat: { id: parseInt(testConstants.defaults.channelUserId) },
      date: Math.floor(Date.now() / 1000),
      text: 'mocked message',
    })
  );
}

// Setup mocks only when Jest is available AND SEND_REAL_TELEGRAM is not set
if (typeof jest !== 'undefined' && !process.env.SEND_REAL_TELEGRAM) {
  // Mocked Telegraf instance with only the members we use in tests
  const mockTelegraf = jest
    .fn()
    .mockImplementation(() => ({
      telegram: { sendMessage: mockSendMessage },
      launch: jest.fn().mockImplementation(() => Promise.resolve()),
      stop: jest.fn().mockImplementation(() => Promise.resolve()),
      command: jest.fn(),
      action: jest.fn(),
      on: jest.fn(),
      use: jest.fn(),
      catch: jest.fn(),
      hears: jest.fn(),
    }));

  // Use doMock instead of mock to avoid hoisting - this allows conditional mocking
  jest.doMock('telegraf', () => ({
    Telegraf: mockTelegraf,
    Markup: {
      keyboard: jest.fn().mockReturnValue({
        resize: jest.fn().mockReturnValue({
          persistent: jest.fn().mockReturnValue({})
        })
      })
    }
  }));
  
  jest.doMock('telegraf/session', () => ({
    session: jest.fn().mockImplementation(() => jest.fn())
  }));

  jest.doMock('dotenv', () => ({
    config: jest.fn(),
    parse: jest.fn(),
  }));
}