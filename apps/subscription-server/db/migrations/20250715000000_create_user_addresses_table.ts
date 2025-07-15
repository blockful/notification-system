import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_addresses', (table) => {
    table.string('id', 36).primary();
    table.string('user_id', 36).notNullable();
    table.string('address').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    
    table.foreign('user_id').references('id').inTable('users');
    table.unique(['user_id', 'address']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user_addresses');
}