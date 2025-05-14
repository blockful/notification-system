import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('subscriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('user_id').notNullable().index();
    table.string('dao_id').notNullable().index();
    table.enum('notification_type', [
      'proposal_created',
      'proposal_active',
      'proposal_succeeded',
      'proposal_executed',
      'proposal_defeated',
      'proposal_canceled'
    ]).notNullable();
    table.jsonb('notification_channels').notNullable().defaultTo('[]');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    
    // Unique constraint to prevent duplicate subscriptions
    table.unique(['user_id', 'dao_id', 'notification_type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('subscriptions');
}

