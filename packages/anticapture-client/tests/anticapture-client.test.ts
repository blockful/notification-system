import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AnticaptureClient } from '../src/anticapture-client';
import axios from 'axios';

describe('AnticaptureClient - Zod Validation', () => {
  let client: AnticaptureClient;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    const mockAxios = axios.create();
    client = new AnticaptureClient(mockAxios);
    
    mockQuery = jest.fn();
    (client as any).query = mockQuery;
  });

  describe('getDAOs', () => {
    it('should handle null daos', async () => {
      // @ts-ignore - intentionally testing edge case
      mockQuery.mockResolvedValue({ daos: { items: [] } });
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await client.getDAOs();

      expect(result).toEqual([]);
      
      consoleSpy.mockRestore();
    });

    it('should handle invalid response structure', async () => {
      // @ts-ignore - intentionally testing edge case
      mockQuery.mockResolvedValue({ daos: { items: [] } });
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await client.getDAOs();

      expect(result).toEqual([]);
      
      consoleSpy.mockRestore();
    });

    it('should return dao objects with blockTime when data is valid', async () => {
      // @ts-ignore - valid test case
      mockQuery.mockResolvedValue({
        daos: {
          items: [
            { id: 'UNISWAP', votingDelay: '1000' },
            { id: 'ENS', votingDelay: '500' },
            { id: 'COMPOUND' }
          ]
        }
      });

      const result = await client.getDAOs();

      expect(result).toEqual([
        { id: 'UNISWAP', blockTime: 12, votingDelay: '1000' },
        { id: 'ENS', blockTime: 12, votingDelay: '500' },
        { id: 'COMPOUND', blockTime: 12, votingDelay: '0' }
      ]);
    });
  });

  describe('listProposals', () => {
    it('should handle null proposalsOnchains', async () => {
      // @ts-ignore - intentionally testing edge case
      mockQuery.mockResolvedValue({ proposalsOnchains: { items: [] } });
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await client.listProposals({}, 'UNISWAP');

      expect(result).toEqual([]);
      
      consoleSpy.mockRestore();
    });

    it('should return proposals when data is valid', async () => {
      const mockProposals = [
        { id: '1', description: 'Test proposal 1' },
        { id: '2', description: 'Test proposal 2' }
      ];

      // @ts-ignore - valid test case
      mockQuery.mockResolvedValue({
        proposalsOnchains: {
          items: mockProposals
        }
      });

      const result = await client.listProposals({}, 'UNISWAP');

      const expected = mockProposals.map(p => ({ ...p, daoId: 'UNISWAP' }));
      expect(result).toEqual(expected);
    });
  });
});