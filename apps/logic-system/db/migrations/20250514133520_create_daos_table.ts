import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('dao', (table) => {
    table.text('id').primary();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('dao');
} 