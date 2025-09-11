import { DatabaseCleanup } from '../database/database-cleanup';
import { db } from '../../setup/database/database-config';
import { GraphQLMockSetup } from '../../mocks/graphql-mock-setup';

/**
 * @notice Central cleanup helper for beforeEach in tests
 * @dev Handles all state that needs to be reset between tests
 */
export class TestCleanup {
  private static dbCleanup = new DatabaseCleanup(db);

  /**
   * @notice Complete cleanup to be called in beforeEach
   * @dev Clears all state that could interfere between tests
   * @return Promise that resolves when all cleanup is complete
   */
  static async cleanupBetweenTests(): Promise<void> {
    // Clear Jest mocks (Telegram, etc)
    const { jest } = await import('@jest/globals');
    jest.clearAllMocks();
    
    // Reset HTTP/GraphQL mocks
    if (global.httpMockSetup) {
      global.httpMockSetup.reset();
      GraphQLMockSetup.setupMock(global.httpMockSetup.getMockClient());
    }
    
    // Clear RabbitMQ collected events and purge all queues
    if (global.testApps?.rabbitmqSetup) {
      global.testApps.rabbitmqSetup.clearCollectedEvents();
      // Purge all queues to prevent event leakage between tests
      await global.testApps.rabbitmqSetup.purgeAllQueues();
    }
    
    // Reset trigger timestamps to initial state (1 year ago)
    // This ensures each test starts with a clean trigger state
    if (global.testApps?.logicSystemApp) {
      const oneYearAgo = Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000).toString();
      global.testApps.logicSystemApp.resetTriggers(oneYearAgo);
    }
    
    // Clean database tables
    await this.dbCleanup.cleanAllTables();
  }

  /**
   * @notice Get access to global test infrastructure
   * @dev Throws error if test apps not initialized properly
   * @return Global test applications object
   */
  static getGlobalApps() {
    if (!global.testApps) {
      throw new Error('Test apps not initialized. Make sure setupFilesAfterEnv ran correctly.');
    }
    return global.testApps;
  }

  /**
   * @notice Get access to global HTTP mock setup
   * @dev Throws error if mock setup not initialized properly
   * @return Global HTTP mock setup instance
   */
  static getGlobalHttpMockSetup() {
    if (!global.httpMockSetup) {
      throw new Error('HTTP mock setup not initialized. Make sure setupFilesAfterEnv ran correctly.');
    }
    return global.httpMockSetup;
  }
}