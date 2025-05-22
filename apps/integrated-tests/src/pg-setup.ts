import knex from 'knex';
import path from 'path';

// Create a knex instance configured to use PostgreSQL
export const db = knex({
  client: 'pg',
  connection: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'test_db'
  }
});

// Initialize database with tables
export async function initializeDatabase(): Promise<void> {
  // Drop tables if they exist
  await db.schema.dropTableIfExists('proposals_onchain');
  await db.schema.dropTableIfExists('subscriptions');
  await db.schema.dropTableIfExists('users');
  await db.schema.dropTableIfExists('user_preferences');

  // Create proposals table
  await db.schema.createTable('proposals_onchain', (table) => {
    table.string('id').primary();
    table.string('dao_id').notNullable().index();
    table.string('proposer_account_id').notNullable();
    table.jsonb('targets').notNullable();
    table.jsonb('values').notNullable();
    table.jsonb('signatures').notNullable();
    table.jsonb('calldatas').notNullable();
    table.integer('start_block').notNullable();
    table.integer('end_block').notNullable();
    table.text('description').notNullable();
    table.timestamp('timestamp').notNullable();
    table.string('status').notNullable().index();
    table.string('for_votes').notNullable().defaultTo('0');
    table.string('against_votes').notNullable().defaultTo('0');
    table.string('abstain_votes').notNullable().defaultTo('0');
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
  });

  // Create users table for subscription server
  await db.schema.createTable('users', (table) => {
    table.string('id').primary();
    table.string('channel').notNullable();
    table.string('channel_user_id').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.unique(['channel', 'channel_user_id']);
  });

  // Create user_preferences table for subscription server
  await db.schema.createTable('user_preferences', (table) => {
    table.string('id').primary();
    table.string('user_id').notNullable().index();
    table.string('dao_id').notNullable().index();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
    table.unique(['user_id', 'dao_id']);
  });
}

// Seed the database with test data
export async function seedDatabase(): Promise<void> {
  // Seed proposals
  await db('proposals_onchain').insert([
    {
      id: '0x1234567890abcdef1234567890abcdef12345678',
      dao_id: '0xdao1234567890abcdef1234567890abcdef123',
      proposer_account_id: '0xuser567890abcdef1234567890abcdef12345678',
      targets: JSON.stringify(['0xtarget1', '0xtarget2']),
      values: JSON.stringify(['0', '100000000000000000']),
      signatures: JSON.stringify(['transfer(address,uint256)', 'vote(uint256)']),
      calldatas: JSON.stringify(['0xabcdef1234567890', '0x567890abcdef1234']),
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
      targets: JSON.stringify(['0xtarget3']),
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

  // Seed users
  await db('users').insert([
    {
      id: 'user123',
      channel: 'telegram',
      channel_user_id: 'telegram_user_123',
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

  // Seed user preferences
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
}

// Initialize and seed the database
export async function setupDatabase(): Promise<void> {
  await initializeDatabase();
  await seedDatabase();
  console.log('PostgreSQL database setup completed successfully');
}

// Close the database connection
export function closeDatabase(): void {
  db.destroy();
} 