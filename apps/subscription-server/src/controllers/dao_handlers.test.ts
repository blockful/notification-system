import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import fastify, { FastifyInstance } from 'fastify';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import fastifyCors from '@fastify/cors';
import { dao_handlers } from './dao_handlers';
import axios from 'axios';
import { AddressInfo } from 'net';
import { User, Preference, KnexMock } from '../interfaces/index';

const mockUser: User = {
  id: '123',
  channel: 'telegram',
  channel_user_id: 'user123',
  is_active: true
};

const mockPreference: Preference = {
  id: '456',
  user_id: '123',
  dao_id: 'ens',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date()
};

const knexMock: KnexMock = {
  where: jest.fn().mockReturnThis(),
  first: jest.fn<() => Promise<User>>().mockResolvedValue(mockUser),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  returning: jest.fn<() => Promise<Preference[]>>().mockResolvedValue([mockPreference]),
};

jest.mock('knex', () => {
  return () => () => knexMock;
});

let app: FastifyInstance;
let serverAddress: string;

describe('DAO handlers', () => {
  beforeAll(async () => {
    await setupServer();
    axios.defaults.validateStatus = () => true;
  });
  
  afterAll(async () => {
    await app.close();
  });

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


async function setupServer(){
    app = fastify();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    app.register(fastifyCors, { origin: '*' });
    await app.register(dao_handlers);
    await app.listen({ port: 0 }); // random port
    const address = app.server.address() as AddressInfo;
    serverAddress = `http://localhost:${address.port}`;
}