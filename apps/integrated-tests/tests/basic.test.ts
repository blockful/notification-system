import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { startServices, stopServices } from '../src/services-setup';
import { db } from '../src/pg-setup';

describe('Basic integration tests', () => {
  beforeAll(async () => {
    console.log('🚀 Starting all services for integration tests...');
    await startServices();
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('✅ All services started successfully');
  });

  afterAll(async () => {
    console.log('🧹 Shutting down all services...');
    stopServices();
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ All services were shut down successfully');
  });

  test('should start all services correctly', () => {
    expect(true).toBe(true);
  });

  test('should connect to PostgreSQL database successfully', async () => {
    const proposals = await db('proposals_onchain').select('*');
    expect(proposals.length).toBeGreaterThan(0);
    const users = await db('users').select('*');
    expect(users.length).toBeGreaterThan(0);
    const preferences = await db('user_preferences').select('*');
    expect(preferences.length).toBeGreaterThan(0);
  });
}); 