import { JsonRpcProvider } from 'ethers';

const ensRpcUrl = process.env.ENS_RPC_URL || process.env.ETH_RPC_URL;

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 2000;
const MAX_BATCH_SIZE = 25;
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

let provider: JsonRpcProvider | null = null;

function getProvider() {
  if (!ensRpcUrl) return null;
  if (!provider) {
    provider = new JsonRpcProvider(ensRpcUrl);
  }
  return provider;
}

export type EnsResolutionResult = {
  map: Record<string, string | null>;
  available: boolean;
};

export function chunkAddresses(addresses: string[], batchSize: number): string[][] {
  if (batchSize <= 0) return [addresses];
  const batches: string[][] = [];
  for (let i = 0; i < addresses.length; i += batchSize) {
    batches.push(addresses.slice(i, i + batchSize));
  }
  return batches;
}

export async function resolveEnsNames(addresses: string[]): Promise<EnsResolutionResult> {
  const uniqueAddresses = Array.from(new Set(addresses));
  const resolved: Record<string, string | null> = {};

  const ensProvider = getProvider();
  if (!ensProvider || uniqueAddresses.length === 0) {
    uniqueAddresses.forEach((address) => {
      resolved[address] = null;
    });
    return { map: resolved, available: false };
  }

  for (const batch of chunkAddresses(uniqueAddresses, MAX_BATCH_SIZE)) {
    await Promise.all(
      batch.map(async (address) => {
        const cachedValue = getCachedValue(address);
        if (cachedValue !== undefined) {
          resolved[address] = cachedValue;
          return;
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
      })
    );
  }

  return { map: resolved, available: true };
}
