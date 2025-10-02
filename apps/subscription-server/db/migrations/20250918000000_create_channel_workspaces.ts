import type { Knex } from "knex";

/**
 * Creates channel_workspaces table for multi-workspace OAuth support
 * Supports multiple platforms (initially Slack) with workspace-specific tokens
 */
export async function up(knex: Knex): Promise<void> {
  // Create the channel_workspaces table with final schema
  const hasTable = await knex.schema.hasTable('channel_workspaces');

  if (!hasTable) {
    await knex.schema.createTable('channel_workspaces', (table) => {
      table.string('workspace_id', 255).primary();
      table.string('workspace_name', 255);
      table.string('channel', 50).notNullable().defaultTo('slack');
      table.text('bot_token').notNullable();
      table.string('bot_user_id', 255);
      table.boolean('is_active').defaultTo(true);
      table.timestamp('installed_at').defaultTo(knex.fn.now());

      table.index(['workspace_id', 'is_active']);
      table.index('channel', 'idx_channel_workspaces_channel');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Drop the channel_workspaces table
  const hasTable = await knex.schema.hasTable('channel_workspaces');
  if (hasTable) {
    await knex.schema.dropTable('channel_workspaces');
  }
}