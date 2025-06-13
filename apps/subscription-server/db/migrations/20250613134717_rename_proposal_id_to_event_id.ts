import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  // Check if column exists before renaming to avoid errors
  const hasProposalId = await knex.schema.hasColumn('notifications', 'proposal_id');
  
  if (hasProposalId) {
    await knex.schema.alterTable('notifications', (table) => {
      table.renameColumn('proposal_id', 'event_id');
    });
  }
}


export async function down(knex: Knex): Promise<void> {
  // Rollback: rename event_id back to proposal_id
  const hasEventId = await knex.schema.hasColumn('notifications', 'event_id');
  
  if (hasEventId) {
    await knex.schema.alterTable('notifications', (table) => {
      table.renameColumn('event_id', 'proposal_id');
    });
  }
}

