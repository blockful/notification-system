import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('proposals_onchain', (table) => {
    table.string('id').primary();
    table.string('dao_id').notNullable().index();
    table.string('proposer_account_id').notNullable();
    
    // Using text instead of json for SQLite compatibility
    // Both SQLite and PostgreSQL can store JSON as text
    table.text('targets').notNullable();
    table.text('values').notNullable();
    table.text('signatures').notNullable();
    table.text('calldatas').notNullable();
    
    table.integer('start_block').notNullable();
    table.integer('end_block').notNullable();
    table.text('description').notNullable();
    
    // Using datetime instead of timestamp for SQLite compatibility
    table.datetime('timestamp').notNullable();
    
    // Using string enum instead of native enum for cross-database compatibility
    table.string('status').notNullable().index();
    
    // Using string for large numbers to ensure cross-database compatibility
    table.string('for_votes').notNullable().defaultTo('0');
    table.string('against_votes').notNullable().defaultTo('0');
    table.string('abstain_votes').notNullable().defaultTo('0');
    
    table.index(['status', 'dao_id']);
    table.datetime('created_at').defaultTo(knex.fn.now());
    table.datetime('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('proposals_onchain');
}

