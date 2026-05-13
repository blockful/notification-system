import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mocked } from 'vitest';
import { ThresholdRepository } from '../src/repositories/threshold.repository';
import { feedEventTypeEnum, feedRelevanceEnum, IAnticaptureClient } from '@notification-system/anticapture-client';

const createMockAnticaptureClient = (): Mocked<IAnticaptureClient> => ({
  getDAOs: vi.fn().mockResolvedValue([]),
  getProposalById: vi.fn().mockResolvedValue(null),
  listProposals: vi.fn().mockResolvedValue([]),
  listVotingPowerHistory: vi.fn().mockResolvedValue([]),
  listVotes: vi.fn().mockResolvedValue([]),
  getProposalNonVoters: vi.fn().mockResolvedValue([]),
  getOffchainProposalNonVoters: vi.fn().mockResolvedValue([]),
  listRecentVotesFromAllDaos: vi.fn().mockResolvedValue([]),
  getEventThreshold: vi.fn(),
  listOffchainProposals: vi.fn().mockResolvedValue([]),
  listOffchainVotes: vi.fn().mockResolvedValue([]),
  listRecentOffchainVotesFromAllDaos: vi.fn().mockResolvedValue([]),
});

describe('ThresholdRepository', () => {
  let repository: ThresholdRepository;
  let mockClient: Mocked<IAnticaptureClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockAnticaptureClient();
    repository = new ThresholdRepository(mockClient, 300_000);
  });

  describe('getThreshold', () => {
    it('should fetch threshold from client on cache miss', async () => {
      mockClient.getEventThreshold.mockResolvedValue('40000000000000000000000');

      const result = await repository.getThreshold('ENS', feedEventTypeEnum.DELEGATION);

      expect(result).toBe('40000000000000000000000');
      expect(mockClient.getEventThreshold).toHaveBeenCalledWith(
        'ENS', feedEventTypeEnum.DELEGATION, feedRelevanceEnum.HIGH
      );
    });

    it('should return cached value on cache hit', async () => {
      mockClient.getEventThreshold.mockResolvedValue('40000000000000000000000');

      await repository.getThreshold('ENS', feedEventTypeEnum.DELEGATION);
      const result = await repository.getThreshold('ENS', feedEventTypeEnum.DELEGATION);

      expect(result).toBe('40000000000000000000000');
      expect(mockClient.getEventThreshold).toHaveBeenCalledTimes(1);
    });

    it('should cache separately per daoId and type', async () => {
      mockClient.getEventThreshold
        .mockResolvedValueOnce('1000')
        .mockResolvedValueOnce('2000')
        .mockResolvedValueOnce('3000');

      const r1 = await repository.getThreshold('ENS', feedEventTypeEnum.DELEGATION);
      const r2 = await repository.getThreshold('ENS', feedEventTypeEnum.TRANSFER);
      const r3 = await repository.getThreshold('UNISWAP', feedEventTypeEnum.DELEGATION);

      expect(r1).toBe('1000');
      expect(r2).toBe('2000');
      expect(r3).toBe('3000');
      expect(mockClient.getEventThreshold).toHaveBeenCalledTimes(3);
    });

    it('should refetch after TTL expires', async () => {
      const shortTtlRepo = new ThresholdRepository(mockClient, 100);
      mockClient.getEventThreshold
        .mockResolvedValueOnce('1000')
        .mockResolvedValueOnce('2000');

      const r1 = await shortTtlRepo.getThreshold('ENS', feedEventTypeEnum.DELEGATION);
      expect(r1).toBe('1000');

      await new Promise(resolve => setTimeout(resolve, 150));

      const r2 = await shortTtlRepo.getThreshold('ENS', feedEventTypeEnum.DELEGATION);
      expect(r2).toBe('2000');
      expect(mockClient.getEventThreshold).toHaveBeenCalledTimes(2);
    });

    it('should return null when client returns null (fail-open)', async () => {
      mockClient.getEventThreshold.mockResolvedValue(null);

      const result = await repository.getThreshold('ENS', feedEventTypeEnum.DELEGATION);

      expect(result).toBeNull();
    });

    it('should not cache null responses', async () => {
      mockClient.getEventThreshold
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('5000');

      const r1 = await repository.getThreshold('ENS', feedEventTypeEnum.DELEGATION);
      const r2 = await repository.getThreshold('ENS', feedEventTypeEnum.DELEGATION);

      expect(r1).toBeNull();
      expect(r2).toBe('5000');
      expect(mockClient.getEventThreshold).toHaveBeenCalledTimes(2);
    });

    it('should return null when client throws (fail-open)', async () => {
      mockClient.getEventThreshold.mockRejectedValue(new Error('Network error'));

      const result = await repository.getThreshold('ENS', feedEventTypeEnum.DELEGATION);

      expect(result).toBeNull();
    });
  });
});
