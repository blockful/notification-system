import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notifications', (table) => {
    table.string('user_id').notNullable();
    table.string('dao_id').notNullable();
    table.string('event_id').notNullable();
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.primary(['user_id', 'dao_id', 'event_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('notifications');
} 