import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ThresholdRepository } from '../src/repositories/threshold.repository';
import { FeedEventType, FeedRelevance } from '@notification-system/anticapture-client';

const createMockAnticaptureClient = () => ({
  getEventThreshold: jest.fn<() => Promise<string | null>>()
});

describe('ThresholdRepository', () => {
  let repository: ThresholdRepository;
  let mockClient: ReturnType<typeof createMockAnticaptureClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = createMockAnticaptureClient();
    repository = new ThresholdRepository(mockClient as any, 300_000);
  });

  describe('getThreshold', () => {
    it('should fetch threshold from client on cache miss', async () => {
      mockClient.getEventThreshold.mockResolvedValue('40000000000000000000000');

      const result = await repository.getThreshold('ENS', FeedEventType.Delegation);

      expect(result).toBe('40000000000000000000000');
      expect(mockClient.getEventThreshold).toHaveBeenCalledWith(
        'ENS', FeedEventType.Delegation, FeedRelevance.High
      );
    });

    it('should return cached value on cache hit', async () => {
      mockClient.getEventThreshold.mockResolvedValue('40000000000000000000000');

      await repository.getThreshold('ENS', FeedEventType.Delegation);
      const result = await repository.getThreshold('ENS', FeedEventType.Delegation);

      expect(result).toBe('40000000000000000000000');
      expect(mockClient.getEventThreshold).toHaveBeenCalledTimes(1);
    });

    it('should cache separately per daoId and type', async () => {
      mockClient.getEventThreshold
        .mockResolvedValueOnce('1000')
        .mockResolvedValueOnce('2000')
        .mockResolvedValueOnce('3000');

      const r1 = await repository.getThreshold('ENS', FeedEventType.Delegation);
      const r2 = await repository.getThreshold('ENS', FeedEventType.Transfer);
      const r3 = await repository.getThreshold('UNISWAP', FeedEventType.Delegation);

      expect(r1).toBe('1000');
      expect(r2).toBe('2000');
      expect(r3).toBe('3000');
      expect(mockClient.getEventThreshold).toHaveBeenCalledTimes(3);
    });

    it('should refetch after TTL expires', async () => {
      const shortTtlRepo = new ThresholdRepository(mockClient as any, 100);
      mockClient.getEventThreshold
        .mockResolvedValueOnce('1000')
        .mockResolvedValueOnce('2000');

      const r1 = await shortTtlRepo.getThreshold('ENS', FeedEventType.Delegation);
      expect(r1).toBe('1000');

      await new Promise(resolve => setTimeout(resolve, 150));

      const r2 = await shortTtlRepo.getThreshold('ENS', FeedEventType.Delegation);
      expect(r2).toBe('2000');
      expect(mockClient.getEventThreshold).toHaveBeenCalledTimes(2);
    });

    it('should return null when client returns null (fail-open)', async () => {
      mockClient.getEventThreshold.mockResolvedValue(null);

      const result = await repository.getThreshold('ENS', FeedEventType.Delegation);

      expect(result).toBeNull();
    });

    it('should not cache null responses', async () => {
      mockClient.getEventThreshold
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('5000');

      const r1 = await repository.getThreshold('ENS', FeedEventType.Delegation);
      const r2 = await repository.getThreshold('ENS', FeedEventType.Delegation);

      expect(r1).toBeNull();
      expect(r2).toBe('5000');
      expect(mockClient.getEventThreshold).toHaveBeenCalledTimes(2);
    });

    it('should return null when client throws (fail-open)', async () => {
      mockClient.getEventThreshold.mockRejectedValue(new Error('Network error'));

      const result = await repository.getThreshold('ENS', FeedEventType.Delegation);

      expect(result).toBeNull();
    });
  });
});
