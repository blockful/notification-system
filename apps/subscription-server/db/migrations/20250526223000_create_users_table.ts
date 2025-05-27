import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('channel').notNullable();
    table.string('channel_user_id').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['channel', 'channel_user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('users');
} 