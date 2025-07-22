import { formatTokenAmount } from './number-formatter';

describe('formatTokenAmount', () => {
  describe('with 18 decimals (default)', () => {
    it('should format zero correctly', () => {
      expect(formatTokenAmount('0')).toBe('0');
      expect(formatTokenAmount(0)).toBe('0');
    });

    it('should format very small amounts as <0.1', () => {
      expect(formatTokenAmount('1')).toBe('<0.1'); // 1 wei
      expect(formatTokenAmount('50000000000000000')).toBe('<0.1'); // 0.05 token
      expect(formatTokenAmount('99999999999999999')).toBe('0.1'); // 0.099... token (rounds to 0.1)
    });

    it('should format small amounts with 1 decimal', () => {
      expect(formatTokenAmount('100000000000000000')).toBe('0.1'); // 0.1 token
      expect(formatTokenAmount('100000000000000001')).toBe('0.1'); // 0.1+ token (rounded)
      expect(formatTokenAmount('500000000000000000')).toBe('0.5'); // 0.5 token
      expect(formatTokenAmount('1000000000000000000')).toBe('1.0'); // 1 token
      expect(formatTokenAmount('1500000000000000000')).toBe('1.5'); // 1.5 tokens
      expect(formatTokenAmount('999000000000000000000')).toBe('999.0'); // 999 tokens
    });

    it('should format thousands with K suffix', () => {
      expect(formatTokenAmount('1000000000000000000000')).toBe('1.0K'); // 1,000 tokens
      expect(formatTokenAmount('1234000000000000000000')).toBe('1.2K'); // 1,234 tokens
      expect(formatTokenAmount('12345000000000000000000')).toBe('12.3K'); // 12,345 tokens
      expect(formatTokenAmount('999999000000000000000000')).toBe('1.0M'); // 999,999 tokens (rounded up to 1M)
    });

    it('should format millions with M suffix', () => {
      expect(formatTokenAmount('1000000000000000000000000')).toBe('1.0M'); // 1 million tokens
      expect(formatTokenAmount('1234567000000000000000000')).toBe('1.2M'); // 1.234567 million tokens
      expect(formatTokenAmount('999999999000000000000000000')).toBe('1.0B'); // ~1 billion tokens (rounded up to 1B)
    });

    it('should format billions with B suffix', () => {
      expect(formatTokenAmount('1000000000000000000000000000')).toBe('1.0B'); // 1 billion tokens
      expect(formatTokenAmount('1234567890000000000000000000')).toBe('1.2B'); // 1.23... billion tokens
    });

    it('should use exponential notation for very large numbers', () => {
      expect(formatTokenAmount('1000000000000000000000000000000')).toBe('1.0e+12'); // trillion (uses exponential)
    });

    it('should promote units when rounding results in 1000+', () => {
      // Test promotion from K to M (999.95K rounds to 1000.0K -> 1.0M)
      expect(formatTokenAmount('999950000000000000000000')).toBe('1.0M');
      
      // Test promotion from M to B (999.95M rounds to 1000.0M -> 1.0B)
      expect(formatTokenAmount('999950000000000000000000000')).toBe('1.0B');
    });
  });

  describe('with custom decimals', () => {
    it('should handle 6 decimals (like USDC)', () => {
      expect(formatTokenAmount('1000000', 6)).toBe('1.0'); // 1 USDC
      expect(formatTokenAmount('1500000', 6)).toBe('1.5'); // 1.5 USDC
      expect(formatTokenAmount('1000000000', 6)).toBe('1.0K'); // 1,000 USDC
    });

    it('should handle 8 decimals (like WBTC)', () => {
      expect(formatTokenAmount('100000000', 8)).toBe('1.0'); // 1 WBTC
      expect(formatTokenAmount('50000000', 8)).toBe('0.5'); // 0.5 WBTC
      expect(formatTokenAmount('100000000000', 8)).toBe('1.0K'); // 1,000 WBTC
    });
  });
});
