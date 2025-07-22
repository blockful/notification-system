import { Knex } from 'knex';
import { waitFor, waitForCondition } from './wait-for';

export class DatabaseTestHelper {
  constructor(private db: Knex) {}

  async waitForNotificationRecord(
    userId: string,
    eventId?: string,
    options?: { timeout?: number }
  ): Promise<any> {
    return waitFor(
      async () => {
        let query = this.db('notifications').where({ user_id: userId });
        
        if (eventId) {
          query = query.where({ event_id: eventId });
        }
        
        const result = await query.first();
        return result || null;
      },
      {
        timeout: options?.timeout || 5000,
        errorMessage: eventId 
          ? `Notification for user ${userId} and event ${eventId} not found`
          : `Notification for user ${userId} not found`
      }
    );
  }

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
      { timeout: options?.timeout || 5000 }
    );
  }

  async ensureNoNotificationFor(
    userId: string,
    eventId: string,
    waitTime: number = 1000
  ): Promise<void> {
    // Wait a bit to ensure no notification is created
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    const notification = await this.db('notifications')
      .where({ user_id: userId, event_id: eventId })
      .first();
    
    if (notification) {
      throw new Error(
        `Unexpected notification found for user ${userId} and event ${eventId}`
      );
    }
  }

}