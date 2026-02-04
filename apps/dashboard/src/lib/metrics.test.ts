import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildNotificationActivityByDaoQuery, buildUsersQueries } from './metrics';

test('buildNotificationActivityByDaoQuery builds notifications query', () => {
  const { text, values } = buildNotificationActivityByDaoQuery(5);

  assert.match(text, /FROM notifications/);
  assert.equal(values[0], 5);
});

test('buildUsersQueries applies DAO filter', () => {
  const { countQuery, listQuery } = buildUsersQueries({ dao: 'dao-123' }, 1, 20, 'desc');

  assert.match(countQuery.text, /p\.dao_id/);
  assert.equal(countQuery.values[0], 'dao-123');
  assert.match(listQuery.text, /EXISTS/);
});

test('buildUsersQueries applies address range filters', () => {
  const { countQuery, listQuery } = buildUsersQueries(
    { minAddresses: 2, maxAddresses: 5 },
    2,
    10,
    'desc'
  );

  assert.match(countQuery.text, /address_count/);
  assert.equal(countQuery.values[0], 2);
  assert.equal(countQuery.values[1], 5);
  assert.equal(listQuery.values[listQuery.values.length - 2], 10);
  assert.equal(listQuery.values[listQuery.values.length - 1], 10);
});

test('buildUsersQueries supports unknown DAO filter', () => {
  const { countQuery } = buildUsersQueries({ dao: '__unknown__' }, 1, 20, 'desc');

  assert.match(countQuery.text, /p\.dao_id = ''/);
  assert.equal(countQuery.values.length, 0);
});
