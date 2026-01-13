import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { db, TestApps } from '../../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../../src/mocks';
import { UserFactory, VotingPowerFactory } from '../../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { testConstants, timeouts } from '../../src/config';

describe('Delegation Change Notifications - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    httpMockSetup = TestCleanup.getGlobalHttpMockSetup();
    telegramHelper = new TelegramTestHelper(global.mockTelegramSendMessage);
    dbHelper = new DatabaseTestHelper(db);
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('should send delegation confirmation notification to delegator', async () => {
    const testDaoId = testConstants.daoIds.votingPowerTest;
    const delegatorAddress = testConstants.profiles.p1.address;
    const delegateAddress = testConstants.profiles.p2.address;
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();
    
    // Create delegator user (who will receive delegation confirmation)
    const { user: delegatorUser } = await UserFactory.createUserWithFullSetup(
      testConstants.profiles.p1.chatId,
      'delegator-user',
      testDaoId,
      true,
      pastTimestamp
    );
    await UserFactory.createUserAddress(delegatorUser.id, delegatorAddress, pastTimestamp);
    
    // Create delegation event where user delegates to someone else
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString();
    const delegationEvent = VotingPowerFactory.createDelegationEvent(
      delegatorAddress, // who delegates (source) - our test user
      delegateAddress,  // who receives delegation (target) - someone else
      testConstants.votingPower.default,
      testDaoId,
      { 
        timestamp: eventTimestamp,
        chainId: 1,
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      }
    );

    // Setup GraphQL mock to return voting power data
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [delegationEvent],
      { [testDaoId]: 1 }
    );

    // Wait for delegation confirmation notification (new feature we implemented)
    const delegatorMessage = await telegramHelper.waitForMessage(
      msg => msg.text.includes('✅ Delegation confirmed') && msg.text.includes(testDaoId),
      { timeout: timeouts.notification.delivery }
    );

    // Verify delegator confirmation notification
    expect(delegatorMessage.text).toContain('✅ Delegation confirmed');
    expect(delegatorMessage.text).toContain(testDaoId);
    expect(delegatorMessage.text).toContain('delegated');
    expect(delegatorMessage.chatId).toBe(testConstants.profiles.p1.chatId);
    
    // Verify transaction link and placeholders are replaced
    expect(delegatorMessage.text).not.toContain('{{txLink}}');
    expect(delegatorMessage.text).not.toContain('{{delegatorAccount}}');
    expect(delegatorMessage.text).not.toContain('{{delegate}}');

    // Verify ENS names are resolved (not raw addresses)
    expect(delegatorMessage.text).toContain('vitalik.eth');
    expect(delegatorMessage.text).toContain('nick.eth');

    // Verify message has substantial content
    expect(delegatorMessage.text.length).toBeGreaterThan(50);
  });

  test('should send undelegation confirmation notification', async () => {
    const testDaoId = testConstants.daoIds.votingPowerTest;
    const delegatorAddress = testConstants.profiles.p1.address;
    const delegateAddress = testConstants.profiles.p2.address;
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();
    
    // Create delegator user
    const { user: delegatorUser } = await UserFactory.createUserWithFullSetup(
      testConstants.profiles.p1.chatId,
      'undelegator-user',
      testDaoId,
      true,
      pastTimestamp
    );
    await UserFactory.createUserAddress(delegatorUser.id, delegatorAddress, pastTimestamp);
    
    // Create undelegation event (negative delta)
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString();
    const undelegationEvent = VotingPowerFactory.createDelegationEvent(
      delegatorAddress,
      delegateAddress,
      '-' + testConstants.votingPower.default, // negative for undelegation
      testDaoId,
      { 
        timestamp: eventTimestamp,
        chainId: 1,
        transactionHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba'
      }
    );

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [undelegationEvent],
      { [testDaoId]: 1 }
    );

    // Wait for undelegation confirmation notification
    const delegatorMessage = await telegramHelper.waitForMessage(
      msg => msg.text.includes('↩️ Undelegation confirmed') && msg.text.includes(testDaoId),
      { timeout: timeouts.notification.delivery }
    );

    // Verify undelegation confirmation notification
    expect(delegatorMessage.text).toContain('↩️ Undelegation confirmed');
    expect(delegatorMessage.text).toContain('removed');
    expect(delegatorMessage.chatId).toBe(testConstants.profiles.p1.chatId);

    // Verify ENS names are resolved (not raw addresses)
    expect(delegatorMessage.text).toContain('vitalik.eth');
    expect(delegatorMessage.text).toContain('nick.eth');
  });
});