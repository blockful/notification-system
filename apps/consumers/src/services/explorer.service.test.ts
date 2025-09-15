import { describe, it, expect, beforeEach } from '@jest/globals';
import { ExplorerService } from './explorer.service';

describe('ExplorerService', () => {
  let explorerService: ExplorerService;

  beforeEach(() => {
    explorerService = new ExplorerService();
  });

  describe('getTransactionLink', () => {
    it('should return Etherscan link for Ethereum mainnet (chainId: 1)', () => {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = explorerService.getTransactionLink(1, hash);
      expect(result).toBe('https://etherscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    });

    it('should return Arbiscan link for Arbitrum (chainId: 42161)', () => {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = explorerService.getTransactionLink(42161, hash);
      expect(result).toBe('https://arbiscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    });

    it('should return Optimistic Etherscan link for Optimism (chainId: 10)', () => {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = explorerService.getTransactionLink(10, hash);
      expect(result).toBe('https://optimistic.etherscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    });

    it('should return empty string for unknown chain', () => {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = explorerService.getTransactionLink(999999, hash);
      expect(result).toBe('');
    });

    it('should return empty string for invalid hash format', () => {
      const hash = 'invalid-hash';
      const result = explorerService.getTransactionLink(1, hash);
      expect(result).toBe('');
    });

    it('should return empty string for empty hash', () => {
      const result = explorerService.getTransactionLink(1, '');
      expect(result).toBe('');
    });
    
    it('should return empty string for 0x-only hash', () => {
      const result = explorerService.getTransactionLink(1, '0x');
      expect(result).toBe('');
    });

    it('should handle undefined chainId gracefully', () => {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = explorerService.getTransactionLink(undefined as any, hash);
      expect(result).toBe('');
    });

    it('should handle null chainId gracefully', () => {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = explorerService.getTransactionLink(null as any, hash);
      expect(result).toBe('');
    });
  });

});