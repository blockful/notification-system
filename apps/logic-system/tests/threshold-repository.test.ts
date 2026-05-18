import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ThresholdRepository } from '../src/repositories/threshold.repository';
import { makeAnticaptureClient } from '@notification-system/anticapture-client';

describe('ThresholdRepository', () => {
  let repository: ThresholdRepository;
  let getEventThreshold: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getEventThreshold = vi.fn();
    repository = new ThresholdRepository(
      makeAnticaptureClient({ getEventThreshold }),
      300_000,
    );
  });

  describe('getThreshold', () => {
    it('should fetch threshold from client on cache miss', async () => {
      getEventThreshold.mockResolvedValue('40000000000000000000000');

      const result = await repository.getThreshold('ENS', "DELEGATION");

      expect(result).toBe('40000000000000000000000');
      expect(getEventThreshold).toHaveBeenCalledWith(
        'ENS', "DELEGATION", "HIGH"
      );
    });

    it('should return cached value on cache hit', async () => {
      getEventThreshold.mockResolvedValue('40000000000000000000000');

      await repository.getThreshold('ENS', "DELEGATION");
      const result = await repository.getThreshold('ENS', "DELEGATION");

      expect(result).toBe('40000000000000000000000');
      expect(getEventThreshold).toHaveBeenCalledTimes(1);
    });

    it('should cache separately per daoId and type', async () => {
      getEventThreshold
        .mockResolvedValueOnce('1000')
        .mockResolvedValueOnce('2000')
        .mockResolvedValueOnce('3000');

      const r1 = await repository.getThreshold('ENS', "DELEGATION");
      const r2 = await repository.getThreshold('ENS', "TRANSFER");
      const r3 = await repository.getThreshold('UNISWAP', "DELEGATION");

      expect(r1).toBe('1000');
      expect(r2).toBe('2000');
      expect(r3).toBe('3000');
      expect(getEventThreshold).toHaveBeenCalledTimes(3);
    });

    it('should refetch after TTL expires', async () => {
      const shortTtlRepo = new ThresholdRepository(
        makeAnticaptureClient({ getEventThreshold }),
        100,
      );
      getEventThreshold
        .mockResolvedValueOnce('1000')
        .mockResolvedValueOnce('2000');

      const r1 = await shortTtlRepo.getThreshold('ENS', "DELEGATION");
      expect(r1).toBe('1000');

      await new Promise(resolve => setTimeout(resolve, 150));

      const r2 = await shortTtlRepo.getThreshold('ENS', "DELEGATION");
      expect(r2).toBe('2000');
      expect(getEventThreshold).toHaveBeenCalledTimes(2);
    });

    it('should return null when client returns null (fail-open)', async () => {
      getEventThreshold.mockResolvedValue(null);

      const result = await repository.getThreshold('ENS', "DELEGATION");

      expect(result).toBeNull();
    });

    it('should not cache null responses', async () => {
      getEventThreshold
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('5000');

      const r1 = await repository.getThreshold('ENS', "DELEGATION");
      const r2 = await repository.getThreshold('ENS', "DELEGATION");

      expect(r1).toBeNull();
      expect(r2).toBe('5000');
      expect(getEventThreshold).toHaveBeenCalledTimes(2);
    });

    it('should return null when client throws (fail-open)', async () => {
      getEventThreshold.mockRejectedValue(new Error('Network error'));

      const result = await repository.getThreshold('ENS', "DELEGATION");

      expect(result).toBeNull();
    });
  });
});
