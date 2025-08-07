import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // First drop the primary key constraint
  await knex.raw('ALTER TABLE user_addresses DROP CONSTRAINT user_addresses_pkey');
  
  // Drop the auto-increment sequence
  await knex.raw('DROP SEQUENCE IF EXISTS user_addresses_id_seq CASCADE');
  
  // Create a new temporary column for UUID
  await knex.schema.alterTable('user_addresses', (table) => {
    table.string('id_new', 36);
  });
  
  // Generate UUIDs for existing rows (if any)
  await knex.raw(`
    UPDATE user_addresses 
    SET id_new = gen_random_uuid()::text
  `);
  
  // Drop old column and rename new one
  await knex.schema.alterTable('user_addresses', (table) => {
    table.dropColumn('id');
    table.renameColumn('id_new', 'id');
  });
  
  // Add NOT NULL constraint and primary key
  await knex.raw('ALTER TABLE user_addresses ALTER COLUMN id SET NOT NULL');
  await knex.raw('ALTER TABLE user_addresses ADD PRIMARY KEY (id)');
  
  // Also fix user_id to be NOT NULL and varchar(36) to match foreign key
  await knex.raw('ALTER TABLE user_addresses ALTER COLUMN user_id SET NOT NULL');
}

export async function down(knex: Knex): Promise<void> {
  // This is a destructive operation and cannot be easily reversed
  // as we're changing from UUID to integer
  throw new Error('This migration cannot be reversed');
}