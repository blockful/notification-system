/**
 * Explorer Service
 * Handles blockchain explorer URL generation for transaction links using Viem.
 */

import * as chains from 'viem/chains';
import type { Chain } from 'viem';

export class ExplorerService {
  private readonly chainMap = new Map<number, Chain>();
  
  constructor() {
    // Build a map of chainId -> Chain for efficient lookups
    Object.values(chains).forEach(chain => {
      if (typeof chain === 'object' && 'id' in chain) {
        this.chainMap.set(chain.id, chain);
      }
    });
  }
  
  /**
   * Generate transaction URL for a given chain and transaction hash
   * @param chainId The EIP-155 chain ID
   * @param transactionHash The transaction hash
   * @returns Formatted message with transaction link or just the hash if explorer not found
   */
  public getTransactionLink(chainId: number, transactionHash: string): string {
    const chain = this.chainMap.get(chainId);
      
    if (chain?.blockExplorers?.default?.url) {
      // Ensure transaction hash is properly formatted with 0x prefix
      const formattedHash = transactionHash.startsWith('0x') 
        ? transactionHash 
        : `0x${transactionHash}`;
      
      const explorerUrl = `${chain.blockExplorers.default.url}/tx/${formattedHash}`;
      return `View transaction: ${explorerUrl}`;
    }
    
    // Fallback when explorer is not available or chain not found
    return `Transaction: ${transactionHash}`;
  }
}