/**
 * Explorer Service
 * Handles blockchain explorer URL generation for transaction links using Viem.
 */

import * as chains from 'viem/chains';
import { isHash, extractChain } from 'viem';
import type { Chain } from 'viem';

export class ExplorerService {
  
  /**
   * Generate transaction URL for a given chain and transaction hash
   * @param chainId The EIP-155 chain ID
   * @param transactionHash The transaction hash
   * @returns Formatted message with transaction link or empty string if hash is invalid
   */
  public getTransactionLink(chainId: number, transactionHash: string): string {
    // Validate hash using viem's isHash utility
    if (!isHash(transactionHash)) {
      return '';
    }
    
    const chain = extractChain({
      chains: Object.values(chains),
      id: chainId as any
    });
    
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