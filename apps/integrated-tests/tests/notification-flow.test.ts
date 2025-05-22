import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { startServices, stopServices, hasAnyLog, clearCapturedLogs } from '../src/services-setup';
import { db } from '../src/pg-setup';

describe('Complete Notification Flow', () => {
  beforeAll(async () => {
    await startServices();
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  afterAll(async () => {
    stopServices();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  test('should process proposal status change from pending to active (complete flow with consumer)', async () => {
    clearCapturedLogs();
    
    // Find an existing proposal with 'pending' status
    const pendingProposal = await db('proposals_onchain')
      .where({ status: 'pending' })
      .first();
    
    expect(pendingProposal).toBeDefined();
    
    await db('proposals_onchain')
      .where({ id: pendingProposal.id })
      .update({ 
        status: 'active',
        updated_at: new Date()
      });

    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Validates complete flow: logic-system -> dispatcher -> consumer -> Telegram error because user doesn't exist
    const telegramChatNotFound = hasAnyLog('chat not found', 'consumer');
    expect(telegramChatNotFound).toBe(true);
    await db('proposals_onchain')
      .where({ id: pendingProposal.id })
      .update({ 
        status: 'pending',
        updated_at: pendingProposal.updated_at
      });
  });
}); 