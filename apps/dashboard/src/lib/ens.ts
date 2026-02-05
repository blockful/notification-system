const ethfollowApiBase = 'https://api.ethfollow.xyz';

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2000;
const MAX_BATCH_SIZE = 25;
const MAX_LOOKUP_CONCURRENCY = 5;
const ensCache = new Map<string, { value: string | null; expiresAt: number }>();

function getCachedValue(address: string): string | null | undefined {
  const cached = ensCache.get(address);
  if (!cached) return undefined;
  if (cached.expiresAt < Date.now()) {
    ensCache.delete(address);
    return undefined;
  }
  return cached.value;
}

function setCachedValue(address: string, value: string | null) {
  if (ensCache.size >= MAX_CACHE_ENTRIES) {
    const firstKey = ensCache.keys().next().value;
    if (firstKey) ensCache.delete(firstKey);
  }
  ensCache.set(address, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

type EnsProvider = {
  lookupAddress: (address: string) => Promise<string | null>;
};

let provider: EnsProvider | null = null;
let fallbackProvider: EnsProvider | null = null;

function getProvider() {
  return provider;
}

function hasFetch() {
  return typeof fetch === 'function';
}

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

function isHexAddress(value: string) {
  return ADDRESS_REGEX.test(value);
}

type EnsLookupRecord = {
  name: string | null;
  address: string | null;
};

async function fetchEnsRecord(addressOrEns: string): Promise<EnsLookupRecord | null> {
  if (!hasFetch()) return null;
  const url = new URL(`/api/v1/users/${encodeURIComponent(addressOrEns)}/ens`, ethfollowApiBase);
  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`ETHFOLLOW lookup failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    ens?: { name?: string; address?: string };
  } | null;
  const ens = data?.ens;
  if (!ens) return { name: null, address: null };
  return {
    name: typeof ens.name === 'string' ? ens.name : null,
    address: typeof ens.address === 'string' ? ens.address : null,
  };
}

async function lookupWithEthfollow(address: string): Promise<string | null> {
  const record = await fetchEnsRecord(address);
  if (!record?.name) return null;
  if (record.address && record.address.toLowerCase() !== address.toLowerCase()) {
    return null;
  }
  return record.name;
}

function getFallbackProvider() {
  if (fallbackProvider) return fallbackProvider;
  if (!hasFetch()) return null;
  fallbackProvider = {
    lookupAddress: lookupWithEthfollow,
  };
  return fallbackProvider;
}

export type EnsResolutionResult = {
  map: Record<string, string | null>;
  available: boolean;
};

export function setEnsProviderForTests(testProvider: EnsProvider | null) {
  provider = testProvider;
  fallbackProvider = null;
}

export function chunkAddresses(addresses: string[], batchSize: number): string[][] {
  if (batchSize <= 0) return [addresses];
  const batches: string[][] = [];
  for (let i = 0; i < addresses.length; i += batchSize) {
    batches.push(addresses.slice(i, i + batchSize));
  }
  return batches;
}

async function resolveBatch(
  batch: string[],
  ensProvider: EnsProvider,
  resolved: Record<string, string | null>
) {
  let index = 0;
  const workerCount = Math.min(MAX_LOOKUP_CONCURRENCY, batch.length);

  const workers = Array.from({ length: workerCount }, async () => {
    while (index < batch.length) {
      const currentIndex = index;
      index += 1;
      if (currentIndex >= batch.length) return;

      const address = batch[currentIndex];
      const cachedValue = getCachedValue(address);
      if (cachedValue !== undefined) {
        resolved[address] = cachedValue;
        continue;
      }

      try {
        const name = await ensProvider.lookupAddress(address);
        resolved[address] = name;
        setCachedValue(address, name);
      } catch (error) {
        console.warn(`Failed ENS lookup for ${address}:`, error);
        resolved[address] = null;
        setCachedValue(address, null);
      }
    }
  });

  await Promise.all(workers);
}

export async function resolveEnsNames(addresses: string[]): Promise<EnsResolutionResult> {
  const uniqueAddresses = Array.from(new Set(addresses));
  const resolved: Record<string, string | null> = {};

  const ensProvider = getProvider() ?? getFallbackProvider();
  if (!ensProvider || uniqueAddresses.length === 0) {
    uniqueAddresses.forEach((address) => {
      resolved[address] = null;
    });
    return { map: resolved, available: false };
  }

  for (const batch of chunkAddresses(uniqueAddresses, MAX_BATCH_SIZE)) {
    await resolveBatch(batch, ensProvider, resolved);
  }

  return { map: resolved, available: true };
}

export type EnsAddressResult = {
  address: string | null;
  ensName: string | null;
  available: boolean;
};

export async function resolveAddressOrEns(addressOrEns: string): Promise<EnsAddressResult> {
  const value = addressOrEns.trim();
  if (!value) {
    return { address: null, ensName: null, available: false };
  }
  if (isHexAddress(value)) {
    return { address: value, ensName: null, available: true };
  }

  try {
    const record = await fetchEnsRecord(value);
    if (!record) {
      return { address: null, ensName: null, available: false };
    }
    return {
      address: record.address ?? null,
      ensName: record.name ?? null,
      available: true,
    };
  } catch (error) {
    console.warn(`Failed ENS lookup for ${value}:`, error);
    return { address: null, ensName: null, available: true };
  }
}
