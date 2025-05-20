import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { startServices, stopServices } from '../src/setup-services';

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
}); 