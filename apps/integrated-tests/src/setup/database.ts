import { db } from './database-config';
import { v4 as uuidv4 } from 'uuid';

export async function setupDatabase(): Promise<void> {
  await db.migrate.rollback();
  await db.migrate.latest();
}

export async function createTestData() {
  const now = new Date().toISOString();
  const testDao = await createTestDao(now);
  const testUser = await createTestUser(now);
  const testUserPreference = await createTestUserPreference(testUser.id, testDao.id, now);
  const testProposal = await createTestProposal(testDao.id, now);
  const testSubscription = await createTestSubscription(testUser.id, testDao.id, now);
  return { 
    testDao, 
    testUser, 
    testUserPreference, 
    testProposal,
    testSubscription 
  };
}

async function createTestDao(timestamp: string) {
  const dao = {
    id: uuidv4()
  };
  await db('dao').insert(dao);
  return dao;
}

async function createTestUser(timestamp: string) {
  const user = {
    id: uuidv4(),
    channel: 'telegram',
    channel_user_id: '123456789',
    created_at: timestamp
  };
  await db('users').insert(user);
  return user;
}

async function createTestUserPreference(userId: string, daoId: string, timestamp: string) {
  const preference = {
    id: uuidv4(),
    user_id: userId,
    dao_id: daoId,
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp
  };
  await db('user_preferences').insert(preference);
  return preference;
}

async function createTestProposal(daoId: string, timestamp: string) {
  const proposal = {
    id: uuidv4(),
    dao_id: daoId,
    proposer_account_id: uuidv4(),
    targets: JSON.stringify(['0xtarget1']),
    values: JSON.stringify(['0']),
    signatures: JSON.stringify(['transfer(address,uint256)']),
    calldatas: JSON.stringify(['0xabcdef1234567890']),
    start_block: 12345678,
    end_block: 12345978,
    description: 'Test proposal',
    timestamp: timestamp,
    status: 'pending',
    for_votes: '1000000000000000000',
    against_votes: '500000000000000000',
    abstain_votes: '200000000000000000',
    created_at: timestamp,
    updated_at: timestamp
  };
  await db('proposals_onchain').insert(proposal);
  return proposal;
}

async function createTestSubscription(userId: string, daoId: string, timestamp: string) {
  const subscription = {
    id: uuidv4(),
    user_id: userId,
    dao_id: daoId,
    notification_type: 'proposal_created',
    notification_channels: JSON.stringify(['telegram']),
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp
  };
  await db('subscriptions').insert(subscription);
  return subscription;
} 