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