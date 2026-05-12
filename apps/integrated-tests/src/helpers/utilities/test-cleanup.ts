import { vi } from 'vitest';
import { DatabaseCleanup } from '../database/database-cleanup';
import { db } from '../../setup/database/database-config';

/**
 * Central cleanup helper for beforeEach in tests.
 * Resets vi mocks, MSW handlers (via the test setup), RMQ events, and DB tables.
 */
export class TestCleanup {
  private static dbCleanup = new DatabaseCleanup(db);

  static async cleanupBetweenTests(): Promise<void> {
    vi.clearAllMocks();

    if (global.testApps?.rabbitmqSetup) {
      global.testApps.rabbitmqSetup.clearCollectedEvents();
      await global.testApps.rabbitmqSetup.purgeAllQueues();
    }

    if (global.testApps?.logicSystemApp) {
      const oneYearAgo = Math.floor((Date.now() - 365 * 24 * 60 * 60 * 1000) / 1000).toString();
      global.testApps.logicSystemApp.resetTriggers(oneYearAgo);
    }

    await this.dbCleanup.cleanAllTables();
  }

  static getGlobalApps() {
    if (!global.testApps) {
      throw new Error('Test apps not initialized. Make sure setupFiles ran correctly.');
    }
    return global.testApps;
  }
}
