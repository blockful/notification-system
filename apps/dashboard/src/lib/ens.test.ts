import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  chunkAddresses,
  resolveAddressOrEns,
  resolveEnsNames,
  setEnsProviderForTests,
} from './ens';

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

test('resolveEnsNames limits concurrent lookups', async () => {
  const addresses = [
    '0x3b9f47629cd4d5903cf3eb897aac4f6b41dd2589',
    '0x0000000000000000000000000000000000000000',
    '0x742d35cc6634c0532925a3b844bc454e4438f44e',
    '0x53d284357ec70ce289d6d64134dfac8e511c8a3d',
    '0xfe9e8709d3215310075d67e3ed32a380ccf451c8',
    '0x66f820a414680b5bcda5eeca5dea238543f42054',
  ];

  let inFlight = 0;
  let maxInFlight = 0;

  setEnsProviderForTests({
    lookupAddress: async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
      return null;
    },
  });

  const { map, available } = await resolveEnsNames(addresses);

  assert.equal(available, true);
  assert.equal(Object.keys(map).length, addresses.length);
  assert.ok(maxInFlight <= 5);

  setEnsProviderForTests(null);
});

test('resolveEnsNames falls back to ethfollow when no RPC provider', async () => {
  const address = '0x983110309620d911731ac0932219af06091b6744';
  const originalFetch = globalThis.fetch;
  let called = false;

  globalThis.fetch = (async (input: string | URL) => {
    called = true;
    const url = input.toString();
    assert.match(url, /api\/v1\/users\/.*\/ens/);
    return {
      ok: true,
      json: async () => ({
        ens: {
          name: 'brantly.eth',
          address,
        },
      }),
    } as Response;
  }) as typeof fetch;

  try {
    const { map, available } = await resolveEnsNames([address]);
    assert.equal(available, true);
    assert.equal(map[address], 'brantly.eth');
    assert.equal(called, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('resolveAddressOrEns resolves ENS names to addresses', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => {
    return {
      ok: true,
      json: async () => ({
        ens: {
          name: 'vitalik.eth',
          address: '0x000000000000000000000000000000000000dead',
        },
      }),
    } as Response;
  }) as typeof fetch;

  try {
    const result = await resolveAddressOrEns('vitalik.eth');
    assert.equal(result.available, true);
    assert.equal(result.address, '0x000000000000000000000000000000000000dead');
    assert.equal(result.ensName, 'vitalik.eth');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
