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

  // Migrate existing Slack users to workspace:user format
  // This preserves existing functionality while preparing for multi-workspace
  const hasUsers = await knex('users').where('channel', 'slack').first();
  if (hasUsers) {
    // Use database-agnostic approach
    const slackUsers = await knex('users')
      .where('channel', 'slack')
      .whereNot('channel_user_id', 'like', '%:%');

    for (const user of slackUsers) {
      await knex('users')
        .where('id', user.id)
        .update({
          channel_user_id: `T_DEFAULT:${user.channel_user_id}`
        });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // Revert user IDs to original format
  const hasUsers = await knex('users').where('channel', 'slack').first();
  if (hasUsers) {
    const slackUsers = await knex('users')
      .where('channel', 'slack')
      .where('channel_user_id', 'like', 'T_DEFAULT:%');

    for (const user of slackUsers) {
      const originalId = user.channel_user_id.split(':')[1];
      await knex('users')
        .where('id', user.id)
        .update({
          channel_user_id: originalId
        });
    }
  }

  // Drop the channel_workspaces table
  const hasTable = await knex.schema.hasTable('channel_workspaces');
  if (hasTable) {
    await knex.schema.dropTable('channel_workspaces');
  }
}