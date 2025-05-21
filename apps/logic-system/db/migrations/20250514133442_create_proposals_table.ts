import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('proposals_onchain', (table) => {
    table.string('id').primary();
    table.string('dao_id').notNullable().index();
    table.string('proposer_account_id').notNullable();
    table.json('targets').notNullable();
    table.json('values').notNullable();
    table.json('signatures').notNullable();
    table.json('calldatas').notNullable();
    table.integer('start_block').notNullable();
    table.integer('end_block').notNullable();
    table.text('description').notNullable();
    table.timestamp('timestamp').notNullable();
    table.enum('status', [
      'pending',
      'active',
      'succeeded',
      'defeated',
      'executed',
      'canceled',
      'queued',
      'expired'
    ]).notNullable().index();
    table.decimal('for_votes', 78, 0).notNullable().defaultTo(0);
    table.decimal('against_votes', 78, 0).notNullable().defaultTo(0);
    table.decimal('abstain_votes', 78, 0).notNullable().defaultTo(0);
    
    table.index(['status', 'dao_id']);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('proposals_onchain');
}

