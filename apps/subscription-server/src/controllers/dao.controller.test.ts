import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import fastify, { FastifyInstance } from 'fastify';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import { daoHandlers } from './dao.controller';
import axios from 'axios';
import { AddressInfo } from 'net';
import { User, UserPreference, KnexMock } from '../interfaces';

// ---- MOCKS ----
const mockUser: User = {
  id: '123',
  channel: 'telegram',
  channel_user_id: 'user123',
  is_active: true
};

const mockPreference: UserPreference = {
  id: '456',
  user_id: '123',
  dao_id: 'ens',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date()
};

const mockSubscribers = [
  {
    id: '456',
    user_id: '123',
    dao_id: 'ens',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    channel: 'telegram',
    channel_user_id: 'user123'
  },
  {
    id: '789',
    user_id: '456',
    dao_id: 'ens',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    channel: 'discord',
    channel_user_id: 'discord_user_456'
  }
];

type SubscriberResult = UserPreference & User;

const knexMock: KnexMock = {
  where: jest.fn().mockReturnThis(),
  first: jest.fn<() => Promise<User>>().mockResolvedValue(mockUser),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  returning: jest.fn<() => Promise<UserPreference[]>>().mockResolvedValue([mockPreference]),
  join: jest.fn().mockReturnThis(),
  select: jest.fn<() => Promise<SubscriberResult[]>>().mockResolvedValue(mockSubscribers as SubscriberResult[])
};

jest.mock('knex', () => {
  return () => () => knexMock;
});

// ---- HELPERS ----
let app: FastifyInstance;
let serverAddress: string;

async function setupServer(){
    app = fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    app.register(fastifyCors, { origin: '*' });
    await app.register(daoHandlers);
    await app.listen({ port: 0 }); // random port
    const address = app.server.address() as AddressInfo;
    serverAddress = `http://localhost:${address.port}`;
}

// ---- TESTS ----
describe('DAO handlers', () => {
  beforeAll(async () => {
    await setupServer();
    axios.defaults.validateStatus = () => true;
  });
  
  afterAll(async () => {
    await app.close();
  });

  // Tests for POST /subscription/:dao endpoint
  describe('POST /subscription/:dao', () => {
    test('should reject invalid requests (schema validation)', async () => {
      const invalidInput = {
        channel: "telegram"
        // Missing channel_user_id
      };
      const res = await axios.post(`${serverAddress}/subscription/ens`, invalidInput);
      expect(res.status).toBe(400);
    });

    test('should handle valid subscription request', async () => {
      const validInput = {
        channel: "telegram",
        channel_user_id: "user123",
        is_active: true
      };
      const res = await axios.post(`${serverAddress}/subscription/ens`, validInput);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('success', true);
      expect(res.data).toHaveProperty('message');
      expect(res.data).toHaveProperty('data');
      expect(res.data.data).toHaveProperty('user_id');
      expect(res.data.data).toHaveProperty('dao_id', 'ens');
      expect(res.data.data).toHaveProperty('is_active', true);
    });
  });

  // Tests for GET /subscriptions/:dao endpoint
  describe('GET /subscriptions/:dao', () => {
    test('should retrieve subscribers for a DAO', async () => {
      const res = await axios.get(`${serverAddress}/subscriptions/ens`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('success', true);
      expect(res.data).toHaveProperty('message');
      expect(res.data).toHaveProperty('data');
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBe(2);
      
      // Validate the structure of returned data
      const firstSubscriber = res.data.data[0];
      expect(firstSubscriber).toHaveProperty('id');
      expect(firstSubscriber).toHaveProperty('user_id');
      expect(firstSubscriber).toHaveProperty('channel');
      expect(firstSubscriber).toHaveProperty('channel_user_id');
      expect(firstSubscriber).toHaveProperty('is_active');
    });

    test('should handle case when no subscribers exist', async () => {
      // Mock an empty array response for this test
      knexMock.select.mockResolvedValueOnce([]);
      
      const res = await axios.get(`${serverAddress}/subscriptions/unknown-dao`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('success', true);
      expect(res.data).toHaveProperty('message');
      expect(res.data.data).toEqual([]);
    });
  });
});