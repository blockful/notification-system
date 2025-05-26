import { knex } from 'knex';

export const db = knex({
  client: 'sqlite3',
  connection: {
    filename: '/tmp/test_integration.db'
  },
  useNullAsDefault: true
});

export function closeDatabase(): void {
  db.destroy();
} 