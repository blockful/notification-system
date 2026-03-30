import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_notification_preferences', (table) => {
    table.string('user_id', 36).notNullable();
    table.string('trigger_type', 100).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    table.primary(['user_id', 'trigger_type']);
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user_notification_preferences');
}
