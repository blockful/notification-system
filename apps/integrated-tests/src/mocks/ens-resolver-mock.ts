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
   * Returns ENS names for known addresses or full address for others
   * @param address The Ethereum address
   * @returns ENS name if known, otherwise the full Ethereum address
   */
  async resolveDisplayName(address: string): Promise<string> {
    // Map of known ENS names for testing (keys must be lowercase)
    const ensNames: Record<string, string> = {
      '0xb8c2c29ee19d8307cb7255e1cd9cbde883a267d5': 'nick.eth',
      '0xd8da6bf26964af9d7eed9e03e53415d37aa96045': 'vitalik.eth',
    };

    const lowerAddress = address.toLowerCase();
    if (ensNames[lowerAddress]) {
      return Promise.resolve(ensNames[lowerAddress]);
    }
    return Promise.resolve(address);
  }
}