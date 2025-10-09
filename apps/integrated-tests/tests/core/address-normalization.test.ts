import { describe, test, expect, beforeEach, jest, beforeAll } from '@jest/globals';
import { db, TestApps } from '../../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../../src/mocks';
import { UserFactory } from '../../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { testConstants, timeouts } from '../../src/config';

describe('Address Normalization - Integration Test', () => {
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

  test('should normalize checksum addresses from API client to lowercase', async () => {
    const testDaoId = testConstants.daoIds.voteTest || 'test-dao-vote';
    const testUser = testConstants.profiles.p10;
    const voterAddress = testUser.address;
    const voterAddressChecksum = testConstants.profiles.p10_checksum.address;

    // Create user with subscription to DAO
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();

    const { user: userWithSub } = await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'vote-user-checksum-test',
      testDaoId,
      true,
      pastTimestamp
    );

    // Create address mapping with LOWERCASE 
    await UserFactory.createUserAddress(userWithSub.id, voterAddress, pastTimestamp);

    // Create vote event with timestamp in the future to ensure processing
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString();

    const voteEvents = [
      {
        daoId: testDaoId,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        proposalId: 'prop-checksum-test',
        voterAccountId: voterAddressChecksum,
        support: '1', // FOR
        votingPower: '1000000000000000000000', // 1000 tokens
        timestamp: eventTimestamp,
        reason: 'Testing checksum normalization!'
      }
    ];

    // Setup GraphQL mock
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [], // No proposals needed
      [], // No voting power events
      { [testDaoId]: 1 }, // Map daoId to chainId
      voteEvents // Add votes to mock
    );

    // Wait for notification
    const message = await telegramHelper.waitForMessage(
      msg => msg.text.includes('just voted on'),
      { timeout: timeouts.notification.delivery }
    );

    console.log(message.text);
    // Verify message content for FOR vote
    expect(message.text).toContain('✅'); // FOR emoji
    expect(message.text).toMatch(/voted FOR|just voted on/i);
    expect(message.text).toContain('[Transaction details](https://etherscan.io/tx/');
    expect(message.text).not.toContain('{{txLink}}');
    expect(message.chatId).toBe(testUser.chatId);
  });
});
