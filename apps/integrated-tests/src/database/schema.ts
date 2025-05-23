import { db } from '../config/database';

export async function createTables(): Promise<void> {
  await db.schema.dropTableIfExists('proposals_onchain');
  await db.schema.dropTableIfExists('subscriptions');
  await db.schema.dropTableIfExists('users');
  await db.schema.dropTableIfExists('user_preferences');
  await db.schema.dropTableIfExists('dao');
  
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

  await db.schema.createTable('users', (table) => {
    table.string('id').primary();
    table.string('channel').notNullable();
    table.string('channel_user_id').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.unique(['channel', 'channel_user_id']);
  });

  await db.schema.createTable('user_preferences', (table) => {
    table.string('id').primary();
    table.string('user_id').notNullable().index();
    table.string('dao_id').notNullable().index();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
    table.unique(['user_id', 'dao_id']);
  });

  await db.schema.createTable('dao', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('description').nullable();
    table.timestamp('created_at').defaultTo(db.fn.now());
    table.timestamp('updated_at').defaultTo(db.fn.now());
  });
} 