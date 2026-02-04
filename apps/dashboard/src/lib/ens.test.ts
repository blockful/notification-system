import assert from 'node:assert/strict';
import { test } from 'node:test';

import { chunkAddresses } from './ens';

test('chunkAddresses respects batch size limits', () => {
  const addresses = [
    '0x3b9f47629cd4d5903cf3eb897aac4f6b41dd2589',
    '0x0000000000000000000000000000000000000000',
    '0x742d35cc6634c0532925a3b844bc454e4438f44e',
    '0x53d284357ec70ce289d6d64134dfac8e511c8a3d',
    '0xfe9e8709d3215310075d67e3ed32a380ccf451c8',
    '0x66f820a414680b5bcda5eeca5dea238543f42054',
  ];

  const batches = chunkAddresses(addresses, 2);

  assert.equal(batches.length, 3);
  assert.deepEqual(batches[0], addresses.slice(0, 2));
  assert.deepEqual(batches[1], addresses.slice(2, 4));
  assert.deepEqual(batches[2], addresses.slice(4, 6));
});

test('chunkAddresses returns a single batch for non-positive sizes', () => {
  const addresses = [
    '0x3b9f47629cd4d5903cf3eb897aac4f6b41dd2589',
    '0x742d35cc6634c0532925a3b844bc454e4438f44e',
  ];

  assert.deepEqual(chunkAddresses(addresses, 0), [addresses]);
  assert.deepEqual(chunkAddresses(addresses, -5), [addresses]);
});
