import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildEngagementDistributionQuery,
  buildGrowthSeries,
  buildNotificationActivityByDaoQuery,
  buildUsersQueries,
} from './metrics';

test('buildNotificationActivityByDaoQuery builds notifications query', () => {
  const { text, values } = buildNotificationActivityByDaoQuery(5);

  assert.match(text, /FROM notifications/);
  assert.match(text, /COUNT\(DISTINCT event_id\)/);
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

test('buildUsersQueries applies address filter', () => {
  const { countQuery, listQuery } = buildUsersQueries({ address: '0xabc' }, 1, 20, 'desc');

  assert.match(countQuery.text, /user_addresses/);
  assert.match(countQuery.text, /LOWER\(ua\.address\) = LOWER\(\$\d+\)/);
  assert.equal(countQuery.values[0], '0xabc');
  assert.match(listQuery.text, /user_addresses/);
});

test('buildUsersQueries supports unknown DAO filter', () => {
  const { countQuery } = buildUsersQueries({ dao: '__unknown__' }, 1, 20, 'desc');

  assert.match(countQuery.text, /p\.dao_id = ''/);
  assert.equal(countQuery.values.length, 0);
});

test('buildUsersQueries derives slack workspace id and scopes workspace join', () => {
  const { listQuery } = buildUsersQueries({}, 1, 20, 'desc');

  assert.match(listQuery.text, /split_part\(u\.channel_user_id, ':'\, 1\)/);
  assert.match(listQuery.text, /cw\.channel = 'slack'/);
  assert.match(listQuery.text, /slack_workspace_id/);
});

test('buildEngagementDistributionQuery groups by coalesced address count', () => {
  const text = buildEngagementDistributionQuery();

  assert.match(text, /GROUP BY COALESCE\(addr\.address_count, 0\)/);
  assert.match(text, /ORDER BY COALESCE\(addr\.address_count, 0\)/);
});

test('buildGrowthSeries fills missing days with zero counts', () => {
  const rows = [
    { day: '2024-01-01T00:00:00.000Z', count: '2' },
    { day: '2024-01-03T00:00:00.000Z', count: '1' },
  ];

  const result = buildGrowthSeries(rows);

  assert.deepEqual(result, [
    { date: '2024-01-01', count: 2, cumulative: 2 },
    { date: '2024-01-02', count: 0, cumulative: 2 },
    { date: '2024-01-03', count: 1, cumulative: 3 },
  ]);
});
