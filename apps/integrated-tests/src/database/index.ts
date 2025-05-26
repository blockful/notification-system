import { db } from '../config/database';

export async function createTestTables(): Promise<void> {
  await db.schema.dropTableIfExists('proposals_onchain');
  await db.schema.dropTableIfExists('subscriptions');
  await db.schema.dropTableIfExists('users');
  await db.schema.dropTableIfExists('user_preferences');
  await db.schema.dropTableIfExists('dao');
  
  await db.schema.createTable('proposals_onchain', (table) => {
    table.string('id').primary();
    table.string('dao_id').notNullable();
    table.string('proposer_account_id').notNullable();
    table.json('targets').notNullable();
    table.json('values').notNullable();
    table.json('signatures').notNullable();
    table.json('calldatas').notNullable();
    table.integer('start_block').notNullable();
    table.integer('end_block').notNullable();
    table.text('description').notNullable();
    table.datetime('timestamp').notNullable();
    table.string('status').notNullable();
    table.string('for_votes').notNullable().defaultTo('0');
    table.string('against_votes').notNullable().defaultTo('0');
    table.string('abstain_votes').notNullable().defaultTo('0');
    table.datetime('created_at').defaultTo(db.fn.now());
    table.datetime('updated_at').defaultTo(db.fn.now());
  });

  await db.schema.createTable('users', (table) => {
    table.string('id').primary();
    table.string('channel').notNullable();
    table.string('channel_user_id').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.datetime('created_at').defaultTo(db.fn.now());
    table.unique(['channel', 'channel_user_id']);
  });

  await db.schema.createTable('user_preferences', (table) => {
    table.string('id').primary();
    table.string('user_id').notNullable();
    table.string('dao_id').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.datetime('created_at').defaultTo(db.fn.now());
    table.datetime('updated_at').defaultTo(db.fn.now());
    table.unique(['user_id', 'dao_id']);
  });

  await db.schema.createTable('dao', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('description');
    table.datetime('created_at').defaultTo(db.fn.now());
    table.datetime('updated_at').defaultTo(db.fn.now());
  });
}

export async function insertTestData(): Promise<void> {
  const now = new Date().toISOString();
  
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
      timestamp: now,
      status: 'active',
      for_votes: '1000000000000000000',
      against_votes: '500000000000000000',
      abstain_votes: '200000000000000000',
      created_at: now,
      updated_at: now
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
      timestamp: now,
      status: 'pending',
      for_votes: '0',
      against_votes: '0',
      abstain_votes: '0',
      created_at: now,
      updated_at: now
    }
  ]);

  await db('users').insert([
    {
      id: 'user123',
      channel: 'telegram',
      channel_user_id: '123456789',
      is_active: true,
      created_at: now
    },
    {
      id: 'user456',
      channel: 'discord',
      channel_user_id: 'discord_user_456',
      is_active: true,
      created_at: now
    }
  ]);

  await db('user_preferences').insert([
    {
      id: 'pref123',
      user_id: 'user123',
      dao_id: '0xdao1234567890abcdef1234567890abcdef123',
      is_active: true,
      created_at: now,
      updated_at: now
    },
    {
      id: 'pref456',
      user_id: 'user456',
      dao_id: '0xdao1234567890abcdef1234567890abcdef123',
      is_active: true,
      created_at: now,
      updated_at: now
    }
  ]);

  await db('dao').insert([
    {
      id: '0xdao1234567890abcdef1234567890abcdef123',
      name: 'Test DAO',
      description: 'A test DAO for integration testing',
      created_at: now,
      updated_at: now
    }
  ]);
}