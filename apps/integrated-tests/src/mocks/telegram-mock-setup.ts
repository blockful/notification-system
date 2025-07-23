import { jest } from '@jest/globals';

// Central mock for Telegram's sendMessage used across integration tests
export const mockSendMessage = jest
  .fn()
  .mockImplementation(() =>
    Promise.resolve({
      message_id: Math.floor(Math.random() * 1_000_000),
      chat: { id: 123456789 },
      date: Math.floor(Date.now() / 1000),
      text: 'mocked message',
    })
  ) as jest.Mock;

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
  })) as jest.Mock;

// Apply module mocks at top-level so they are hoisted before any import that relies on Telegraf
jest.mock('telegraf', () => ({
  Telegraf: mockTelegraf,
}));

jest.mock('dotenv', () => ({
  config: jest.fn(),
  parse: jest.fn(),
}));