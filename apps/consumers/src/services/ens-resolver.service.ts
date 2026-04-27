/**
 * ENS Resolver Service
 * Handles ENS name resolution and reverse lookups using Viem.
 */

import { createPublicClient, http, getAddress } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';
import { createLogger, type Logger } from '@anticapture/observability';

export class EnsResolverService {
  private client;
  private readonly logger: Logger;

  constructor(rpcUrl?: string, logger: Logger = createLogger('consumers')) {
    this.client = createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl, {
        timeout: 5_000,  // 5 seconds timeout
        retryCount: 3,   // Try 3 times
        retryDelay: 500   // Wait 500ms between retries
      })
    });
    this.logger = logger.child({ component: 'EnsResolverService' });
  }

  /**
   * Resolve ENS name to Ethereum address
   * @param ensName The ENS name to resolve (e.g., "vitalik.eth")
   * @returns The resolved Ethereum address or null if not found
   */
  async resolveToAddress(ensName: string): Promise<string | null> {
    try {
      const address = await this.client.getEnsAddress({
        name: normalize(ensName)
      });
      return address;
    } catch (error) {
      this.logger.error(
        { err: error, ensName, event: 'ens.resolve_failed' },
        'failed to resolve ENS name',
      );
      return null;
    }
  }

  /**
   * Get display name for an address (ENS name or shortened address)
   * @param address The address
   * @returns ENS name if available, otherwise shortened address format
   */
  async resolveDisplayName(address: string): Promise<string> {
    try {
      const checksumAddress = getAddress(address);
      const ensName = await this.client.getEnsName({
        address: checksumAddress
      });
      if (ensName) return ensName;
    } catch (error) {
      this.logger.error(
        { err: error, address, event: 'ens.lookup_failed' },
        'failed to lookup ENS for address',
      );
    }
    
    return address;
  }
}