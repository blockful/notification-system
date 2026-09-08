import type { Knex } from "knex";

// This migration ran in production (recorded in knex_migrations) but its file
// was accidentally deleted in commit 7b7f1e1d. It converted user_addresses.id
// from serial int to varchar(36) UUID — the create-table migration
// (20250715000000) now creates the correct schema directly, so fresh DBs need
// nothing. The file must exist with this exact name or knex refuses to run
// any migrations ("migration directory is corrupt").
export async function up(_knex: Knex): Promise<void> {}

export async function down(_knex: Knex): Promise<void> {}
