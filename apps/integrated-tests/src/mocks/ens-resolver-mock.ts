/**
 * Mock ENS Resolver Service for Integration Tests
 * 
 * This mock implementation provides synchronous responses to avoid
 * async operations that continue after test teardown.
 * It simulates the behavior of the real ENS resolver without making
 * actual network calls.
 */

export class MockEnsResolverService {
  /**
   * Mock implementation of ENS name to address resolution
   * Always returns null to simulate ENS name not found
   * @param ensName The ENS name to resolve
   * @returns Always returns null
   */
  async resolveToAddress(ensName: string): Promise<string | null> {
    // Return null synchronously (simulates ENS not found)
    return Promise.resolve(null);
  }

  /**
   * Mock implementation of address to display name resolution
   * Returns a shortened address format immediately without network calls
   * @param address The Ethereum address
   * @returns Shortened address format (0x1234...5678)
   */
  async resolveDisplayName(address: string): Promise<string> {
    // Return shortened address format immediately (no async operations)
    const shortened = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    return Promise.resolve(shortened);
  }
}