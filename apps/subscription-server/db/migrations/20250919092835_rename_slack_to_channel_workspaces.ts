import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Check if the old table exists
  const hasSlackTable = await knex.schema.hasTable('slack_workspaces');
  const hasChannelTable = await knex.schema.hasTable('channel_workspaces');

  if (hasSlackTable && !hasChannelTable) {
    // Rename the table
    await knex.schema.renameTable('slack_workspaces', 'channel_workspaces');

    // Add channel column with default 'slack'
    await knex.schema.alterTable('channel_workspaces', (table) => {
      table.string('channel', 50).notNullable().defaultTo('slack').after('workspace_name');
      table.index('channel', 'idx_channel_workspaces_channel');
    });
  } else if (!hasSlackTable && !hasChannelTable) {
    // If neither exists, create the final table structure directly
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
  // Check if the new table exists
  const hasChannelTable = await knex.schema.hasTable('channel_workspaces');
  const hasSlackTable = await knex.schema.hasTable('slack_workspaces');

  if (hasChannelTable && !hasSlackTable) {
    // Remove the channel column
    await knex.schema.alterTable('channel_workspaces', (table) => {
      table.dropIndex(['channel'], 'idx_channel_workspaces_channel');
      table.dropColumn('channel');
    });

    // Rename the table back
    await knex.schema.renameTable('channel_workspaces', 'slack_workspaces');
  }
}