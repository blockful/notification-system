import { Knex } from 'knex';
import { waitFor, waitForCondition } from '../utilities/wait-for';
import { testConstants, timeouts } from '../../config';

/**
 * Helper class for database operations in integration tests
 * 
 * This class provides utilities to wait for database state changes and verify 
 * data conditions during integration testing. It's designed to handle asynchronous
 * database operations where tests need to wait for records to appear or disappear.
 */
export class DatabaseTestHelper {
  /**
   * Creates a new DatabaseTestHelper instance
   * 
   * @param db - The Knex database connection instance
   */
  constructor(private db: Knex) {}

  /**
   * Waits for a notification record to appear in the database
   * 
   * This method polls the notifications table until a matching record is found.
   * Useful for testing asynchronous notification creation processes.
   * 
   * @param userId - The ID of the user to look for in notifications
   * @param eventId - Optional event ID to filter notifications by
   * @param options - Configuration options
   * @param options.timeout - Maximum time to wait in milliseconds (default: 5000ms)
   * 
   * @returns Promise that resolves to the found notification record
   * 
   * @throws Will throw an error if the notification is not found within the timeout period
   */
  async waitForNotificationRecord(
    userId: string,
    eventId?: string,
    options?: { timeout?: number }
  ): Promise<any> {
    return waitFor(
      async () => {
        let query = this.db(testConstants.tables.notifications).where({ user_id: userId });
        
        if (eventId) {
          query = query.where({ event_id: eventId });
        }
        
        const result = await query.first();
        return result || null;
      },
      {
        timeout: options?.timeout || timeouts.wait.default,
        errorMessage: eventId 
          ? `Notification for user ${userId} and event ${eventId} not found`
          : `Notification for user ${userId} not found`
      }
    );
  }

  /**
   * Waits for a specific count of records in a table
   * 
   * This method polls a database table until it contains exactly the expected
   * number of records. Useful for verifying bulk operations or deletions.
   * 
   * @param tableName - Name of the table to check
   * @param expectedCount - The exact number of records expected
   * @param where - Optional WHERE conditions to filter records
   * @param options - Configuration options
   * @param options.timeout - Maximum time to wait in milliseconds (default: 5000ms)
   * 
   * @returns Promise that resolves when the expected count is reached
   * 
   * @throws Will throw an error if the expected count is not reached within the timeout
   * 
   */
  async waitForRecordCount(
    tableName: string,
    expectedCount: number,
    where?: Record<string, any>,
    options?: { timeout?: number }
  ): Promise<void> {
    await waitForCondition(
      async () => {
        let query = this.db(tableName);
        
        if (where) {
          query = query.where(where);
        }
        
        const result = await query.count('* as count').first();
        return result?.count === expectedCount;
      },
      `Expected ${expectedCount} records in ${tableName} but count doesn't match`,
      { timeout: options?.timeout || timeouts.wait.default }
    );
  }

  /**
   * Gets all notifications from the database
   * 
   * @returns Promise that resolves to an array of notification records
   */
  async getNotifications(): Promise<any[]> {
    return await this.db(testConstants.tables.notifications).select('*');
  }

  /**
   * Ensures that no notification exists for a specific user and event
   * 
   * This method waits for a specified time period and then verifies that no
   * notification was created. Useful for testing scenarios where notifications
   * should NOT be triggered.
   * 
   * @param userId - The ID of the user to check
   * @param eventId - The ID of the event to check
   * @param waitTime - Time to wait before checking in milliseconds (default: 1000ms)
   * 
   * @returns Promise that resolves if no notification is found
   * 
   * @throws Will throw an error if an unexpected notification is found
   * 
   */
  async ensureNoNotificationFor(
    userId: string,
    eventId: string,
    waitTime: number = timeouts.wait.short
  ): Promise<void> {
    // Wait a bit to ensure no notification is created
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    const notification = await this.db(testConstants.tables.notifications)
      .where({ user_id: userId, event_id: eventId })
      .first();
    
    if (notification) {
      throw new Error(
        `Unexpected notification found for user ${userId} and event ${eventId}`
      );
    }
  }

}