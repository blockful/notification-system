import { db } from '../config/database';

export async function seedTestData(): Promise<void> {
  await db('proposals_onchain').insert([
    {
      id: '0x1234567890abcdef1234567890abcdef12345678',
      dao_id: '0xdao1234567890abcdef1234567890abcdef123',
      proposer_account_id: '0xuser567890abcdef1234567890abcdef12345678',
      targets: JSON.stringify(['0xtarget1']),
      values: JSON.stringify(['0']),
      signatures: JSON.stringify(['transfer(address,uint256)']),
      calldatas: JSON.stringify(['0xabcdef1234567890']),
      start_block: 12345678,
      end_block: 12345978,
      description: 'Proposal to transfer funds to the treasury',
      timestamp: new Date().toISOString(),
      status: 'active',
      for_votes: '1000000000000000000',
      against_votes: '500000000000000000',
      abstain_votes: '200000000000000000',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '0x2345678901abcdef2345678901abcdef23456789',
      dao_id: '0xdao1234567890abcdef1234567890abcdef123',
      proposer_account_id: '0xuser567890abcdef1234567890abcdef12345678',
      targets: JSON.stringify(['0xtarget2']),
      values: JSON.stringify(['0']),
      signatures: JSON.stringify(['changeQuorum(uint256)']),
      calldatas: JSON.stringify(['0x123456789abcdef0']),
      start_block: 12345600,
      end_block: 12345900,
      description: 'Proposal to change the governance quorum',
      timestamp: new Date().toISOString(),
      status: 'pending',
      for_votes: '0',
      against_votes: '0',
      abstain_votes: '0',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  await db('users').insert([
    {
      id: 'user123',
      channel: 'telegram',
      channel_user_id: '123456789',
      is_active: true,
      created_at: new Date()
    },
    {
      id: 'user456',
      channel: 'discord',
      channel_user_id: 'discord_user_456',
      is_active: true,
      created_at: new Date()
    }
  ]);

  await db('user_preferences').insert([
    {
      id: 'pref123',
      user_id: 'user123',
      dao_id: '0xdao1234567890abcdef1234567890abcdef123',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 'pref456',
      user_id: 'user456',
      dao_id: '0xdao1234567890abcdef1234567890abcdef123',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);

  await db('dao').insert([
    {
      id: '0xdao1234567890abcdef1234567890abcdef123',
      name: 'Test DAO',
      description: 'A test DAO for integration testing',
      created_at: new Date(),
      updated_at: new Date()
    }
  ]);
} 