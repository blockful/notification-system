import { jest } from '@jest/globals';

const mockSendMessage = jest.fn().mockImplementation(() => 
  Promise.resolve({
    message_id: Math.floor(Math.random() * 1000000),
    chat: { id: 123456789 },
    date: Math.floor(Date.now() / 1000),
    text: 'mocked message'
  })
);

const mockTelegraf = jest.fn().mockImplementation(() => ({
  telegram: {
    sendMessage: mockSendMessage
  },
  launch: jest.fn().mockImplementation(() => Promise.resolve()),
  stop: jest.fn().mockImplementation(() => Promise.resolve()),
  command: jest.fn().mockImplementation(() => undefined),
  action: jest.fn().mockImplementation(() => undefined),
  on: jest.fn().mockImplementation(() => undefined),
  use: jest.fn().mockImplementation(() => undefined),
  catch: jest.fn().mockImplementation(() => undefined),
  hears: jest.fn().mockImplementation(() => undefined)
}));

export function setupTelegramMock(): any {
  jest.mock('telegraf', () => ({
    Telegraf: mockTelegraf
  }));

  jest.mock('dotenv', () => ({
    config: jest.fn(),
    parse: jest.fn()
  }));

  return mockSendMessage;
}