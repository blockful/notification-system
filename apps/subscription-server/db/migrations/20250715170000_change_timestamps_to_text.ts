import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // Users table
  await knex.schema.alterTable('users', (table) => {
    table.text('created_at_new');
  });
  
  // Copy existing data converting to ISO string
  await knex.raw(`
    UPDATE users 
    SET created_at_new = to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  `);
  
  // Drop old column and rename new one
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('created_at');
    table.renameColumn('created_at_new', 'created_at');
  });

  // User preferences table
  await knex.schema.alterTable('user_preferences', (table) => {
    table.text('created_at_new');
    table.text('updated_at_new');
  });
  
  await knex.raw(`
    UPDATE user_preferences 
    SET created_at_new = to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        updated_at_new = to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  `);
  
  await knex.schema.alterTable('user_preferences', (table) => {
    table.dropColumn('created_at');
    table.dropColumn('updated_at');
    table.renameColumn('created_at_new', 'created_at');
    table.renameColumn('updated_at_new', 'updated_at');
  });

  // User addresses table
  await knex.schema.alterTable('user_addresses', (table) => {
    table.text('created_at_new');
    table.text('updated_at_new');
  });
  
  await knex.raw(`
    UPDATE user_addresses 
    SET created_at_new = to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        updated_at_new = to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  `);
  
  await knex.schema.alterTable('user_addresses', (table) => {
    table.dropColumn('created_at');
    table.dropColumn('updated_at');
    table.renameColumn('created_at_new', 'created_at');
    table.renameColumn('updated_at_new', 'updated_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Revert users table
  await knex.schema.alterTable('users', (table) => {
    table.datetime('created_at_old');
  });
  
  await knex.raw(`
    UPDATE users 
    SET created_at_old = created_at::timestamp
  `);
  
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('created_at');
  });
  
  await knex.schema.alterTable('users', (table) => {
    table.renameColumn('created_at_old', 'created_at');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now()).alter();
  });

  // Revert user_preferences table
  await knex.schema.alterTable('user_preferences', (table) => {
    table.datetime('created_at_old');
    table.datetime('updated_at_old');
  });
  
  await knex.raw(`
    UPDATE user_preferences 
    SET created_at_old = created_at::timestamp,
        updated_at_old = updated_at::timestamp
  `);
  
  await knex.schema.alterTable('user_preferences', (table) => {
    table.dropColumn('created_at');
    table.dropColumn('updated_at');
  });
  
  await knex.schema.alterTable('user_preferences', (table) => {
    table.renameColumn('created_at_old', 'created_at');
    table.renameColumn('updated_at_old', 'updated_at');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now()).alter();
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now()).alter();
  });

  // Revert user_addresses table
  await knex.schema.alterTable('user_addresses', (table) => {
    table.datetime('created_at_old');
    table.datetime('updated_at_old');
  });
  
  await knex.raw(`
    UPDATE user_addresses 
    SET created_at_old = created_at::timestamp,
        updated_at_old = updated_at::timestamp
  `);
  
  await knex.schema.alterTable('user_addresses', (table) => {
    table.dropColumn('created_at');
    table.dropColumn('updated_at');
  });
  
  await knex.schema.alterTable('user_addresses', (table) => {
    table.renameColumn('created_at_old', 'created_at');
    table.renameColumn('updated_at_old', 'updated_at');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now()).alter();
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now()).alter();
  });
}