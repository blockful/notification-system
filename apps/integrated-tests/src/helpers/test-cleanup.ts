import { DatabaseCleanup } from './database-cleanup';
import { db } from '../setup/database-config';
import { GraphQLMockSetup } from '../mocks/graphql-mock-setup';

/**
 * Central cleanup helper for beforeEach in tests
 * Handles all state that needs to be reset between tests
 */
export class TestCleanup {
  private static dbCleanup = new DatabaseCleanup(db);

  /**
   * Complete cleanup to be called in beforeEach
   * Clears all state that could interfere between tests
   */
  static async cleanupBetweenTests(): Promise<void> {
    // Clear Jest mocks (Telegram, etc)
    const { jest } = await import('@jest/globals');
    jest.clearAllMocks();
    
    // Reset HTTP/GraphQL mocks
    if (global.httpMockSetup) {
      global.httpMockSetup.reset();
      GraphQLMockSetup.setupEmptyMock(global.httpMockSetup.getMockClient());
    }
    
    // Clear RabbitMQ collected events
    if (global.testApps?.rabbitmqSetup) {
      global.testApps.rabbitmqSetup.clearCollectedEvents();
    }
    
    // Clean database tables
    await this.dbCleanup.cleanAllTables();
  }

  /**
   * Get access to global test infrastructure
   */
  static getGlobalApps() {
    if (!global.testApps) {
      throw new Error('Test apps not initialized. Make sure setupFilesAfterEnv ran correctly.');
    }
    return global.testApps;
  }

  static getGlobalHttpMockSetup() {
    if (!global.httpMockSetup) {
      throw new Error('HTTP mock setup not initialized. Make sure setupFilesAfterEnv ran correctly.');
    }
    return global.httpMockSetup;
  }
}