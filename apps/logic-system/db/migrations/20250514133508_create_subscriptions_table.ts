import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('subscriptions', (table) => {
    table.string('id', 36).primary();
    table.string('user_id').notNullable().index();
    table.string('dao_id').notNullable().index();
    table.string('notification_type').notNullable();
    table.text('notification_channels').notNullable().defaultTo('[]');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['user_id', 'dao_id', 'notification_type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('subscriptions');
}

