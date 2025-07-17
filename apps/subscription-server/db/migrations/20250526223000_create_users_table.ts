import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.string('id', 36).primary();
    table.string('channel').notNullable();
    table.string('channel_user_id').notNullable();
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['channel', 'channel_user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users');
} 