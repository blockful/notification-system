/**
 * Database configuration
 * 
 * Centralizes database connection setup for the application
 */

import knex from 'knex';
import { config } from './env';

export const daosDb = knex({
client: 'pg',
connection: config.anticaptureDataBaseUrl
});

export const usersDb = knex({
  client: 'pg',
  connection: config.usersDatabaseUrl
});
