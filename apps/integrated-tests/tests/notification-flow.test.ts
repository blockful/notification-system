import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { startServices, stopServices, hasErrorLog, clearCapturedLogs } from '../src/services-setup';
import { db } from '../src/pg-setup';

describe('Complete Notification Flow', () => {
  beforeAll(async () => {
    await startServices();
    // Give services time to start
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  afterAll(async () => {
    stopServices();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test('should process proposal status change from pending to active (with expected Telegram error)', async () => {
    clearCapturedLogs();
    
    // Find an existing proposal with 'pending' status
    const pendingProposal = await db('proposals_onchain')
      .where({ status: 'pending' })
      .first();
    
    expect(pendingProposal).toBeDefined();
    
    // Update proposal status to 'active' (this should trigger the notification system)
    await db('proposals_onchain')
      .where({ id: pendingProposal.id })
      .update({ 
        status: 'active',
        updated_at: new Date()
      });

    // Wait for the logic system to detect the change
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Validate that the expected Telegram error occurred
    const expectedError = 'Invalid channelUserId: telegram_user_123 is not a valid number';
    const errorOccurred = hasErrorLog(expectedError, 'dispatcher');
    expect(errorOccurred).toBe(true);

    // Restore original status for next test runs
    await db('proposals_onchain')
      .where({ id: pendingProposal.id })
      .update({ 
        status: 'pending',
        updated_at: pendingProposal.updated_at
      });
  });
}); 